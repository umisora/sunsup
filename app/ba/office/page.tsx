import type { Metadata } from "next";
import { JourneyLink } from "@/components/JourneyLink";
import { PageMotion } from "@/components/PageMotion";
import { StillLife } from "@/components/StillLife";

export const metadata: Metadata = {
  title: "オフィスのオープンな飲み会",
};

export default function OfficePage() {
  return (
    <PageMotion kind="office">
      <div className="hero-scene">
        <StillLife variant="conference" />
      </div>
      <div className="hero-copy">
        <p className="kicker enter">場</p>
        <div className="brass-rule" aria-hidden="true" />
        <h1 className="enter">オフィスのオープンな飲み会</h1>
        <p className="lead enter">次にデスクが卓になる午後。</p>
      </div>

      <section className="section">
        <h2>この場</h2>
        <p>ITの会社の、開いた飲み会です。会議テーブル、立ち話。窓の外はまだ昼に近い。</p>
        <p>卓は、次の日のデスクと、長いテーブルです。</p>
      </section>

      <section className="section rise">
        <h2>見た目</h2>
        <p>卓に置いたとき、場の空気に合うものを選びます。</p>
        <p>緑のガラス。短い缶。ラベルが、午後の卓に馴染むもの。</p>
      </section>

      <section className="section rise">
        <h2>サイズ</h2>
        <p>一人が、その場で飲み切る量。</p>
        <p>卓で分けられる瓶。短い缶。</p>
      </section>

      <section className="section rise">
        <h2>味</h2>
        <p>果実、炭酸、苦み。冷たいこと。</p>
        <p>乾杯の気泡は、炭酸の瓶で足ります。美味いブドウのジュースを、卓の中央に置ける。</p>
      </section>

      <section className="cta-band">
        <div className="brass-rule" aria-hidden="true" />
        <p className="desire">この空気で、一杯を決める。</p>
        <JourneyLink href="/drink/shell">一杯へ</JourneyLink>
      </section>
    </PageMotion>
  );
}
