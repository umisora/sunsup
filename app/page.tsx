import type { Metadata } from "next";
import Link from "next/link";
import { AxisList } from "@/components/AxisList";
import { JourneyMark } from "@/components/JourneyLink";
import { PageMotion } from "@/components/PageMotion";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: { absolute: "sunsup" },
};

export default function HomePage() {
  return (
    <PageMotion kind="home">
      <section className="wrap hero" aria-labelledby="home-title">
        <div className="hero__media media" data-intro-media data-parallax>
          <Photo name="table" sizes="(min-width: 1360px) 1240px, calc(100vw - 40px)" priority />
        </div>
        <div className="hero__foot">
          <div className="hero__panel">
            <p className="kicker" data-intro>
              コンセプトサイト
            </p>
            <h1 id="home-title" className="display">
              <span className="line">
                <span data-line>飲み会でも、</span>
              </span>
              <span className="line">
                <span data-line>おしゃれに美味しく。</span>
              </span>
            </h1>
            <p className="lead" data-intro>
              次のオフィスの卓に、何を置くか。
            </p>
          </div>
          <p className="hero__vertical" aria-hidden="true">
            昼の卓、窓、緑のガラス。
          </p>
        </div>
      </section>

      <section className="wrap entry" aria-labelledby="entry-title">
        <div className="entry__head" data-reveal>
          <p className="kicker">入口</p>
          <h2 id="entry-title" className="statement">
            次の卓のために。
          </h2>
          <p className="body-lg">次の飲み会に、何を置くか。</p>
        </div>

        <Link href="/ba/office" className="feature" data-rise>
          <div className="feature__media media" data-parallax>
            <Photo name="place" sizes="(min-width: 960px) 720px, calc(100vw - 40px)" />
          </div>
          <div className="feature__body">
            <p className="folio">No. 01</p>
            <div className="feature__text">
              <p className="kicker">場</p>
              <h3 className="feature__title">
                <span className="nb">オフィスの</span>
                <span className="nb">オープンな飲み会</span>
              </h3>
              <p>デスクが卓になる。窓のあるITの会社。</p>
            </div>
            <JourneyMark>次の卓の場を見る</JourneyMark>
          </div>
        </Link>
      </section>

      <section className="wrap choose" aria-labelledby="choose-title">
        <div className="choose__head" data-reveal>
          <p className="kicker">選ぶ</p>
          <h2 id="choose-title" className="statement">
            場、見た目、
            <br />
            サイズ、味。
          </h2>
          <div className="rule" data-rule aria-hidden="true" />
        </div>
        <AxisList />
      </section>
    </PageMotion>
  );
}
