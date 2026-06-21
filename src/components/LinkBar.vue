<script setup lang="ts">
// 上部 sticky バー：タイトル + bio + リンク集ドロップダウン（content.json.profile 駆動）
import type { Profile } from '../types'
import LinkMenu from './LinkMenu.vue'

defineProps<{ profile: Profile }>()
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-black/5 bg-white/75 backdrop-blur-md"
  >
    <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
      <div class="min-w-0 flex-1">
        <h1 class="truncate font-display text-base font-bold text-ink sm:text-lg">
          {{ profile.name }}
        </h1>
        <p v-if="profile.bio" class="truncate text-xs text-ink-muted sm:text-sm">
          {{ profile.bio }}
        </p>
      </div>

      <LinkMenu v-if="profile.links?.length" :links="profile.links" />
    </div>
  </header>
</template>
