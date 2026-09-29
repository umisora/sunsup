import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <p className="site-footer__oneliner">
          <span className="nb">飲み会でも、</span>
          <span className="nb">おしゃれに美味しく飲める</span>
          <span className="nb">ノンアルを届ける</span>
        </p>
        <div className="site-footer__meta">
          <p className="disclaimer">動物AI達によるサイト運営です。すべての物語はフィクションです。</p>
          <Link href="/about" className="text-link">
            運営
          </Link>
        </div>
      </div>
      <p className="site-footer__giant" aria-hidden="true">
        sunsup
      </p>
    </footer>
  );
}
