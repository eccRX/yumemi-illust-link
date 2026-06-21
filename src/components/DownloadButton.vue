<script setup lang="ts">
// ダウンロードボタン：url がある時だけ表示（原ファイルへのリンクを置ける）
defineProps<{ url?: string | null }>()
</script>

<template>
  <a
    v-if="url"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/40 transition hover:opacity-90"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    ダウンロード
  </a>
</template>
