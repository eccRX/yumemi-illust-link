<script setup lang="ts">
// 一頁式エントリ：content.json + tweets.json を読み込み → 日付順に並べ替え → バー + masonry カード + ライトボックス
import { computed, onMounted } from 'vue'
import { useContent } from './composables/useContent'
import { useTweets } from './composables/useTweets'
import { extractTweetId } from './composables/useTweet'
import type { CardEntry } from './types'
import LinkBar from './components/LinkBar.vue'
import CardGrid from './components/CardGrid.vue'
import Lightbox from './components/Lightbox.vue'

const { content, error, load } = useContent()
const { loaded: tweetsLoaded, loadTweets, getPrefetched } = useTweets()

// 各項目の表示データと並べ替え用の時刻を解決し、ツイート時刻の新→旧で並べる（JSON の順序は無視）
const entries = computed<CardEntry[]>(() => {
  const c = content.value
  if (!c) return []
  const list: CardEntry[] = c.items.map((item) => {
    if (item.type === 'tweet') {
      const id = extractTweetId(item.url)
      const data = id ? getPrefetched(id) : null
      const ts = data?.createdAt ? Date.parse(data.createdAt) : null
      return { item, data, date: Number.isNaN(ts) ? null : ts }
    }
    const ts = item.date ? Date.parse(item.date) : null
    return { item, data: null, date: Number.isNaN(ts as number) ? null : ts }
  })
  // 新→旧。日付なし（tombstone/未指定）は最後尾、元の相対順序は保持
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (b.e.date ?? -Infinity) - (a.e.date ?? -Infinity) || a.i - b.i)
    .map(({ e }) => e)
})

onMounted(() => {
  load()
  loadTweets()
})
</script>

<template>
  <LinkBar v-if="content" :profile="content.profile" />

  <main class="min-h-[60vh]">
    <!-- 読み込み失敗 -->
    <div v-if="error && !content" class="grid place-items-center gap-2 py-24 text-center">
      <p class="text-sm text-ink-soft">コンテンツを読み込めませんでした。</p>
      <button
        type="button"
        class="rounded-full bg-accent-strong px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/40 transition hover:opacity-90"
        @click="load"
      >
        再試行
      </button>
    </div>

    <!-- 空の状態（表示できる項目が無い） -->
    <div
      v-else-if="content && tweetsLoaded && entries.length === 0"
      class="grid place-items-center py-24 text-center text-sm text-ink-muted"
    >
      <p>まだ作品がありません。</p>
    </div>

    <!-- 本体（content + tweets.json が揃ってから。日付順とランタイム往復回避を保証） -->
    <CardGrid v-else-if="content && tweetsLoaded" :entries="entries" />

    <!-- 読み込み中 -->
    <div v-else class="grid place-items-center py-24 text-sm text-ink-muted">読み込み中…</div>
  </main>

  <footer class="py-8 text-center text-xs text-ink-muted">
    <p>イラストの著作権は各クリエイターに帰属します。</p>
  </footer>

  <Lightbox />
</template>
