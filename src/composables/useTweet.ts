import { ref, type Ref } from 'vue'
import type { TweetData } from '../types'

// モジュールレベルのキャッシュ：同じ id は一度だけ取得
const cache = new Map<string, TweetData>()

/** ツイート URL から数字のみの id を取り出す */
export function extractTweetId(url: string): string | null {
  const m = url.match(/status(?:es)?\/(\d+)/)
  return m?.[1] ?? null
}

export function useTweet(id: string) {
  const data: Ref<TweetData | null> = ref(cache.get(id) ?? null)
  const loading = ref(!data.value)
  const error = ref<string | null>(null)

  async function load() {
    if (data.value) return
    if (!/^\d+$/.test(id)) {
      error.value = 'invalid tweet id'
      loading.value = false
      return
    }
    loading.value = true
    error.value = null
    try {
      const r = await fetch(`/api/tweet?id=${encodeURIComponent(id)}`)
      if (!r.ok) throw new Error('api ' + r.status)
      const json = (await r.json()) as TweetData
      cache.set(id, json)
      data.value = json
    } catch (e) {
      error.value = String((e as Error)?.message || e)
    } finally {
      loading.value = false
    }
  }

  load()
  return { data, loading, error }
}
