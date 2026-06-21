<script setup lang="ts">
// サイト共通のライトボックス：Reka UI Dialog で画像を拡大。状態は useLightbox シングルトンから
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  VisuallyHidden,
} from 'reka-ui'
import { useLightbox } from '../composables/useLightbox'

const { open, src, alt, close } = useLightbox()

function onOpenChange(value: boolean) {
  if (!value) close()
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm data-[state=open]:animate-fade-in"
      />
      <DialogContent
        class="fixed inset-0 z-50 grid place-items-center p-4 focus:outline-none data-[state=open]:animate-fade-in"
        @click="close"
      >
        <VisuallyHidden>
          <DialogTitle>画像プレビュー</DialogTitle>
        </VisuallyHidden>
        <img
          :src="src"
          :alt="alt"
          class="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
          @click.stop
        />
        <DialogClose
          class="fixed right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur transition hover:bg-white/25"
          aria-label="閉じる"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
