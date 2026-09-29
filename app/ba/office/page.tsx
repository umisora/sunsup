import type { Metadata } from "next";
import { JourneyLink } from "@/components/JourneyLink";
import { PageMotion } from "@/components/PageMotion";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: "オフィスのオープンな飲み会",
};

const CRITERIA = [
  {
    no: "01",
    title: "見た目",
    lines: ["卓に置いたとき、場の空気に合うものを選びます。", "緑のガラス。短い缶。ラベルが、午後の卓に馴染むもの。"],
  },
  {
    no: "02",
    title: "サイズ",
    lines: ["一人が、その場で飲み切る量。", "卓で分けられる瓶。短い缶。"],
  },
  {
    no: "03",
    title: "味",
    lines: ["果実、炭酸、苦み。冷たいこと。", "乾杯の気泡は、炭酸の瓶で足ります。"],
  },
] as const;

export default function OfficePage() {
  return (
    <PageMotion kind="office">
      <section className="wrap split-hero" aria-labelledby="office-title">
        <div className="split-hero__copy">
          <p className="folio" data-intro>
            No. 01
          </p>
          <p className="kicker" data-intro>
            場
          </p>
          <h1 id="office-title" className="display">
            <span className="line">
              <span data-line>オフィスの</span>
            </span>
            <span className="line">
              <span data-line>オープンな飲み会</span>
            </span>
          </h1>
          <p className="lead" data-intro>
            次にデスクが卓になる午後。
          </p>
        </div>
        <div className="split-hero__media media" data-intro-media data-parallax>
          <Photo name="office" sizes="(min-width: 960px) 720px, calc(100vw - 40px)" priority />
        </div>
      </section>

      <section className="wrap scene" aria-labelledby="scene-title">
        <p id="scene-title" className="kicker" data-reveal>
          この場
        </p>
        <div className="scene__text" data-reveal>
          <p>ITの会社の、開いた飲み会です。会議テーブル、立ち話。窓の外はまだ昼に近い。</p>
          <p>卓は、次の日のデスクと、長いテーブルです。</p>
        </div>
      </section>

      <section className="wrap criteria" aria-label="この場での選び方">
        <ol className="criteria__list" data-stagger>
          {CRITERIA.map((item) => (
            <li key={item.no} className="criterion" data-stagger-item>
              <span className="numeral" aria-hidden="true">
                {item.no}
              </span>
              <h2>{item.title}</h2>
              {item.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap invite" aria-labelledby="invite-title">
        <div className="invite__media media" data-parallax>
          <Photo name="detail" sizes="(min-width: 960px) 600px, calc(100vw - 40px)" />
        </div>
        <div className="invite__body" data-rise>
          <div className="rule" data-rule aria-hidden="true" />
          <p className="invite__note">美味いブドウのジュースを、卓の中央に置ける。</p>
          <h2 id="invite-title" className="invite__desire">
            この空気で、
            <br />
            一杯を決める。
          </h2>
          <JourneyLink href="/drink/shell">一杯へ</JourneyLink>
        </div>
      </section>
    </PageMotion>
  );
}
