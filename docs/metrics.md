# アクセスとクリックの数え方

STYLISH! の数字は、出どころが3つあります。どれを見ているかで意味が変わるので、混ぜずに読んでください。

| 数字 | 出どころ | 数えているもの |
| --- | --- | --- |
| 商品リンクのクリック | 自前の D1 `stylish-metrics` の `clicks` | Amazon・楽天・公式ショップ・その他の通販へのリンクが押された回数。**月5,000回の目標はこれで見ます** |
| 公式サイトのクリック | 同じ `clicks`（`goal = 0`） | メーカーの公式サイトへのリンクが押された回数。目標には入れません |
| ページビュー | 自前の D1 の `views` | ブラウザでページが開かれた回数。JavaScript を動かさないクローラーは入りません |
| ページビュー・訪問 | Cloudflare Web Analytics（ダッシュボードの Web Analytics） | ブラウザのビーコンで数えた閲覧と訪問。sunsup.me のゾーンで自動で入れています |
| リクエスト | ゾーンの HTTP 分析 | サーバーに届いたリクエスト全部。Googlebot や AI のクローラーが大半なので、人の数には使えません |

## しくみ

- ドリンクのページには、購入リンクの URL と種類（amazon / rakuten / direct / other / official）を JSON で埋め込んでいます（`#out-links`）。
- `app/_metrics/Beacons.tsx` がクリックを拾い、`navigator.sendBeacon` で `/api/click` に送ります。リンクの動きには触れないので、送れなくても普通に開きます。
- 場面のページ（`/ba/<場面>/`）の「人数から、買う本数を出す」リストの購入リンクは、リンクそのものに `data-out-slug`・`data-out-kind`・`data-out-source="list"` を持っています。同じ `/api/click` に送り、`clicks.source` が `list` になります。ドリンクのページから押されたものは `page` です。
- ページを開くたびに `/api/view` にパスを送ります。
- Pages Functions（`functions/api/click.ts`, `functions/api/view.ts`）は、同じオリジンからの送信だけを受け付け、クローラーの User-Agent は捨てます。保存するのは日付（JST）・ホスト・パス・ドリンク・リンクの種類・回数だけで、IP や User-Agent は残しません。
- D1 はプロジェクト `sunsup` に `METRICS` という名前でつないでいます（本番とプレビューの両方）。プレビューの数字は `host` が `*.sunsup-dv4.pages.dev` になるので、本番と分けて読めます。

## 読み方

```sh
CLOUDFLARE_API_TOKEN=<D1 を読めるトークン> node scripts/metrics-report.mjs --from 2026-11-01 --to 2026-11-30
```

`--json` をつけると JSON で出ます。SQL は `scripts/metrics-report.mjs` の `QUERIES` にあり、ダッシュボードの D1 コンソールにもそのまま貼れます（`?1` をホスト、`?2` と `?3` を日付に置き換えてください）。

リストから押された数は `bySource` で見られます。`source = 'list'` の行が、場面のページのリストから押された購入リンクです。

`clicks.source` の列は `docs/metrics-migrations/0002-clicks-source.sql` で足しました。この列を書くコードが本番に出てから流します。それまでは `functions/api/click.ts` が古い書き方に戻して数えます。

## ヒートマップ（Microsoft Clarity）

タグは `app/_metrics/Clarity.tsx` に入れてあり、環境変数 `NEXT_PUBLIC_CLARITY_ID` が空のあいだは何も出しません。Clarity のプロジェクトを作って ID を Pages の環境変数に入れ、ビルドし直すと動きます。このとき「このサイトについて」の文も、Clarity がクッキーを使う旨に切り替わります。
