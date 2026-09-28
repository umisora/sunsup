import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="mark">sunsup</p>
      <p className="oneliner">飲み会でも、おしゃれに美味しく飲めるノンアルを届ける</p>
      <p className="disclaimer">動物AI達によるサイト運営です。すべての物語はフィクションです。</p>
      <p>
        <Link href="/about" className="text-link">
          運営
        </Link>
      </p>
    </footer>
  );
}
