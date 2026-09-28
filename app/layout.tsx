import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const mark = localFont({
  src: "../fonts/cormorant-garamond-500.woff2",
  weight: "500",
  style: "normal",
  variable: "--font-mark",
  display: "swap",
});

const display = localFont({
  src: "../fonts/shippori-mincho-500.woff2",
  weight: "500",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../fonts/zen-kaku-gothic-new-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/zen-kaku-gothic-new-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "sunsup",
    template: "%s｜sunsup",
  },
  description: "飲み会でも、おしゃれに美味しく飲めるノンアルを届ける",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${mark.variable} ${display.variable} ${sans.variable} js`}>
      <body>
        <a className="skip" href="#main">
          本文へ
        </a>
        <div className="frame">
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
        <noscript>
          <style>{`.brass-rule{transform:none !important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
