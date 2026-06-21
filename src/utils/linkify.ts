// ツイート本文 → 安全な HTML：
//  - #hashtag → X のタグ検索へリンク
//  - https://… → 自動リンク化
//  - @mention → 相手アカウントへリンク
//  - 末尾の https://t.co/… を除去（添付画像の短縮 URL。画像は別途埋め込み表示済み）
// 安全性：まず純文字を区間ごとに escape し、受控の <a>（href は http/https のみ）だけを挿入して XSS を防ぐ。

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const ATTR = 'target="_blank" rel="noopener noreferrer" class="tw-link"'

export function linkifyTweet(raw?: string | null): string {
  if (!raw) return ''
  // 末尾の t.co 短縮 URL（添付リンク）を 1 個だけ除去（複数あっても最後の 1 個のみ）
  const text = raw.replace(/\s*https?:\/\/t\.co\/\w+\s*$/iu, '')

  // 順に照合：URL / #タグ / @メンション
  const re = /(https?:\/\/[^\s]+)|(#[\p{L}\p{N}_]+)|(@\w+)/gu
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    out += esc(text.slice(last, m.index))
    if (m[1]) {
      out += `<a href="${esc(m[1])}" ${ATTR}>${esc(m[1])}</a>`
    } else if (m[2]) {
      const tag = m[2].slice(1)
      out += `<a href="https://x.com/hashtag/${encodeURIComponent(tag)}" ${ATTR}>${esc(m[2])}</a>`
    } else if (m[3]) {
      const handle = m[3].slice(1)
      out += `<a href="https://x.com/${encodeURIComponent(handle)}" ${ATTR}>${esc(m[3])}</a>`
    }
    last = re.lastIndex
  }
  out += esc(text.slice(last))
  return out
}
