// ビルド時プリフェッチ：public/content.json 内の全ツイートを syndication から取得・正規化し、
// public/tweets.json に書き出す（フロントはこれを直接読むため、訪問者側の API 往復が無くなる）。
//
// あわせて絵師アバターを handle → 画像 URL に解決し public/avatars.json に焼き込む。
//
// 付加価値：このスクリプトは「匿名」で取得する（＝訪問者と同条件）ため、制限ツイートを自動検出し、
// 末尾に一覧表示する（「どのツイートに手動 fallback が要るか」を運用者に知らせる）。
//
// dev と build の前に毎回実行される（package.json 参照）。
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { fetchTweet } from '../api/_tweet-core.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const CONTENT = resolve(root, 'public/content.json')
const OUT = resolve(root, 'public/tweets.json')
const AVATARS_OUT = resolve(root, 'public/avatars.json')

// アカウントではないタグ（絵師判定で除外。フロントの TweetCard と揃える）
const ARTIST_TAG_FILTER = new Set(['skeb'])

function extractId(url) {
  const m = String(url).match(/status(?:es)?\/(\d+)/)
  return m?.[1] ?? null
}

// Twitter アバター URL を 400x400 へ（syndication が返すのは _normal=48px）
function hiResAvatar(url) {
  return typeof url === 'string' ? url.replace(/_normal(\.\w+)(?:$|\?)/, '_400x400$1') : url
}

// unavatar 経由で handle → pbs アバター URL を解決（ビルド時に解決して焼き込み、訪問者側は外部依存ゼロ）
async function resolveAvatar(handle) {
  try {
    const r = await fetch(`https://unavatar.io/x/${encodeURIComponent(handle)}?json`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; yumemi-illust-link/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) return null
    const j = await r.json()
    // 本物の Twitter アバター（pbs）のみ採用。fallback 生成画像は無視
    return typeof j.url === 'string' && j.url.includes('pbs.twimg.com') ? j.url : null
  } catch {
    return null
  }
}

async function main() {
  const content = JSON.parse(await readFile(CONTENT, 'utf-8'))
  const items = Array.isArray(content.items) ? content.items : []
  const tweets = items.filter((i) => i?.type === 'tweet')

  const map = {}
  const restricted = [] // tombstone（年齢制限/削除/制限）
  const failed = [] // ネットワーク等のエラー
  let ok = 0

  // 同時実行数を制限（syndication のレート制限回避）
  const CONCURRENCY = 6
  const queue = [...tweets]
  async function worker() {
    for (;;) {
      const item = queue.shift()
      if (!item) return
      const id = extractId(item.url)
      if (!id) {
        failed.push({ url: item.url, reason: 'invalid url' })
        continue
      }
      try {
        const data = await fetchTweet(id, 'ja')
        map[id] = data
        if (data.tombstone) restricted.push(item)
        else ok++
      } catch (e) {
        failed.push({ url: item.url, reason: String(e?.message || e) })
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  await writeFile(OUT, JSON.stringify(map), 'utf-8')

  // ── 絵師アバター解決（handle → pbs アバター URL）───────────────
  // 絵師になり得る handle を収集：発文者・被メンション・本文の #/@ アカウント・content.json の手動 artist
  const avatars = {} // handle(lower) → url
  const need = new Set() // unavatar で解決が必要な handle
  for (const t of Object.values(map)) {
    if (t.handle) {
      const lower = t.handle.toLowerCase()
      if (t.avatar) avatars[lower] = hiResAvatar(t.avatar) // 発文者アバターは取得済み、外部リクエスト不要
      else need.add(t.handle)
    }
    for (const m of t.mentions ?? []) need.add(m.handle)
    for (const mm of String(t.text ?? '').matchAll(/[#@]([\p{L}\p{N}_]+)/gu)) {
      const tok = mm[1]
      if (tok && !ARTIST_TAG_FILTER.has(tok.toLowerCase())) need.add(tok)
    }
  }
  for (const item of tweets) if (item.artist?.handle) need.add(item.artist.handle)

  // 発文者アバターで既にカバー済みのものは解決不要
  const toResolve = [...need].filter((h) => !avatars[h.toLowerCase()])
  let avatarOk = 0
  const AV_CONCURRENCY = 4
  const aq = [...toResolve]
  async function avatarWorker() {
    for (;;) {
      const h = aq.shift()
      if (!h) return
      const url = await resolveAvatar(h)
      if (url) {
        avatars[h.toLowerCase()] = url
        avatarOk++
      }
    }
  }
  await Promise.all(Array.from({ length: AV_CONCURRENCY }, avatarWorker))
  await writeFile(AVATARS_OUT, JSON.stringify(avatars), 'utf-8')

  // ── レポート ─────────────────────────────────────────
  console.log(
    `[prefetch] ${tweets.length} 件: ${ok} 正常 / ${restricted.length} 制限 / ${failed.length} 失敗 → public/tweets.json`,
  )
  console.log(
    `[prefetch] 絵師アバター: ${Object.keys(avatars).length} 件解決（うち unavatar 解決 ${avatarOk} 件）→ public/avatars.json`,
  )

  if (restricted.length) {
    console.log('\n⚠ 制限ツイート（匿名では表示不可。content.json に fallback を追加してください）:')
    for (const item of restricted) {
      const hasFb = !!(item.fallback?.text || item.fallback?.image)
      console.log(`   - ${item.url}  ${hasFb ? '✓ fallback あり' : '✗ fallback なし（要追加）'}`)
    }
  }

  if (failed.length) {
    console.log('\n❌ 取得失敗（実行時 /api/tweet で再試行されます）:')
    for (const f of failed) console.log(`   - ${f.url}  (${f.reason})`)
  }
  console.log('')
}

main().catch((e) => {
  // プリフェッチ失敗はビルドを止めない（フロントに runtime fallback あり）が、明示的に報告する
  console.error('[prefetch] 失敗（ビルドは続行、runtime fallback に委譲）:', e?.message || e)
  process.exitCode = 0
})
