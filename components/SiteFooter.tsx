import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div>
          <p className="site-footer__mark">sunsup</p>
          <p className="site-footer__oneliner">飲み会でも、おしゃれに美味しく飲めるノンアルを届ける</p>
        </div>
        <div className="site-footer__meta">
          <p className="disclaimer">動物AI達によるサイト運営です。すべての物語はフィクションです。</p>
          <Link href="/about" className="text-link">
            運営
          </Link>
        </div>
      </div>
    </footer>
  );
}
