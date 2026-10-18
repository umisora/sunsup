import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SITE_NAME, SiteFooter, SiteHeader, SkipLink } from "@/design-system";
import { categorySummaries } from "@/lib/drinks";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sunsup-dv4.pages.dev"),
  title: {
    default: SITE_NAME,
    template: `%s｜${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
  },
  description: "オフィスの飲み会を任された人が、定時後に出すノンアルコールを選ぶサイトです。",
  twitter: { card: "summary_large_image" },
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
        <SiteFooter categories={categorySummaries()} />
        <noscript>
          <style>{`[data-intro],[data-line],[data-reveal],[data-stagger-item]{visibility:visible !important}[data-intro-media]{clip-path:none !important}[data-arrive]{transform:none !important}[data-arrive-floor]{opacity:1 !important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
