import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
// 共通コア：ローカル dev と Vercel function で同じ取得/正規化ロジックを使う
import { fetchTweet } from './api/_tweet-core.js'

// 開発サーバ用：ローカルで /api/tweet を模擬する
// （本番は Vercel Serverless Function api/tweet.js が提供。このプラグインは serve 時のみ有効）
function devTweetApi(): PluginOption {
  return {
    name: 'dev-tweet-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/tweet')) return next()
        const u = new URL(req.url, 'http://localhost')
        const id = u.searchParams.get('id') || ''
        const lang = u.searchParams.get('lang') || 'ja'
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (!/^\d+$/.test(id)) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'invalid id' }))
          return
        }
        fetchTweet(id, lang)
          .then((data) => {
            res.statusCode = 200
            res.end(JSON.stringify(data))
          })
          .catch((e: unknown) => {
            res.statusCode = 502
            res.end(
              JSON.stringify({ error: 'fetch failed', message: String((e as Error)?.message || e) }),
            )
          })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), devTweetApi()],
  build: {
    target: 'es2020',
  },
})
