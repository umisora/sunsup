import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap about">
      <header className="about__head">
        <p className="kicker">sunsup</p>
        <h1 className="statement">このページはありません。</h1>
        <p className="lead">
          <Link href="/" className="text-link">
            入口へ
          </Link>
        </p>
      </header>
    </section>
  );
}
