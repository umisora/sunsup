# sunsup

飲み会でも、おしゃれに美味しく飲めるノンアルを届ける。コンセプトサイト。

旅は `/` → `/ba/office` → `/drink/shell`。運営は `/about`。

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

- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `out`
- 環境変数や秘密情報は不要

Framework preset は Next.js（Static HTML Export）か、None のまま出力先を `out` にする。

## ページ

| パス | 役割 |
|---|---|
| `/` | 世界観。場への入口 |
| `/ba/office` | オフィスのオープンな飲み会 |
| `/drink/shell` | 一杯の殻。商品名はまだ置かない |
| `/about` | 運営と紹介の開示 |

## 写真とフォント

- 写真は `public/images/` の webp。`components/Photo.tsx` が幅ごとの `srcset` を組む
- 和文フォントはサイトで使う文字だけのサブセットを `fonts/` に置いている。コピーに新しい漢字を足したら `npm run fonts` で作り直す（ネット接続が要る）
