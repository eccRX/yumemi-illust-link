<script setup lang="ts">
// 画像カード：画像 + 任意のタイトル/説明。画像クリックでライトボックス。downloadUrl がある時だけダウンロードボタン表示
import type { ImageItem } from '../types'
import { useLightbox } from '../composables/useLightbox'
import DownloadButton from './DownloadButton.vue'

const props = defineProps<{ item: ImageItem }>()
const { show } = useLightbox()
</script>

<template>
  <article class="card p-4">
    <button
      type="button"
      class="group block w-full overflow-hidden rounded-2xl"
      @click="show(props.item.src, props.item.title || '')"
    >
      <img
        :src="props.item.src"
        :alt="props.item.title || 'イラスト'"
        loading="lazy"
        class="w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    </button>

    <div v-if="item.title || item.caption || item.downloadUrl" class="space-y-2 pt-3">
      <p v-if="item.title" class="font-display text-sm font-bold text-ink">{{ item.title }}</p>
      <p v-if="item.caption" class="text-sm leading-relaxed text-ink-soft">{{ item.caption }}</p>
      <DownloadButton :url="item.downloadUrl" />
    </div>
  </article>
</template>
