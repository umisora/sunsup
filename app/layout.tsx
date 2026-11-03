import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SITE_NAME, SiteFooter, SiteHeader, SkipLink } from "@/design-system";
import { SITE_DESCRIPTION } from "@/design-system/brand";
import { categorySummaries, SITE_ORIGIN } from "@/lib/drinks";
import "@/design-system/styles/index.css";
import { Beacons } from "./_metrics/Beacons";
import { Clarity } from "./_metrics/Clarity";

const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-500-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

/*
  Shippori Mincho and Zen Kaku Gothic New are ~480KB of Japanese glyphs together. Fetched with the page,
  they held back the drink still on phones, so they load from /fonts/jp.css after first paint instead.
  The swap switches media from "print" to "all" once the sheet is in; <noscript> loads it plainly.
*/
const ASYNC_FONTS = `document.querySelectorAll('link[data-async-font]').forEach(function(l){function on(){l.media='all'}if(l.sheet){on()}else{l.addEventListener('load',on)}})`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
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
  description: SITE_DESCRIPTION,
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${cormorant.variable} js`}>
      <head>
        <link rel="stylesheet" href="/fonts/jp.css" media="print" data-async-font="" />
        <script dangerouslySetInnerHTML={{ __html: ASYNC_FONTS }} />
        <noscript>
          <link rel="stylesheet" href="/fonts/jp.css" />
        </noscript>
      </head>
      <body>
        <SkipLink target="main" />
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter categories={categorySummaries()} />
        <Beacons />
        <Clarity />
        <noscript>
          <style>{`[data-intro],[data-line],[data-reveal],[data-stagger-item]{visibility:visible !important}[data-intro-media]{clip-path:none !important}[data-arrive]{transform:none !important}[data-arrive-floor]{opacity:1 !important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
