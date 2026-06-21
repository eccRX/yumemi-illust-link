<script setup lang="ts">
// ツイートカード：本文＋添付画像＋作者を描画。
// 取得元は App から渡る建置時プリフェッチ（tweets.json）。未取得なら実行時 /api/tweet にフォールバック。
// tombstone（削除/制限）や取得失敗時は content.json の fallback（無ければ既定文）に降格。
import { computed } from 'vue'
import type { TweetItem, TweetData } from '../types'
import { useTweet, extractTweetId } from '../composables/useTweet'
import { lookupName, getAvatar } from '../composables/useTweets'
import { linkifyTweet } from '../utils/linkify'
import PhotoGrid from './PhotoGrid.vue'
import DownloadButton from './DownloadButton.vue'

// 年齢制限などで匿名取得が弾かれた時の既定文
const RESTRICTED_TEXT =
  '年齢制限が設定されているため、こちらでは表示できません。Twitter で開いてご覧ください。'

// 絵師判定で「アカウントではないタグ」を除外する集合。
// 'skeb'（コミッションプラットフォーム名）など、人によって追記してください。
const ARTIST_TAG_FILTER = new Set(['skeb'])

const props = defineProps<{ item: TweetItem; data?: TweetData | null }>()

const id = extractTweetId(props.item.url)
// App からプリフェッチ済みデータが渡れば直接利用（実行時リクエスト不要）。
// 無ければ実行時に取得（build 後に追加、またはプリフェッチ失敗したツイート）。
const runtime = !props.data && id ? useTweet(id) : null

const data = computed<TweetData | null>(() => props.data ?? runtime?.data.value ?? null)
const loading = computed(() => runtime?.loading.value ?? false)
const error = computed<string | null>(() =>
  runtime ? runtime.error.value : props.data ? null : id ? null : 'invalid url',
)

// ツイート URL から handle を取り出す（fallback の自動作者用）
const urlHandle = computed(() => props.item.url.match(/(?:x|twitter)\.com\/([^/]+)\/status/i)?.[1] ?? null)

// 作者ページへのリンク（アバター/名前クリックで相手のアカウントへ）
const authorUrl = computed(() =>
  data.value?.handle ? `https://x.com/${data.value.handle}` : (data.value?.url ?? props.item.url),
)

// 本文 → リンク化（#タグ・URL・@メンション、末尾の添付短縮 URL を除去）
const linkedText = computed(() => linkifyTweet(data.value?.text))

// 環境変数スイッチ：VITE_SHOW_TWEET_TEXT='false' → 画像のみモード（本文を隠し、絵師だけ表示）
const showText = import.meta.env.VITE_SHOW_TWEET_TEXT !== 'false'

// 「絵師」の判定：できる限り「名前」を表示し、リンクはそのアカウントページへ。優先順：
//  0. content.json の artist 手動上書き
//  1. 本文の #アカウント / @アカウント（ARTIST_TAG_FILTER を除外）→ # と @ は同等に扱う。
//     名前は このツイートの mention → 横断 lookupName → 無ければ @アカウント
//  2. 本文に有効なアカウントが無い → 発文者を絵師とし、発文者の「名前」を表示
const artist = computed<{ display: string; url: string; avatar: string | null } | null>(() => {
  const d = data.value
  // 0. 手動上書き
  const ov = props.item.artist
  if (ov?.name || ov?.handle) {
    const h = ov.handle
    return {
      display: ov.name || (h ? `@${h}` : ''),
      url: h ? `https://x.com/${encodeURIComponent(h)}` : props.item.url,
      avatar: h ? getAvatar(h) : null,
    }
  }
  if (!d) return null
  const mentions = d.mentions ?? []
  // 1. 本文中のアカウント（# と @ は同等）
  for (const m of (d.text ?? '').matchAll(/[#@]([\p{L}\p{N}_]+)/gu)) {
    const tok = m[1]
    if (!tok || ARTIST_TAG_FILTER.has(tok.toLowerCase())) continue
    // 名前：このツイートの mention の API 名 → 横断 → @アカウント（変動し得る本文からは抽出しない）
    const name = mentions.find((x) => x.handle.toLowerCase() === tok.toLowerCase())?.name || lookupName(tok)
    return { display: name || `@${tok}`, url: `https://x.com/${encodeURIComponent(tok)}`, avatar: getAvatar(tok) }
  }
  // 2. 発文者を絵師とする：表示名（アカウントではなく）
  const handle = d.handle ?? urlHandle.value
  if (handle)
    return {
      display: d.name || `@${handle}`,
      url: `https://x.com/${encodeURIComponent(handle)}`,
      avatar: getAvatar(handle),
    }
  return null
})

// 降格するか：tombstone、取得エラー、または有効な id 無し
const degraded = computed(() => !!error.value || (!!data.value && data.value.tombstone))

const fallback = computed(() => props.item.fallback ?? null)
const isTombstone = computed(() => !!data.value?.tombstone)
// fallback 文：content.json で上書き可。無ければ制限時は既定文、その他エラーは汎用文
const fbText = computed(
  () => fallback.value?.text || (isTombstone.value ? RESTRICTED_TEXT : 'このツイートは表示できません。'),
)
// fallback 作者：上書き可。無ければ URL から handle を自動取得
const fbAuthor = computed(() => fallback.value?.author ?? (urlHandle.value ? `@${urlHandle.value}` : null))
const fbAuthorUrl = computed(() => (urlHandle.value ? `https://x.com/${urlHandle.value}` : props.item.url))

// 日付整形：YYYY/MM/DD（syndication の created_at は ISO 文字列）
function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <article class="card p-4">
    <!-- 読み込み中スケルトン -->
    <div v-if="loading" class="animate-pulse space-y-3">
      <div class="flex items-center gap-3">
        <div class="skeleton h-10 w-10 !rounded-full" />
        <div class="flex-1 space-y-2">
          <div class="skeleton h-3 w-1/3" />
          <div class="skeleton h-2.5 w-1/4" />
        </div>
      </div>
      <div class="skeleton h-3 w-full" />
      <div class="skeleton h-3 w-4/5" />
      <div class="skeleton h-40 w-full !rounded-2xl" />
    </div>

    <!-- 降格 fallback（匿名閲覧が弾かれる＝年齢制限/削除時。content.json の手動内容を表示） -->
    <div v-else-if="degraded" class="space-y-3">
      <a
        v-if="fallback?.image"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block overflow-hidden rounded-2xl"
      >
        <img :src="fallback.image" alt="" loading="lazy" class="w-full object-cover" />
      </a>
      <!-- 手動画像が無い時：柔らかいプレースホルダーで示す -->
      <div
        v-else
        class="grid aspect-[4/3] place-items-center rounded-2xl border border-black/10 bg-black/[0.02] text-center"
      >
        <div class="space-y-1 px-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="mx-auto h-8 w-8 text-accent/60"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M3 16l5-5 4 4 3-3 6 6" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
          <p class="text-xs text-ink-muted">Twitter 上で公開されています</p>
        </div>
      </div>
      <p class="text-sm text-ink-soft">{{ fbText }}</p>
      <div class="flex items-center justify-between gap-2">
        <a
          v-if="fbAuthor"
          :href="fbAuthorUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-ink-muted hover:text-accent"
          >{{ fbAuthor }}</a
        >
        <a
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-auto text-xs font-medium text-accent hover:underline"
          >Twitter で見る →</a
        >
      </div>
      <DownloadButton :url="item.downloadUrl" />
    </div>

    <!-- 通常のツイート -->
    <div v-else-if="data" class="space-y-3">
      <!-- 通常モード：発文者ヘッダー＋本文（画像のみモードでは隠す） -->
      <template v-if="showText">
        <a
          :href="authorUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group/author flex items-center gap-3 rounded-xl transition hover:bg-black/[0.03]"
        >
          <img
            v-if="data.avatar"
            :src="data.avatar"
            :alt="data.name || ''"
            loading="lazy"
            class="h-10 w-10 rounded-full object-cover ring-1 ring-black/5"
          />
          <div class="min-w-0 leading-tight">
            <p
              class="truncate font-display text-sm font-bold text-ink group-hover/author:text-accent"
            >
              {{ data.name }}
            </p>
            <p class="truncate text-xs text-ink-muted">@{{ data.handle }}</p>
          </div>
        </a>

        <!-- linkifyTweet は内部で純文字を escape 済み、受控の <a>（href は http/https 限定）のみ挿入するため v-html は安全 -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-if="data.text" class="tweet-text whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-soft" v-html="linkedText"></p>
      </template>

      <!-- 画像のみモード：絵師クレジット（アバター + 名前 = リンク）をカード上部に -->
      <a
        v-else-if="artist"
        :href="artist.url"
        target="_blank"
        rel="noopener noreferrer"
        class="group/artist flex items-center gap-2 rounded-xl transition hover:bg-black/[0.03]"
      >
        <img
          v-if="artist.avatar"
          :src="artist.avatar"
          :alt="artist.display"
          loading="lazy"
          class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-black/5"
        />
        <span
          v-else
          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/[0.04] text-ink-muted"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </span>
        <span class="truncate font-display text-sm font-bold text-ink group-hover/artist:text-accent">{{ artist.display }}</span>
      </a>

      <PhotoGrid v-if="data.photos?.length" :photos="data.photos" alt="イラスト" />

      <footer class="flex items-center justify-between gap-2 pt-1">
        <time class="text-xs text-ink-muted">{{ fmtDate(data.createdAt) }}</time>
        <a
          :href="data.url"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 text-xs font-medium text-accent hover:underline"
          >Twitter で見る →</a
        >
      </footer>

      <DownloadButton :url="item.downloadUrl" />
    </div>
  </article>
</template>
