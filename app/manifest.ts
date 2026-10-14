import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/design-system";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "オフィスの飲み会を任された人が、定時後に出すノンアルコールを選ぶサイトです。",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ebdd",
    theme_color: "#184474",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
