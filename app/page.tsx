import type { Metadata } from "next";
import Link from "next/link";
import { AxisList } from "@/components/AxisList";
import { FillText } from "@/components/FillText";
import { JourneyLink, JourneyMark } from "@/components/JourneyLink";
import { PageMotion } from "@/components/PageMotion";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: { absolute: "sunsup" },
};

const TAGS = ["場", "見た目", "サイズ", "味"] as const;

export default function HomePage() {
  return (
    <PageMotion kind="home">
      <section className="hero" aria-labelledby="home-title">
        <div className="hero__stage media" data-intro-media data-parallax>
          <Photo name="table" sizes="100vw" priority />
        </div>

        <div className="hero__card" data-drift>
          <p className="chip" data-intro>
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
          <div className="hero__actions" data-intro>
            <JourneyLink href="/ba/office">次の卓の場を見る</JourneyLink>
          </div>
        </div>

        <ul className="hero__tags" aria-label="選ぶ軸" data-intro>
          {TAGS.map((tag) => (
            <li key={tag} className="chip chip--glass">
              {tag}
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap manifesto" aria-labelledby="entry-title">
        <p className="kicker">入口</p>
        <FillText
          as="h2"
          id="entry-title"
          className="manifesto__text"
          lines={["次の卓のために。", "次の飲み会に、", "何を置くか。"]}
        />
      </section>

      <section className="wrap entry" aria-label="最初の場">
        <Link href="/ba/office" className="feature" data-rise>
          <div className="feature__media media" data-parallax>
            <Photo name="place" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" />
            <span className="chip chip--glass feature__badge">No. 01</span>
          </div>
          <div className="feature__body">
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
            <span className="nb">場、見た目、</span>
            <span className="nb">サイズ、味。</span>
          </h2>
        </div>
        <AxisList />
      </section>
    </PageMotion>
  );
}
