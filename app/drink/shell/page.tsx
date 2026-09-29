import type { Metadata } from "next";
import { JourneyLink } from "@/components/JourneyLink";
import { JourneySteps } from "@/components/JourneySteps";
import { PageMotion } from "@/components/PageMotion";
import { Photo } from "@/components/Photo";
import { StoreRowSlot } from "@/components/StoreRowSlot";

export const metadata: Metadata = {
  title: "この卓の一杯",
};

const AXES = [
  {
    no: "01",
    title: "場",
    lines: ["次にデスクが卓になる午後。ITの会社の、開いた飲み会。", "家で試してから、次の卓へ。"],
  },
  { no: "02", title: "見た目", lines: ["緑のガラス。短い缶。午後の卓に馴染むラベル。"] },
  { no: "03", title: "サイズ", lines: ["一人が飲み切る量。短い缶。分けられる瓶。"] },
  { no: "04", title: "味", lines: ["果実、炭酸、冷たいこと。", "乾杯の気泡は、炭酸の瓶で足る。"] },
] as const;

export default function DrinkShellPage() {
  return (
    <PageMotion kind="shell">
      <section className="wrap shell-head" aria-labelledby="shell-title">
        <div>
          <JourneySteps current="drink" />
          <p className="kicker" data-intro>
            一杯
          </p>
          <h1 id="shell-title" className="display">
            <span className="line">
              <span data-line>この卓の一杯</span>
            </span>
          </h1>
        </div>
        <div className="shell-head__aside">
          <p className="lead" data-intro>
            午後の卓の、一本。
          </p>
          <p className="sublead" data-intro>
            ラベルより先に、置いたときの空気で選ぶ。
          </p>
        </div>
      </section>

      <section className="peak-stage" aria-labelledby="peak-title" data-peak-stage>
        <div className="peak-stage__frame media" data-peak-frame>
          <Photo name="peak-wide" narrow="peak" sizes="100vw" priority />
        </div>
        <div className="peak-stage__copy" data-peak-copy>
          <p className="folio">No. 02</p>
          <h2 id="peak-title" className="peak-stage__line">
            次の飲み会に、
            <br />
            これを置く。
          </h2>
        </div>
      </section>

      <section className="wrap shell-axes" aria-label="この一杯の選び方">
        <div className="shell-axes__media media" data-parallax>
          <Photo name="office" sizes="(min-width: 960px) 520px, calc(100vw - 32px)" position="78% 50%" decorative />
        </div>
        <ol className="shell-axes__list">
          {AXES.map((axis) => (
            <li key={axis.no} className="shell-axis" data-stagger-item>
              <span className="numeral" aria-hidden="true">
                {axis.no}
              </span>
              <h3>{axis.title}</h3>
              {axis.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap close" aria-labelledby="close-title">
        <div className="close__panel" data-rise>
          <p className="kicker kicker--light">次の飲み会</p>
          <h2 id="close-title" className="close__line">
            <span className="nb">次回これにしよ、</span>
            <br />
            <span className="nb">が立てばいい。</span>
          </h2>
          <p className="close__sub">家で届いてから、お試しして持っていってもよい。</p>
          <div className="close__actions">
            <JourneyLink href="/ba/office" tone="ghost">
              場へ戻る
            </JourneyLink>
          </div>
        </div>
        <StoreRowSlot />
      </section>
    </PageMotion>
  );
}
