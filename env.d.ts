/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false' = 画像のみ表示（取得した推文本文を隠す）。未設定/その他 = 本文を表示 */
  readonly VITE_SHOW_TWEET_TEXT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
