import { ref } from 'vue'
import type { Content } from '../types'

// モジュールレベルのシングルトン：content.json はサイト全体で一度だけ読み込む
const content = ref<Content | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useContent() {
  async function load() {
    if (content.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const r = await fetch('/content.json', { cache: 'no-cache' })
      if (!r.ok) throw new Error('content.json ' + r.status)
      content.value = (await r.json()) as Content
    } catch (e) {
      error.value = String((e as Error)?.message || e)
    } finally {
      loading.value = false
    }
  }

  return { content, loading, error, load }
}
