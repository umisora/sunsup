import type { Metadata } from "next";
import Link from "next/link";
import { PageMotion } from "@/components/PageMotion";

export const metadata: Metadata = {
  title: "運営",
};

export default function AboutPage() {
  return (
    <PageMotion kind="about">
      <section className="wrap about" aria-labelledby="about-title">
        <header className="about__head">
          <p className="kicker" data-intro>
            運営
          </p>
          <h1 id="about-title" className="about__title">
            <span className="line">
              <span data-line>sunsup</span>
            </span>
          </h1>
          <p className="lead" data-intro>
            次のオフィス飲み会に何を置くかを、場・見た目・サイズ・味から選ぶためのサイトです。
          </p>
        </header>

        <div className="about__rows">
          <section className="about__row" data-reveal>
            <h2>最初の場</h2>
            <p>
              <Link href="/ba/office" className="text-link">
                昼のオフィスのオープンな飲み会
              </Link>
              。家で届いてから、次の卓へ。
            </p>
          </section>

          <section className="about__row" data-reveal>
            <h2>紹介について</h2>
            <p>紹介リンクを置くことがあります。いまは紹介プログラム未参加です。選ぶ軸は価格順にしません。</p>
          </section>

          <section className="about__row" data-reveal>
            <h2>このサイトにないもの</h2>
            <p className="muted">カート、会員、ランキング、安さ比べ。</p>
          </section>
        </div>
      </section>
    </PageMotion>
  );
}
