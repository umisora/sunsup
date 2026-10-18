"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ArrivalStand, ArrivalToast } from "./cast";
import styles from "./TableArrival.module.css";

gsap.registerPlugin(useGSAP);

export type TablePiece = {
  slug: string;
  name: string;
  src: string;
  stand: ArrivalStand;
  toast?: ArrivalToast;
  anchor?: boolean;
  nw: number;
  nh: number;
  l: number;
  t: number;
  cw: number;
  ch: number;
  fromX: string;
  fromY: string;
  fromR: number;
};

type TableArrivalProps = {
  pieces: readonly TablePiece[];
  /** A still that never decoded. The hero should draw a different drink. */
  onStillError?: (slug: string) => void;
};

function standClass(stand: ArrivalStand): string {
  switch (stand) {
    case "full":
      return styles.full;
    case "can":
      return styles.can;
    default: {
      const exhaustive: never = stand;
      return exhaustive;
    }
  }
}

function readMotion(el: HTMLElement): { x: string; y: string; rotation: number } {
  const style = getComputedStyle(el);
  const rotation = Number.parseFloat(style.getPropertyValue("--from-r"));
  return {
    x: style.getPropertyValue("--from-x").trim() || "0%",
    y: style.getPropertyValue("--from-y").trim() || "0%",
    rotation: Number.isFinite(rotation) ? rotation : 0,
  };
}

/** Bottles and cans set down on the office table, then a short toast. Settles; reduced motion shows the settled frame. */
export function TableArrival({ pieces, onStillError }: TableArrivalProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope || !onStillError) {
      return;
    }
    scope.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (!img.complete || img.naturalWidth !== 0) {
        return;
      }
      const slug = img.closest("[data-slug]")?.getAttribute("data-slug");
      if (slug) {
        onStillError(slug);
      }
    });
  }, [pieces, onStillError]);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) {
        return;
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        const stills = gsap.utils.toArray<HTMLElement>("[data-arrive]", scope);
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            gsap.set(stills, { willChange: "auto" });
          },
        });

        timeline.addLabel("set", 0.35);
        stills.forEach((still, index) => {
          const from = readMotion(still);
          const at = `set+=${index * 0.52}`;
          timeline.fromTo(
            still,
            { x: from.x, y: from.y, rotation: from.rotation },
            { x: 0, y: 0, rotation: 0, duration: 1.25 },
            at,
          );
          const floor = still.closest("[data-slot]")?.querySelector("[data-arrive-floor]");
          if (floor) {
            timeline.to(floor, { opacity: 1, duration: 0.4, ease: "power1.out" }, `${at}+=0.75`);
          }
        });

        const left = scope.querySelector<HTMLElement>('[data-toast="left"]');
        const right = scope.querySelector<HTMLElement>('[data-toast="right"]');
        const daylight = scope.querySelector("[data-daylight]");
        const clink = scope.querySelector("[data-clink]");

        timeline.addLabel("toast", 4.7);

        if (left && right) {
          const floors = [left, right]
            .map((still) => still.closest("[data-slot]")?.querySelector("[data-floor]"))
            .filter((floor): floor is Element => Boolean(floor));
          timeline.to(left, { y: -28, rotation: 8, duration: 0.9, ease: "power2.out" }, "toast");
          timeline.to(right, { y: -28, rotation: -8, duration: 0.9, ease: "power2.out" }, "toast");
          if (floors.length > 0) {
            timeline.to(floors, { scaleX: 0.58, opacity: 0.4, duration: 0.9, ease: "power2.out" }, "toast");
          }
          timeline.to([left, right], { y: 0, rotation: 0, duration: 1.15, ease: "power2.inOut" }, "toast+=1.5");
          if (floors.length > 0) {
            timeline.to(floors, { scaleX: 1, opacity: 1, duration: 1.15, ease: "power2.inOut" }, "toast+=1.5");
          }
        }

        if (clink) {
          timeline.fromTo(
            clink,
            { opacity: 0, scale: 0.55 },
            { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
            "toast+=0.5",
          );
          timeline.to(clink, { opacity: 0, scale: 0.85, duration: 0.55, ease: "power1.in" }, "toast+=1.25");
        }

        if (daylight) {
          timeline.to(daylight, { opacity: 0.92, duration: 0.75, ease: "power1.inOut" }, "toast");
          timeline.to(daylight, { opacity: 0.6, duration: 1.2, ease: "power1.inOut" }, "toast+=1.5");
        }
      });

      return () => {
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.scene}>
      <div className={styles.wall} aria-hidden="true" />
      <div className={styles.table} aria-hidden="true" />
      <div className={styles.set} data-count={pieces.length}>
        <div className={styles.clink} data-clink aria-hidden="true" />
        <ul className={styles.lineup} aria-label="テーブルに並ぶノンアルコール">
          {pieces.map((piece) => (
            <li
              key={piece.slug}
              className={`${styles.slot} ${standClass(piece.stand)}`}
              data-slot=""
              data-slug={piece.slug}
              style={
                {
                  "--nw": String(piece.nw),
                  "--nh": String(piece.nh),
                  "--l": String(piece.l),
                  "--t": String(piece.t),
                  "--cw": String(piece.cw),
                  "--ch": String(piece.ch),
                  "--from-x": piece.fromX,
                  "--from-y": piece.fromY,
                  "--from-r": `${piece.fromR}deg`,
                } as CSSProperties
              }
            >
              <span className={styles.shadow} data-floor="" data-arrive-floor={piece.anchor ? undefined : ""} aria-hidden="true" />
              <Link href={`/drink/${piece.slug}/`} className={styles.hit}>
                <span className={styles.frame}>
                  <img
                    className={styles.still}
                    src={piece.src}
                    alt=""
                    width={piece.nw}
                    height={piece.nh}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={() => onStillError?.(piece.slug)}
                    data-arrive={piece.anchor ? undefined : ""}
                    data-toast={piece.toast}
                  />
                </span>
                <span className={styles.name}>{piece.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.daylight} data-daylight aria-hidden="true" />
    </div>
  );
}
