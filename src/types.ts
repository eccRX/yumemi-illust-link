// コンテンツのデータモデル（public/content.json に対応）

export interface ProfileLink {
  /** アイコンキー：x | twitter | youtube | instagram、その他は汎用リンクアイコン（emoji 優先） */
  icon?: string
  /** emoji アイコン（icon より優先） */
  emoji?: string
  label?: string
  url: string
  /** ドロップダウン用の補足説明（任意） */
  description?: string
  /** グループ見出し（同じ値が連続するとひとまとめ、任意） */
  group?: string
}

export interface Profile {
  name: string
  avatar?: string
  bio?: string
  links?: ProfileLink[]
}

/** ツイート項目。fallback はツイートが tombstone（削除/制限）の時に使う */
export interface TweetItem {
  type: 'tweet'
  url: string
  downloadUrl?: string | null
  fallback?: {
    image?: string | null
    text?: string | null
    author?: string | null
  }
  /** 絵師を手動指定（自動判定を上書き）。純 #ハッシュタグ等で名前を自動取得できない時に */
  artist?: {
    name?: string
    handle?: string
  }
}

/** 画像項目（ツイート以外の任意画像） */
export interface ImageItem {
  type: 'image'
  src: string
  title?: string
  caption?: string
  downloadUrl?: string | null
  /** 並べ替え用日付（ISO 文字列、任意）。未指定は最後尾 */
  date?: string
}

export type ContentItem = TweetItem | ImageItem

export interface Content {
  profile: Profile
  items: ContentItem[]
}

/** 並べ替え解決後のカード項目（App → CardGrid） */
export interface CardEntry {
  item: ContentItem
  /** ツイート項目のプリフェッチ済みデータ。画像項目や未取得時は null */
  data: TweetData | null
  /** 並べ替え用タイムスタンプ（ms）。無ければ null */
  date: number | null
}

// /api/tweet の返却データモデル

export interface TweetPhoto {
  url: string
  width?: number
  height?: number
}

export interface TweetMention {
  handle: string
  name: string
}

export interface TweetData {
  id: string
  tombstone: boolean
  name?: string | null
  handle?: string | null
  avatar?: string | null
  verified?: boolean
  text?: string
  photos?: TweetPhoto[]
  mentions?: TweetMention[]
  createdAt?: string | null
  url?: string
}
