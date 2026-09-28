import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hero-copy">
      <p className="kicker">sunsup</p>
      <div className="brass-rule" aria-hidden="true" />
      <h1>このページはありません。</h1>
      <p className="back-link">
        <Link href="/" className="text-link">
          入口へ
        </Link>
      </p>
    </div>
  );
}
