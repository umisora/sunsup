import type { ReactNode } from "react";
import { SITE_ORIGIN } from "@/lib/drinks";
import { jsonLdText, routeJsonLd } from "@/lib/jsonld";
import { getScene, scenePath } from "@/lib/scenes";

type SceneLayoutProps = {
  children: ReactNode;
  params: Promise<{ scene: string }>;
};

/** Publisher and CollectionPage for /ba/<scene>/. The page itself still emits the ItemList. */
export default async function SceneLayout({ children, params }: SceneLayoutProps) {
  const scene = getScene((await params).scene);
  if (!scene) {
    return children;
  }
  const path = scenePath(scene);
  return (
    <>
      {routeJsonLd({
        path,
        title: scene.metaTitle,
        description: scene.description,
        mainEntity: `${SITE_ORIGIN}${path}#drinks`,
      }).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      {children}
    </>
  );
}
