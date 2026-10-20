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
- `main` への push で、下の secret が両方あるときだけ `out/` を `wrangler pages deploy --project-name=sunsup` で上げる。どちらかが無いときはデプロイをスキップし、ビルド結果はそのまま残る。同じジョブはリポジトリ直下の `functions/` も上げる。

### 訪問ごとの卓

トップの卓は、静的 HTML に秋の午後の初期表示を書いてある。`functions/api/visit.ts` は `request.cf` の地域・緯度・経度だけを読み、Open-Meteo で気温と天気を見て、その場に合う話を2つか3つ返す。各話のドリンクはリクエストのたびに引き直す。Cookie は置かず、IP は読まない。ブラウザの位置情報ダイアログは出さない。応答は `cache-control: private, no-store` で、選んだドリンクをキャッシュに固定しない。地域か天気が取れないときは、季節と時間帯から選ぶ。同じページの話では、同じドリンクを繰り返さない。

話に出すドリンクは、公開中で、白い背景の実物の静物があるものだけ。`/drinks/fallback-*.webp` は出さない。季節・天気（暑い、寒い、雨、穏やか）・地域は品名から取り、`data/visit-pool.json` にまとめる。このファイルは `npm run build` が CSV から作り直す。

コンビニの定番は、話の主役にしない。地域のもの、輸入、クラフト、茶の専門のもの、割材、シロップは残す。定番かどうかは `data/drinks.csv` の列 `定番`（1 が定番）。判定は [`scripts/generic-rule.mjs`](scripts/generic-rule.mjs)。全国のコンビニに普通に並ぶ大手の茶、炭酸、水、スポーツドリンク、缶コーヒー、いつもの果汁を 1 にする。ご当地のコラボ（品名に都道府県がある野菜生活やカゴメ）は 0。迷うものは 0。一覧と詳細からは消さない。条件に合う定番以外が2本に満たないときだけ、定番を最後の控えに使う。
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

ページの順は、最初の画面に静物（その一杯の静物URLがあるときだけ）、品名、サイズ、店。店は公式、Amazonの商品ページ、楽天の商品ページの順。空のURL、検索URL、`/drinks/fallback-*.webp` は出さない。最初の一行だけが主ボタンになる。アフィリエイトIDは付けない。続いて場／見た目／サイズ／味、締め「次の飲み会に、これを置く。」のカード、棚の前後、同じカテゴリのほかの一杯、場への入口。店のボタンが画面から外れると、店への小さなバーが出る。

共有の画像は、一杯のページはその一杯の静物。ホーム、場、一覧、運営は `public/og/` の 1200×630 のカード。

「わたしの卓」と「最近見た一杯」は、そのブラウザの localStorage にだけ残る。送信も計測もしない。

静物URLは `http://` または `https://` の画像か、`/drinks/` 配下のその一杯の `.webp`（`public/drinks/` に置いたファイル）。`fallback-` は静物にしない。それ以外は警告して出さない。写真の出典は [`data/photo-credits.json`](data/photo-credits.json)。ページには出さない。

四季の静物があるドリンクは [`data/still-seasons.json`](data/still-seasons.json) に並べる。白抜きの単品画像は静物URLのまま `public/drinks/<slug>.webp`、四季の画像は `public/drinks/season/<slug>_<spring|summer|autumn|winter>.webp` に置く。パスは決まった形から作るので、CSVの列は増やさない。一杯のページの最初の静物と、トップの二つ目以降の話のカードは、日本時間で今の季節の画像を出す（春は3〜5月、夏は6〜8月、秋は9〜11月、冬は12〜2月）。季節は配信のときに Pages Function（`functions/drink/[[path]].ts`）が差し替える。この関数を通るのは `public/_routes.json` に載ったページだけで、ビルドが書く。一覧のカード、トップの卓の場面、締めのカードは白抜きのまま。透過の元画像は `stills/masters/` にあり、四季の画像は `scripts/compose-season-stills.py` で作る。

`/drink/` は六つのカテゴリを、場の入口と同じ順で並べる。各カテゴリでは静物のある一杯が先、静物のない一杯は文章だけが後ろに続く。行は消さない。`sitemap.xml` と `robots.txt` はビルドが書く。

`/ba/office` の「一杯へ」は `/drink/kimino-yuzu/`。同じページから、カテゴリごとに一杯を開ける。殻 `/drink/shell` は商品ページではなく、店のリンクも置かない。

## デザインシステム

見た目はすべて `design-system/`（トークン、コンポーネント、モーション）にある。ページは `@/design-system` を組むだけで、ページ固有の CSS は持たない。トークン・コンポーネント・使い方は [`docs/design-system.md`](docs/design-system.md)。

- 写真は `public/images/` の webp。`design-system/components/StillLife/photos.ts` が一覧
- 和文フォントはサイトで使う文字だけのサブセットを `fonts/` に置いている。コピーや `data/drinks.csv` に新しい漢字を足したら `npm run fonts` で作り直す（ネット接続が要る）
