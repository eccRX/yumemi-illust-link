<script setup lang="ts">
// 右上角リンク集（Reka UI DropdownMenu）。content.json の profile.links 駆動。
// group でセクション分け、emoji 優先・無ければ SocialIcon。ギャラリーを主役にしつつリンクを整然と畳む。
import { computed } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from 'reka-ui'
import type { ProfileLink } from '../types'
import SocialIcon from './SocialIcon.vue'

const props = defineProps<{ links: ProfileLink[] }>()

// 連續同 group 聚為一段，保留原順序
const grouped = computed(() => {
  const out: { group: string | null; links: ProfileLink[] }[] = []
  for (const link of props.links) {
    const g = link.group ?? null
    const last = out[out.length - 1]
    if (last && last.group === g) last.links.push(link)
    else out.push({ group: g, links: [link] })
  }
  return out
})
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      class="group flex shrink-0 items-center gap-0 rounded-full border border-black/5 bg-white/70 px-2.5 py-2 text-sm font-medium text-sky-500 shadow-sm backdrop-blur transition hover:border-sky-300/60 hover:bg-white hover:text-sky-600 data-[state=open]:border-sky-300/60 data-[state=open]:text-sky-600 sm:gap-1.5 sm:px-3 sm:py-1.5"
      aria-label="リンク"
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
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span class="hidden sm:inline">リンク</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="hidden h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side-offset="8"
        align="end"
        class="z-50 flex max-h-[75vh] w-72 flex-col overflow-y-auto rounded-2xl border border-black/5 bg-white/95 p-2 shadow-2xl shadow-pink-200/50 ring-1 ring-black/5 backdrop-blur-xl data-[state=open]:animate-fade-in"
      >
        <template v-for="(section, si) in grouped" :key="si">
          <DropdownMenuSeparator
            v-if="si > 0"
            class="mx-2 my-1 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"
          />
          <DropdownMenuLabel
            v-if="section.group"
            class="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-sky-600/70"
          >
            {{ section.group }}
          </DropdownMenuLabel>

          <DropdownMenuItem
            v-for="link in section.links"
            :key="link.url"
            as="a"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group/item flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 outline-none transition hover:bg-black/[0.04] focus:bg-black/[0.04] data-[highlighted]:bg-black/[0.04]"
          >
            <span
              class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/5 bg-black/[0.03] text-base text-sky-500 transition group-hover/item:scale-110 group-hover/item:text-sky-600"
            >
              <span v-if="link.emoji" aria-hidden="true">{{ link.emoji }}</span>
              <SocialIcon v-else :icon="link.icon || 'link'" />
            </span>
            <span class="flex min-w-0 flex-col leading-tight">
              <span class="truncate text-sm font-medium text-ink group-hover/item:text-accent">
                {{ link.label || link.url }}
              </span>
              <span v-if="link.description" class="truncate text-[11px] text-ink-muted">
                {{ link.description }}
              </span>
            </span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
