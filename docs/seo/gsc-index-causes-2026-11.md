# Search Console の未インデックス（2026-11-09）

Google Search Console の 2026-11-09 時点は、326 URL が「クロール済み - インデックス未登録」、110 URL が「重複（適切な canonical タグあり）」だった。URL の一覧は手元にない。この文書は 2026-11-14 に、リポジトリと本番 `https://stylish.sunsup.me` から原因の候補を数えた記録である。326 と 110 を、この数に割り当ててはいない。

本番のサイトマップはページ 16 件とドリンク 898 件、合わせて 914 件。すべて `https://stylish.sunsup.me` で、末尾は `/` である。ページ 16 件は、トップ、`/ba/office/`、場面 5 件、`/about/`、`/drink/`、カテゴリ 6 件、`/tag/mutou/`。抜き取ったページの canonical は、その URL 自身を指していた（トップ、`/about/`、`/ba/kaisha/`、`/tag/mutou/`、残すドリンクと重複ドリンク）。

[#99](https://github.com/umisora/sunsup/pull/99) は未マージである。そのため本番の `/drink/sanpellegrino-limonata-pet/` は 200 のままで、canonical も自分自身を指す。

## (a) pages.dev と別ホスト

| ホスト | 本番で確認した応答 | 数 |
| --- | --- | --- |
| `sunsup-dv4.pages.dev` | `/`、`/ba/kaisha/`、`/drink/sanpellegrino-limonata-pet/` は 301 で `https://stylish.sunsup.me` の同じパスへ。middleware はすべてのパスに付く | 200 で残っている重複は 0 |
| `*.sunsup-dv4.pages.dev` のプレビュー | 200。`x-robots-tag: noindex`。canonical は本番の同じパス | ホストを 2 件確認（`f0877e47`、`4ceacbe9`）。GSC に残っているプレビュー URL の件数は不明 |
| `http://stylish.sunsup.me` | 301 で https へ（Cloudflare の端） | 確認した 3 パス |
| `www.stylish.sunsup.me` | DNS に無い | 0 |
| `sunsup.me` / `www.sunsup.me` | 別サイト。トップの canonical は `https://www.sunsup.me/`。`/ba/kaisha/` とドリンクパスは 404 | このカタログの複製ではない |

古い本番ホストの 301 は 2026-10-23（#55）から入っている。今の応答はリダイレクトなので、「適切な canonical」ではなく「ページにリダイレクトがあります」側に寄る。11 月 9 日の 110 件に、再クロール前の古いホストがどれだけ残っていたかは、URL 一覧がないと分からない。

## (b) 非公開・削除・MOVED が 200 のまま

| 対象 | リポジトリ | 本番 |
| --- | --- | --- |
| `公開=0` のドリンク | 34 行。ページ生成、サイトマップ、場面、訪問ストーリーからは外れる | `/drink/mitsuyacider-lemon/` は 404 |
| `/ba/nomanai-hito` と末尾スラッシュなし | `MOVED` の 2 キー | どちらも 301 で `/ba/okurimono/`。200 ではない |

この枠で、まだ 200 になっているものは 0 件だった。削除済み URL が 404 なら、GSC の分類は「見つかりません」であり、今回の 326 件とは別枠になりやすい。再クロール前のものが 326 件に残っているかは不明。

## (c) 同じ商品の別スラッグと、薄いページ

同じ容量・同じ容器で、商品名も同じ、かつ JAN か店舗の商品 ID が一致するものが 4 組ある。どちらも公開中で、canonical は自分自身を指す。サイトマップにも両方入る。Google から見ると「canonical が別 URL を指す」ではなく、重複ページとしてインデックスされない側に入りやすい。

| 外す URL | 残す URL | 根拠 |
| --- | --- | --- |
| `/drink/sanpellegrino-limonata-pet/` | `/drink/sanpellegrino-limonata/` | どちらも 330ml の缶。ヨドバシ商品 `100000001007579063` と公式 URL が同じ。`-pet` に静物はない。200ml の `/drink/sanpellegrino-limonata-200/` は別商品なので残す |
| `/drink/kirin-namacha-400/` | `/drink/namacha-525/` | 本文はどちらも 525ml のペットボトル。楽天とヤフーの URL が JAN `4909411091910`。ヤフーの見出しは「キリン 生茶 525ml」。公式の商品ページは残す側にある |
| `/drink/pokka-kireto-155/` | `/drink/pokka-kireto-lemon/` | 公式の WX64 と WB52 はどちらも「キレートレモン（155ml）」、JAN `49780741`、Amazon `B0F9WZ5FJS` |
| `/drink/pokka-kireto-wlemon-500/` | `/drink/pokka-kireto-wlemon/` | 公式の WV74 と WY96 はどちらも 500ml のペットボトル、JAN `4589850829062`、Amazon `B0H7F94ZG6` |

余分に公開されているのは 4 ページ。

名前を揃えると同じ呼び方だが、容量か容器が違う組は 47 組、107 ページ。200ml と 330ml のような別商品なので、301 していない。

Amazon の ASIN が同じでも商品が違う組は、まとめない。野菜生活 4 種（`B0HJYB6GCV`）、トマトジュースと食塩無添加（`B0F2H56Z1P`）、午後の紅茶とグランティーレモン（`B0H37ZGPKD`）、YUZU と UME の炭酸水（`B0GZR3VHQF`）、伊達麦茶とみどりのお茶（`B0FPCLXPWW`）、Dole の紙パック 4 種（`B0G5F864KR`）。合わせて 16 ページ。

静物が無い公開ドリンクは 11 件。うち 1 件が `-pet`。説明文は 80〜120 字に収める実装なので、短文そのものより、同型のページが 898 件あることの方が「クロール済み - インデックス未登録」に効きやすい。何件がそれかは URL 一覧がないと確定できない。

## (d) URL の揺れ

本番で確認した。インデックス対象は 914 URL。

| 揺れ | 応答 | canonical | 数 |
| --- | --- | --- | --- |
| 末尾スラッシュなし | 308 で末尾 `/` へ。`MOVED` の旧パスだけは 301 | リダイレクトなので別枠 | トップ以外の 913 |
| `/index.html` | 308 でディレクトリへ | リダイレクト | 確認したページごと |
| 大文字 | 404（`/ABOUT/`、`/About/`、`/ba/Kaisha/`） | なし | 確認した 3 パス |
| `index.txt`（Next の RSC） | 200、`text/plain`。canonical も noindex も無い | なし | サイトマップ 914 件と `/drink/shell/` の 915。`/404/index.txt` と `/about.txt` は 404。HTML からはリンクされていない |
| クエリ | 200。canonical はクエリを除いた URL | 別 URL を指す | 全ページで起きうる。`/?story=autumn-afternoon` と `/ba/kaisha/?utm_source=gsc` を確認。`?story=` はトップの訪問切替（62 件）で、静的なリンクには出ていない。`?analytics_qa=` は計測の確認用 |
| スラッシュの繰り返し | 200。canonical は畳んだ URL | 別 URL を指す | `/about//`、`/about///`、`//about/`、`/ba//kaisha/`、`/drink//…/`、`/drink/…//`、`/category/citrus//`、`/category//citrus/` を確認。ページの種類をまたぐので、914 件すべてで起きうる。スラッシュを増やすと URL はいくらでも作れる |
| http | 301 で https | リダイレクト | 確認した 3 パス |
| ページ送り | 無い | | 0 |
| タグ | `/tag/mutou/` だけ。canonical は自分自身。サイトマップに入っている。フッターも `/tag/mutou/` | 自分自身 | 1。別 URL を指すタグページは 0 |

「重複（適切な canonical タグあり）」になりうるのは、クエリ付き URL と、スラッシュを繰り返した URL と、noindex より canonical を優先して数えた場合のプレビューである。110 という件数は 914 より小さいので、全ページの二重スラッシュが登録されているわけではない。どれが 110 件に入っているかは URL 一覧がないと分からない。

サイトマップに載る 914 件は自分自身を canonical にしているので、この 110 件には入らない。

## (e) サイトマップと canonical

サイトマップの 914 件は、形の上では canonical の URL と一致する。抜き取ったページも一致した。不一致として見つかったのは 0 件。

サイトマップに無く、200 で別の canonical を返すのは (d) のクエリと二重スラッシュである。`/drink/shell/` と `/404/` は noindex で、サイトマップに無い。シェルと 404 に canonical は無かった。

重複 4 ページは、サイトマップと canonical が互いに一致している。タグが間違っているのではなく、同じ商品が 2 URL ある。

## この変更で直すこと

- 上の 4 スラッグは `公開=0`。ページもサイトマップも作らない。`MOVED` で、末尾スラッシュのありなしを残す URL へ 301 する。
- 無糖タグに入っていた `kirin-namacha-400` は、残す `namacha-525` に差し替える。棚の本数は 84 のまま。
- 公開数は 898 から 894。柑橘・炭酸は 131 から 128、茶・ハーブは 147 から 146。文面の型は変えていない。本数だけ、公開行から計算し直す。
- 連続するスラッシュと `/index.html` は、middleware が 301 で canonical のパスへ畳む。クエリは残す。`?story=` と `?analytics_qa=` は消さない。
- `index.txt` には `x-robots-tag: noindex` を付ける。`robots.txt` は `Disallow: /*index.txt$`。ブラウザの画面遷移用の取得はそのまま。
- `scripts/check-canonical.mjs` は、サイトマップの URL に自分自身を canonical とするページが無いとき、除外していないページの canonical が自分の URL と違うとき、公開ページがサイトマップに無いとき、失敗する。除外は `/drink/shell/` と `/404/`。

直していないもの: 容量違いの 47 組、ASIN を共有する別商品 16 ページ、静物の無い 10 ページ、クエリの除去、大文字の 404、http の 301、プレビューの noindex（Cloudflare が付ける）。

## URL 一覧がないと確定できないこと

- 326 件の内訳。`index.txt` が最大 915 件あることと、同型のドリンクが多いことまでは言える。何件がどちらかは分からない。
- 110 件が、クエリか、二重スラッシュか、再クロール前の pages.dev か、プレビューか。
- 34 件の非公開 URL のうち、以前インデックスされていたもの。
- 47 組の容量違いのうち、Google が重複とみなしたもの。
