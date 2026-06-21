# yumemi-illust-link

X(Twitter) のイラスト投稿を **カード形式で一覧** する、linktree 風の一頁式ギャラリーです。
依頼したイラストや好きな作品が古い投稿に埋もれないよう、1 ページにまとめて見せられます。

- 🖼️ ツイートを **本文＋画像のカード** で表示（公式埋め込みより軽量・自前デザイン）
- ⚡ **ビルド時プリフェッチ** で全データを焼き込み → 訪問者側の API 往復ゼロ・完全静的配信
- 🧱 日付の新しい順に自動整列する **順序保持の masonry**
- 🎨 **画像のみモード**（本文を隠し、絵師クレジットだけ表示）を環境変数で切替
- 🛠️ 編集するのは `public/content.json` ただ 1 ファイル（純粋な JSON）

> このリポジトリは雛形です。`public/content.json` を自分の内容に書き換えれば、そのまま自分のギャラリーになります。

---

## 技術スタック

Vue 3 + TypeScript / Vite / Tailwind CSS v4 / Reka UI（ヘッドレス UI）。単一ページ・ルーターなし。
データは静的な `public/content.json`（バックエンド・DB なし）。

---

## クイックスタート

```bash
pnpm install
pnpm dev        # プリフェッチ → 開発サーバ起動
```

ブラウザで表示されたら、`public/content.json` を編集して自分の作品を並べてください。

```bash
pnpm build      # プリフェッチ → 本番ビルド（dist/ を出力）
pnpm preview    # ビルド結果をプレビュー
pnpm prefetch   # プリフェッチのみ再実行（tweets.json / avatars.json 更新）
pnpm typecheck  # 型チェック
pnpm lint       # ESLint
```

> pnpm 以外（npm / yarn）でも動きます。スクリプト名は同じです。

---

## 初期設定：汎用プレースホルダの差し替え

この雛形のテキストと色は **汎用プレースホルダ**です。自分用にするには下表を差し替えてください
（名前を出したくなければ、サイト名・タイトルは汎用のままでも動きます）。

| 項目 | 場所 | 既定値（プレースホルダ） |
|------|------|------------------------|
| サイト名 | `public/content.json` → `profile.name` | `イラストまとめ` |
| サブタイトル | `public/content.json` → `profile.bio` | `お気に入りのイラスト投稿のまとめです。` |
| 上部リンク集 | `public/content.json` → `profile.links` | `[]`（空ならメニュー非表示） |
| 作品一覧 | `public/content.json` → `items` | サンプル数件（下の「コンテンツの編集」で差し替え） |
| ページタイトル | `index.html` → `<title>` ＋ `og:title` | `イラストまとめ` |
| 説明文 | `index.html` → `description` ＋ `og:description` | `お気に入りのイラスト投稿をまとめた…` |
| テーマカラー（ブラウザ UI） | `index.html` → `<meta name="theme-color">` | 配色トークンに合わせた 1 色 |
| 配色（全体） | `src/style.css` → `@theme` の色トークン ＋ `body` の `background` | 下記「カスタマイズ」参照 |
| ファビコン | `public/favicon.svg` | 差し替え |
| プロジェクト名 | `package.json` の `name`、`api/_tweet-core.js` と `scripts/prefetch-tweets.mjs` の User-Agent | リポジトリ名（`*-illust-link`） |

- **配色**：`src/style.css` の `@theme`（`--color-ink` / `--color-accent` / `--color-gold` …）と `body` の `background` を変えるだけで全体に反映されます。**文字と背景のコントラスト**（本文 4.5:1 以上、アイコン等 3:1 以上）を必ず確保してください。
- 名前を前面に出さない運用も可：`profile.name` と `<title>` を汎用のまま据え置けば OK です。

---

## コンテンツの編集：`public/content.json`

唯一の編集ファイルです。**純粋な JSON**（コメント不可）。各フィールドの意味は下記を参照してください。
同梱のサンプルは、提供例の URL を使って主なケースを並べてあります。

```json
{
  "profile": {
    "name": "イラストまとめ",
    "bio": "お気に入りのイラスト投稿のまとめです。",
    "links": []
  },
  "items": [
    { "type": "tweet", "url": "https://x.com/<id>/status/<tweetId>" }
  ]
}
```

### `profile`（上部バー）

| フィールド | 必須 | 説明 |
|------|:--:|------|
| `name` | ✓ | 上部バーのタイトル |
| `bio` | – | サブタイトル |
| `links` | – | 右上リンクメニュー。空配列ならメニュー自体を非表示 |

`links[]` の各要素：`url`（必須）、`label`、`description`、`emoji`（絵文字アイコン・優先）、`icon`（`x` / `twitter` / `youtube` / `instagram`、その他は汎用リンクアイコン）、`group`（同じ値が連続するとひとまとめの見出し）。

### `items`（カード）

ツイートカード（`type: "tweet"`）：

| フィールド | 必須 | 説明 |
|------|:--:|------|
| `url` | ✓ | ツイート URL（`https://x.com/<id>/status/<tweetId>`） |
| `downloadUrl` | – | ダウンロードボタンのリンク（twimg 画像は末尾に `?name=orig` で原寸） |
| `artist` | – | 絵師を手動指定 `{ "name": "...", "handle": "..." }`。`#ハッシュタグ` だけで名前が自動取得できない時の上書き用 |
| `fallback` | – | 制限ツイート用の代替表示（後述）。`{ "image": "...", "text": "...", "author": "@..." }` すべて任意 |

画像カード（`type: "image"`）：

| フィールド | 必須 | 説明 |
|------|:--:|------|
| `src` | ✓ | 画像 URL |
| `title` / `caption` | – | タイトル / 説明 |
| `downloadUrl` | – | ダウンロードボタンのリンク |
| `date` | – | 並べ替え用日付（ISO 文字列、例 `"2026-01-12"`）。未指定は最後尾 |

- **並び順**：日付の新しい順に自動整列（JSON の並び順は無視）。ツイートは投稿時刻を自動取得。
- **絵師の表示**：通常は自動判定（メンション名や発文者名）。取れない時のみ `artist` で上書き。

---

## 表示モードの切り替え（環境変数）

`.env`（同梱・コミット済み）の `VITE_SHOW_TWEET_TEXT` で切り替えます（ビルド時に反映）。

| 値 | モード |
|----|--------|
| `true`（既定） | 発文者ヘッダー＋本文＋画像を表示 |
| `false` | **画像のみモード**：本文を隠し、画像＋「絵師」クレジット＋リンクだけ表示（純ギャラリー寄り） |

ローカルで一時的に試す場合：

```bash
# macOS / Linux
VITE_SHOW_TWEET_TEXT=false pnpm dev
# Windows PowerShell
$env:VITE_SHOW_TWEET_TEXT='false'; pnpm dev
```

---

## 制限ツイート（年齢制限・削除など）

プリフェッチは「匿名」で取得するため、年齢制限・削除・非公開のツイートは内容を取得できません。
その場合でも**画面は空にならず**、既定の案内文＋作者リンクが表示されます（最低限そのままで OK）。

`pnpm dev` / `pnpm build` / `pnpm prefetch` の実行時、ターミナル末尾に対象を一覧表示します：

```
⚠ 制限ツイート（匿名では表示不可。content.json に fallback を追加してください）:
   - https://x.com/xxx/status/123  ✗ fallback なし（要追加）
```

手元に原画像があるなど、より良く見せたい場合は `fallback` を足してください（任意）：

```jsonc
{
  "type": "tweet",
  "url": "https://x.com/xxx/status/123",
  "fallback": {
    "image": "https://pbs.twimg.com/media/xxxx.jpg?name=orig", // 任意。手元の原画像
    "text": "説明文（任意・既定文を上書き）",
    "author": "@xxx" // 任意・URL から自動取得
  }
}
```

---

## デプロイ

### Vercel（同梱の `vercel.json` でそのまま）

リポジトリを Vercel に連携するだけです。`pnpm build` が走り、プリフェッチも自動実行されます。
同梱の `api/tweet.js`（Serverless Function）は、**ビルド後に追加したツイート**を実行時に取得するためのフォールバックです（任意）。

### Vercel 以外（Netlify / Cloudflare Pages / GitHub Pages / 任意の静的ホスト）

ビルド後の `dist/` は **完全な静的サイト**です（全ツイートデータは焼き込み済み）。どの静的ホストでも配信できます。

- **ビルドコマンド**：`pnpm build`／**公開ディレクトリ**：`dist`
- **`vercel.json` は削除して構いません**（Vercel 専用設定のため）。代わりに各ホストで以下を設定すると同等になります：
  - SPA フォールバック：`/*` → `/index.html`
  - キャッシュ：静的アセット（js/css/画像）は長期 immutable、`content.json` は短め
- **`api/` フォルダも不要**になります（Vercel 以外では動きません）。プリフェッチで全データが入っているため、`content.json` を編集したら **再ビルドして再デプロイ**すれば反映されます。

---

## 仕組み（プリフェッチ）

`scripts/prefetch-tweets.mjs` が dev/build の前に実行され、`content.json` の全ツイートを
Twitter の公開 syndication endpoint（公式埋め込みが内部で使うもの）から取得して
`public/tweets.json`（＋絵師アバターを `public/avatars.json`）に書き出します。
フロントはこれを 1 回読むだけなので、初期表示が速く、訪問者側の API 往復が発生しません。

`tweets.json` / `avatars.json` は **生成物**（`.gitignore` 済み）で、毎ビルド再生成されます。手で編集しないでください。

---

## カスタマイズ

- **テーマ配色**：`src/style.css` の `@theme` 内の色トークン（`--color-ink` / `--color-accent` / `--color-gold` 等）を変えるだけで全体の色が変わります。
- **ファビコン**：`public/favicon.svg` を差し替え。
- **タイトル / OGP**：`index.html` の `<title>` と `og:*`、および `content.json` の `profile.name`。
- **絵師判定の除外タグ**：下記「絵師判定の仕組みと除外タグ」を参照。

### 絵師判定の仕組みと除外タグ

画像のみモード（`VITE_SHOW_TWEET_TEXT=false`）では、各カードに「絵師」を表示します。判定は次の順です：

1. `content.json` の `artist`（手動上書き）があればそれ
2. 本文中の `#ハッシュタグ` / `@メンション` を **アカウントとみなす**（最初の 1 つ）。名前はメンションの API 名や他ツイートから補完
3. 上記が無ければ **発文者** を絵師とする

ここで問題になるのが、**アカウントではないハッシュタグ**です。たとえば `#skeb`（コミッションのプラットフォーム名）や、ファンタグ（例：`#〇〇肖像画`）は「絵師アカウント」ではないので、絵師として拾わないよう除外する必要があります。

除外タグは `ARTIST_TAG_FILTER` という集合で管理しています。既定は `skeb` のみです。**追加したい場合は、次の 2 箇所を同じ内容に揃えて編集**してください（小文字で記述）：

- `src/components/TweetCard.vue`
- `scripts/prefetch-tweets.mjs`

```js
// 例：ファンタグなどアカウントではないタグを追加
const ARTIST_TAG_FILTER = new Set(['skeb', 'マイタグ', '〇〇肖像画'])
```

> どうしても自動判定が合わない場合は、その項目に `artist: { "name": "...", "handle": "..." }` を書けば確実に上書きできます。

---

## ライセンス

[MIT](./LICENSE)

ツイート/画像の著作権は各クリエイターに帰属します。本ソフトウェアは表示の枠組みのみを提供します。
掲載にあたっては各作者の利用規約・ガイドラインに従ってください。
