// ツイート取得のコア：Twitter 公開 syndication endpoint（公式埋め込みが内部で叩くもの）を呼び正規化する。
// ブラウザからは cdn.syndication.twimg.com を直接呼べない（CORS）ため、サーバ側 / dev middleware で取得する。
// ファイル名がアンダースコア始まり → Vercel が独立した API route として扱わない。

// tweet id から syndication token を導出（react-tweet と同じ方式）
export function getToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '')
}

/**
 * 単一ツイートを取得して正規化する。
 * @param {string} id   数字のみの tweet id
 * @param {string} lang 表示言語（日付などに影響、既定は ja）
 * @returns {Promise<object>} 正規化後のツイートデータ、または { id, tombstone: true }
 */
export async function fetchTweet(id, lang = 'ja') {
  const url =
    `https://cdn.syndication.twimg.com/tweet-result?id=${id}` +
    `&token=${getToken(id)}&lang=${encodeURIComponent(lang)}`

  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; yumemi-illust-link/1.0)',
      Accept: 'application/json',
    },
  })
  if (!r.ok) {
    const err = new Error('upstream ' + r.status)
    err.status = r.status
    throw err
  }

  const data = await r.json()

  // ツイートが削除 / 制限（センシティブ）→ tombstone。フロントの fallback に委ねる
  if (data.__typename === 'TweetTombstone') {
    return { id, tombstone: true }
  }

  // 画像取得：まず photos（幅高さ付きで masonry の領域確保に有利）、無ければ mediaDetails
  let photos = Array.isArray(data.photos)
    ? data.photos.map((p) => ({ url: p.url, width: p.width, height: p.height }))
    : []
  if (!photos.length && Array.isArray(data.mediaDetails)) {
    photos = data.mediaDetails.map((m) => ({
      url: m.media_url_https,
      width: m.original_info?.width,
      height: m.original_info?.height,
    }))
  }

  const handle = data.user?.screen_name ?? null
  const tweetId = data.id_str || id

  // メンションされたアカウント（表示名込み）→ フロントで絵師名を正確に表示するため
  const mentions = Array.isArray(data.entities?.user_mentions)
    ? data.entities.user_mentions
        .filter((u) => u?.screen_name)
        .map((u) => ({ handle: u.screen_name, name: u.name ?? u.screen_name }))
    : []

  return {
    id: tweetId,
    tombstone: false,
    name: data.user?.name ?? null,
    handle,
    avatar: data.user?.profile_image_url_https ?? null,
    verified: !!(data.user?.is_blue_verified || data.user?.verified),
    text: data.text ?? '',
    photos,
    mentions,
    createdAt: data.created_at ?? null,
    url: handle
      ? `https://x.com/${handle}/status/${tweetId}`
      : `https://x.com/i/status/${tweetId}`,
  }
}
