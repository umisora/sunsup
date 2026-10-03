# sunsup

飲み会でも、おしゃれに美味しく飲めるノンアルを届ける。コンセプトサイト。

旅は `/` → `/ba/office` → `/drink/kimino-yuzu`。場のページから、カテゴリごとに一杯を開ける。殻は `/drink/shell`。運営は `/about`。

静的 HTML は Next.js（App Router）に置き換えた。ビルドは静的書き出しで、Cloudflare Pages にそのまま置ける。

## ローカル

```bash
npm install
npm run dev
```

開発サーバーは http://localhost:3000

本番と同じ静的ファイルを確認する:

```bash
npm install
npm run build
npm run preview
```

`npm run build` は `out/` に HTML を書き出す。`npm run preview` はそのフォルダを配信する。

## Cloudflare Pages

`next.config.ts` の `output: "export"` により、`npm run build`（`npx next build` と同じ）が静的ファイルを `out/` に書く。ローカルのビルドに秘密情報は要らない。

公開は GitHub Actions の Direct Upload か、ダッシュボードの Git 接続か、どちらか一方にする。

| 項目 | 値 |
|---|---|
| Pages project name | `sunsup` |
| Production branch | `main` |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npx next build`（`npm run build` と同じ） |
| Build output directory | `out` |

最初の本番デプロイが成功すると、公開 URL は `https://sunsup.pages.dev` になる。

### GitHub Actions

ワークフローは [`.github/workflows/ci.yml`](.github/workflows/ci.yml)。

- pull request と `main` への push で `npm ci` と `npm run build` を実行する。ビルドが失敗するとジョブも失敗する。
- `main` への push で、下の secret が両方あるときだけ `out/` を `wrangler pages deploy --project-name=sunsup` で上げる。どちらかが無いときはデプロイをスキップし、ビルド結果はそのまま残る。
- プロジェクト `sunsup` がまだ無いときは、同じ secret で Direct Upload 用に作成する。production branch は `main`。

リポジトリの Settings → Secrets and variables → Actions に、次の名前で repository secret を作る。値はここに書かない。

| Secret | 中身 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API トークン。権限は Account → Cloudflare Pages → Edit |
| `CLOUDFLARE_ACCOUNT_ID` | アカウント ID。ダッシュボードの Overview 右にある API 欄 |

トークンは [Account API tokens](https://dash.cloudflare.com/?to=/:account/api-tokens) で Create Token → Custom token。アカウント ID の見方は [Find account and zone IDs](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)。

### ダッシュボードの Git 接続

secret を置かず、Workers & Pages → Create → Pages → Connect to Git でこのリポジトリを接続してもよい。ビルド設定は上の表のとおり。この経路を使うあいだは `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を Actions に置かない。置くと Actions も `main` をデプロイする。

## ページ

| パス | 役割 |
|---|---|
| `/` | 世界観。場への入口 |
| `/ba/office` | オフィスのオープンな飲み会 |
| `/drink/` | 一杯の一覧。カテゴリごと。写真のある一杯を先に並べる |
| `/drink/shell` | 一杯の殻。商品名も店のリンクも置かない |
| `/drink/[slug]` | CSVの一杯。`data/drinks.csv` から静的生成 |
| `/about` | 運営と紹介の開示 |

## 一杯のページ

`npm run build` が `data/drinks.csv` を読む。品名、場、見た目、サイズ、味が揃った行だけ `/drink/[slug]/` になる。欠けた行は警告して出さない。

ページの順は、静物（その一杯の静物URLがあるときだけ）、品名、場／見た目／サイズ／味、同じカテゴリのほかの一杯、締め「次の飲み会に、これを置く。」、末尾の店。店は公式、Amazonの商品ページ、楽天の商品ページの順。空のURL、検索URL、`/drinks/fallback-*.webp` は出さない。最初の一行だけが主ボタンになる。アフィリエイトIDは付けない。

静物URLは `http://` または `https://` の画像か、`/drinks/` 配下のその一杯の `.webp`（`public/drinks/` に置いたファイル）。`fallback-` は静物にしない。それ以外は警告して出さない。写真の出典は [`data/photo-credits.json`](data/photo-credits.json)。ページには出さない。

`/drink/` は六つのカテゴリを、場の入口と同じ順で並べる。各カテゴリでは静物のある一杯が先、静物のない一杯は文章だけが後ろに続く。行は消さない。`sitemap.xml` と `robots.txt` はビルドが書く。

`/ba/office` の「一杯へ」は `/drink/kimino-yuzu/`。同じページから、カテゴリごとに一杯を開ける。殻 `/drink/shell` は商品ページではなく、店のリンクも置かない。

## デザインシステム

見た目はすべて `design-system/`（トークン、コンポーネント、モーション）にある。ページは `@/design-system` を組むだけで、ページ固有の CSS は持たない。トークン・コンポーネント・使い方は [`docs/design-system.md`](docs/design-system.md)。

- 写真は `public/images/` の webp。`design-system/components/StillLife/photos.ts` が一覧
- 和文フォントはサイトで使う文字だけのサブセットを `fonts/` に置いている。コピーや `data/drinks.csv` に新しい漢字を足したら `npm run fonts` で作り直す（ネット接続が要る）
