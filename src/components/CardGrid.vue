<script setup lang="ts">
// 順序を保つ masonry：CSS Grid + 動的 row-span。
// CSS columns と違い DOM 順序 = 視覚順序（左→右→下）なので「日付順」の読み順を保てる。
// 高さの異なるカードも自然に敷き詰める。span は各カードの実高さから算出（画像読込/改行/幅変更で自動再計算）。
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { CardEntry } from '../types'
import { extractTweetId } from '../composables/useTweet'
import TweetCard from './TweetCard.vue'
import ImageCard from './ImageCard.vue'

const props = defineProps<{ entries: CardEntry[] }>()

const grid = ref<HTMLElement | null>(null)
const ROW = 8 // grid-auto-rows の行高(px)。span の粒度を決める
const GAP = 20 // カード間の縦間隔(px)。余分な行数で表現する

let ro: ResizeObserver | null = null

// 「カード内容要素」の高さから、外側 cell の grid-row span を設定
function applySpan(inner: Element) {
  const cell = (inner as HTMLElement).parentElement
  if (!cell) return
  const h = (inner as HTMLElement).getBoundingClientRect().height
  if (!h) return
  cell.style.gridRowEnd = `span ${Math.ceil((h + GAP) / ROW)}`
}

function observeAll() {
  const g = grid.value
  if (!g || !ro) return
  ro.disconnect()
  for (const cell of Array.from(g.children)) {
    const inner = cell.firstElementChild
    if (inner) {
      ro.observe(inner)
      applySpan(inner)
    }
  }
}

onMounted(() => {
  ro = new ResizeObserver((list) => {
    for (const e of list) applySpan(e.target)
  })
  observeAll()
})

onBeforeUnmount(() => ro?.disconnect())

// 項目が変化（並べ替えデータが揃う）したら再観測
watch(
  () => props.entries,
  async () => {
    await nextTick()
    observeAll()
  },
  { flush: 'post' },
)

// v-for 用の安定したキー
function keyFor(entry: CardEntry): string {
  if (entry.item.type === 'tweet') return 'tw:' + (extractTweetId(entry.item.url) ?? entry.item.url)
  return 'img:' + entry.item.src
}
</script>

<template>
  <div
    ref="grid"
    class="masonry mx-auto max-w-5xl px-4 py-6 sm:px-6"
  >
    <div v-for="entry in entries" :key="keyFor(entry)" class="masonry-cell">
      <TweetCard
        v-if="entry.item.type === 'tweet'"
        :item="entry.item"
        :data="entry.data"
      />
      <ImageCard v-else-if="entry.item.type === 'image'" :item="entry.item" />
    </div>
  </div>
</template>

<style scoped>
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 8px; /* script の ROW に対応 */
  column-gap: 20px; /* script の GAP に対応（縦間隔は span で処理） */
  align-items: start;
}
/* cell の grid-row span は script が動的に設定。計算前は 1（aspect 比の領域確保で重なりのチラつきを緩和） */
.masonry-cell {
  grid-row-end: span 1;
}
</style>
