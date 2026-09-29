import type { Metadata } from "next";
import Link from "next/link";
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
      <section className="wrap peak" aria-labelledby="shell-title">
        <div className="peak__media media" data-intro-media>
          <Photo name="peak" sizes="(min-width: 960px) 560px, calc(100vw - 40px)" priority />
        </div>

        <div className="peak__copy">
          <div className="peak__intro">
            <p className="kicker" data-intro>
              一杯
            </p>
            <h1 id="shell-title" className="display">
              <span className="line">
                <span data-line>この卓の一杯</span>
              </span>
            </h1>
            <p className="lead" data-intro>
              午後の卓の、一本。
            </p>
            <p className="sublead" data-intro>
              ラベルより先に、置いたときの空気で選ぶ。
            </p>
          </div>

          <p className="peak__desire" data-reveal>
            次の飲み会に、
            <br />
            これを置く。
          </p>

          <ol className="peak__axes" data-stagger>
            {AXES.map((axis) => (
              <li key={axis.no} className="peak__axis" data-stagger-item>
                <span className="numeral" aria-hidden="true">
                  {axis.no}
                </span>
                <div>
                  <h2>{axis.title}</h2>
                  {axis.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap close" aria-labelledby="close-title">
        <div className="close__panel" data-rise>
          <div className="rule rule--light" aria-hidden="true" />
          <h2 id="close-title" className="close__line">
            次回これにしよ、
            <br />
            が立てばいい。
          </h2>
          <p className="close__sub">家で届いてから、お試しして持っていってもよい。</p>
        </div>
        <StoreRowSlot />
        <p className="back">
          <Link href="/ba/office" className="text-link">
            場へ戻る
          </Link>
        </p>
      </section>
    </PageMotion>
  );
}
