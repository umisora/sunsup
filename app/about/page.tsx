import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "運営",
};

export default function AboutPage() {
  return (
    <>
      <div className="hero-copy">
        <p className="kicker">運営</p>
        <div className="brass-rule" aria-hidden="true" />
        <h1 className="about-title">sunsup</h1>
      </div>

      <section className="section">
        <h2>このサイトについて</h2>
        <p>
          sunsupは、次のオフィス飲み会に何を置くかを、場・見た目・サイズ・味から選ぶためのサイトです。
        </p>
        <p>
          最初の場は、
          <Link href="/ba/office" className="text-link">
            昼のオフィスのオープンな飲み会
          </Link>
          。家で届いてから、次の卓へ。
        </p>
      </section>

      <section className="section">
        <h2>紹介について</h2>
        <p>紹介リンクを置くことがあります。いまは紹介プログラム未参加です。選ぶ軸は価格順にしません。</p>
      </section>

      <section className="section">
        <h2>このサイトにないもの</h2>
        <p className="note">カート、会員、ランキング、安さ比べ。</p>
      </section>
    </>
  );
}
