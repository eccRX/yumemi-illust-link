// Vercel Serverless Function：GET /api/tweet?id=<tweetId>&lang=ja
// Twitter syndication endpoint をプロキシし、ブラウザの CORS を回避しつつ edge キャッシュを付与する。
// （Vercel 以外で配信する場合は不要。ビルド時プリフェッチで全データが焼き込まれるため、
//   このエンドポイントは「build 後に追加したツイート」の実行時フォールバック用です。）
import { fetchTweet } from './_tweet-core.js'

export default async function handler(req, res) {
  const id = req.query?.id
  const lang = req.query?.lang || 'ja'

  if (!id || !/^\d+$/.test(String(id))) {
    res.status(400).json({ error: 'invalid id' })
    return
  }

  try {
    const data = await fetchTweet(String(id), String(lang))
    // 1 時間は新鮮、その後 1 日は古いデータを返しつつ背景更新（ツイート内容はほぼ変化しない）
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json(data)
  } catch (e) {
    res.status(502).json({ error: 'fetch failed', message: String(e?.message || e) })
  }
}
