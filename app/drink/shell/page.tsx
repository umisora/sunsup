import type { Metadata } from "next";
import Link from "next/link";
import { PageMotion } from "@/components/PageMotion";
import { StillLife } from "@/components/StillLife";
import { StoreRowSlot } from "@/components/StoreRowSlot";

export const metadata: Metadata = {
  title: "この卓の一杯",
};

export default function DrinkShellPage() {
  return (
    <PageMotion kind="shell">
      <div className="hero-copy">
        <p className="kicker enter">一杯</p>
        <div className="brass-rule" aria-hidden="true" />
        <h1 className="enter">この卓の一杯</h1>
        <p className="lead enter">午後の卓の、一本。</p>
      </div>

      <div className="hero-scene mood">
        <StillLife variant="rim" />
      </div>
      <p className="desire">次の飲み会に、これを置く。</p>

      <section className="section">
        <h2>場</h2>
        <p>次にデスクが卓になる午後。ITの会社の、開いた飲み会。</p>
        <p>家で試してから、次の卓へ。</p>
      </section>

      <section className="section">
        <h2>見た目</h2>
        <p>緑のガラス。短い缶。午後の卓に馴染むラベル。</p>
      </section>

      <section className="section">
        <h2>サイズ</h2>
        <p>一人が飲み切る量。短い缶。分けられる瓶。</p>
      </section>

      <section className="section">
        <h2>味</h2>
        <p>果実、炭酸、冷たいこと。</p>
        <p>乾杯の気泡は、炭酸の瓶で足る。</p>
      </section>

      <section className="close">
        <p className="desire">次回これにしよ、が立てばいい。</p>
        <p>家で届いてから、お試しして持っていってもよい。</p>
      </section>

      <p className="back-link">
        <Link href="/ba/office" className="text-link">
          場へ戻る
        </Link>
      </p>
      <StoreRowSlot />
    </PageMotion>
  );
}
