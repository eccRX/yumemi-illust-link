import { ref } from 'vue'
import type { TweetData } from '../types'

// ビルド時プリフェッチのツイートデータ（id → 正規化データ）。サイト全体で一度だけ読み込む。
// scripts/prefetch-tweets.mjs が build/dev 前に public/tweets.json を生成する。
const map = ref<Record<string, TweetData>>({})
const avatars = ref<Record<string, string>>({}) // handle(lower) → アバター URL
const loaded = ref(false)
let promise: Promise<void> | null = null

export function loadTweets(): Promise<void> {
  if (promise) return promise
  const tweetsP = fetch('/tweets.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => {
      map.value = j as Record<string, TweetData>
    })
    .catch(() => {
      // プリフェッチ済みファイルが無い/失敗 → 実行時 /api/tweet フォールバックに委ねる
    })
  const avatarsP = fetch('/avatars.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => {
      avatars.value = j as Record<string, string>
    })
    .catch(() => {})
  promise = Promise.all([tweetsP, avatarsP]).then(() => {
    loaded.value = true
  })
  return promise
}

/** handle → アバター URL（ビルド時解決）。無ければ null */
export function getAvatar(handle: string): string | null {
  return avatars.value[handle.toLowerCase()] ?? null
}

/** プリフェッチ済みデータを取得。無ければ null（呼び出し側で runtime fallback 可） */
export function getPrefetched(id: string): TweetData | null {
  return map.value[id] ?? null
}

/**
 * コレクション全体から handle → 表示名を引く（全発文者・被メンションを集約）。
 * 用途：あるツイートでは #hashtag（名前なし）でも、別のツイートで @mention/発文者（名前あり）なら名前を表示できる。
 */
export function lookupName(handle: string): string | null {
  const h = handle.toLowerCase()
  for (const t of Object.values(map.value)) {
    if ((t.handle ?? '').toLowerCase() === h && t.name) return t.name
    for (const m of t.mentions ?? []) {
      if (m.handle.toLowerCase() === h) return m.name
    }
  }
  return null
}

export function useTweets() {
  return { map, loaded, loadTweets, getPrefetched }
}
