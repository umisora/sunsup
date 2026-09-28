import type { Metadata } from "next";
import Link from "next/link";
import { AxisList } from "@/components/AxisList";
import { PageMotion } from "@/components/PageMotion";
import { StillLife } from "@/components/StillLife";

export const metadata: Metadata = {
  title: { absolute: "sunsup" },
};

export default function HomePage() {
  return (
    <PageMotion kind="home">
      <div className="glass-mark" aria-hidden="true" />
      <div className="hero-scene">
        <StillLife variant="window" />
      </div>
      <div className="hero-copy">
        <p className="kicker enter">コンセプトサイト</p>
        <div className="brass-rule" aria-hidden="true" />
        <h1>
          <span className="line enter">飲み会でも、</span>
          <span className="line enter">おしゃれに美味しく。</span>
        </h1>
        <p className="lead enter">次のオフィスの卓に、何を置くか。</p>
      </div>

      <section className="section">
        <p className="kicker">入口</p>
        <h2>次の卓のために。</h2>
        <p>次の飲み会に、何を置くか。</p>
      </section>

      <Link href="/ba/office" className="place-card rise">
        <div className="place-card__scene">
          <StillLife variant="table" />
        </div>
        <div className="place-card__body">
          <p className="kicker">場</p>
          <h2>オフィスのオープンな飲み会</h2>
          <p>デスクが卓になる。窓のあるITの会社。</p>
          <span className="journey">
            <span className="journey__bar" aria-hidden="true" />
            次の卓の場を見る
          </span>
        </div>
      </Link>

      <section className="section axes-block">
        <div className="rise">
          <p className="kicker">選ぶ</p>
          <h2>場、見た目、サイズ、味。</h2>
        </div>
        <AxisList />
      </section>
    </PageMotion>
  );
}
