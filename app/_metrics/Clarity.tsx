import Script from "next/script";

/**
 * Microsoft Clarity heatmaps. Off until the Pages project has NEXT_PUBLIC_CLARITY_ID set
 * (the project ID from clarity.microsoft.com → Settings → Overview), then rebuilt.
 */
export const CLARITY_ID = /^[a-z0-9]{6,20}$/.test(process.env.NEXT_PUBLIC_CLARITY_ID ?? "")
  ? (process.env.NEXT_PUBLIC_CLARITY_ID as string)
  : undefined;

export function Clarity() {
  if (!CLARITY_ID) {
    return null;
  }
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
