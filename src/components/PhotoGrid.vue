<script setup lang="ts">
// ツイートの添付画像：幅高さから aspect 比を確保（CLS を防ぎ、読み込み前から領域を確保）。
// サムネは small、ライトボックスは orig を使う。1 枚は全幅、複数枚は 2 列グリッド。クリックでライトボックス。
import type { TweetPhoto } from '../types'
import { useLightbox } from '../composables/useLightbox'

const props = defineProps<{ photos: TweetPhoto[]; alt?: string }>()
const { show } = useLightbox()

// twimg のサイズ指定：small≈680 / medium≈1200 / large≈2048 / orig＝原寸
function sized(url: string, name: 'small' | 'medium' | 'large' | 'orig'): string {
  try {
    const u = new URL(url)
    u.searchParams.set('name', name)
    return u.toString()
  } catch {
    return url
  }
}

const single = props.photos.length === 1
</script>

<template>
  <div
    v-if="props.photos.length"
    class="grid gap-1.5"
    :class="single ? 'grid-cols-1' : 'grid-cols-2'"
  >
    <button
      v-for="(p, i) in props.photos"
      :key="i"
      type="button"
      class="group relative block w-full overflow-hidden rounded-2xl bg-black/[0.04]"
      :style="single && p.width && p.height ? { aspectRatio: `${p.width} / ${p.height}` } : undefined"
      :class="single ? '' : 'aspect-square'"
      @click="show(sized(p.url, 'orig'), props.alt || '')"
    >
      <img
        :src="sized(p.url, 'small')"
        :alt="props.alt || ''"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    </button>
  </div>
</template>
