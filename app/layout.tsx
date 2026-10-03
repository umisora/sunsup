import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader, SkipLink } from "@/design-system";
import "@/design-system/styles/index.css";

const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-500-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const shippori = localFont({
  src: "../fonts/shippori-mincho-500.woff2",
  weight: "500",
  style: "normal",
  variable: "--font-shippori",
  display: "swap",
});

const zen = localFont({
  src: [
    { path: "../fonts/zen-kaku-gothic-new-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/zen-kaku-gothic-new-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-zen",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sunsup-dv4.pages.dev"),
  title: {
    default: "sunsup",
    template: "%s｜sunsup",
  },
  description: "飲み会でも、おしゃれに美味しく飲めるノンアルを届ける",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${cormorant.variable} ${shippori.variable} ${zen.variable} js`}>
      <body>
        <SkipLink target="main" />
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <noscript>
          <style>{`[data-intro],[data-line],[data-reveal],[data-stagger-item]{visibility:visible !important}[data-intro-media]{clip-path:none !important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
