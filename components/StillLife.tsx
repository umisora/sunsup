import type { ReactNode } from "react";

type Variant = "window" | "table" | "conference" | "rim";

const labels: Record<Variant, string> = {
  window: "窓の光と、卓の緑のガラス",
  table: "卓の上の緑のガラス",
  conference: "長い卓と、一本の緑のガラス",
  rim: "緑のガラスの縁",
};

type StillLifeProps = {
  variant: Variant;
};

export function StillLife({ variant }: StillLifeProps) {
  return (
    <svg
      className="still"
      viewBox={viewBox(variant)}
      role="img"
      aria-label={labels[variant]}
    >
      {scene(variant)}
    </svg>
  );
}

function viewBox(variant: Variant): string {
  switch (variant) {
    case "window":
      return "0 0 720 405";
    case "table":
      return "0 0 720 540";
    case "conference":
      return "0 0 720 420";
    case "rim":
      return "0 0 720 420";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function scene(variant: Variant): ReactNode {
  switch (variant) {
    case "window":
      return <WindowScene />;
    case "table":
      return <TableScene />;
    case "conference":
      return <ConferenceScene />;
    case "rim":
      return <RimScene />;
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function WindowScene() {
  return (
    <>
      <defs>
        <linearGradient id="window-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="78%" stopColor="#F3EBDD" />
          <stop offset="100%" stopColor="#F3EBDD" />
        </linearGradient>
        <radialGradient id="window-pane" cx="32%" cy="28%" r="58%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="62%" stopColor="#E4EFE8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E4EFE8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="405" fill="url(#window-day)" />
      <rect x="48" y="28" width="624" height="236" fill="#FFF8EE" stroke="#E2D4C2" />
      <rect x="48" y="28" width="624" height="236" fill="url(#window-pane)" />
      <path d="M360 28v236M48 146h624" fill="none" stroke="#E2D4C2" />
      <path d="M36 264h648" fill="none" stroke="#E2D4C2" />
      <rect x="78" y="300" width="168" height="72" fill="#FFF8EE" stroke="#E2D4C2" />
      <path d="M78 322h168" fill="none" stroke="#E2D4C2" />
      <Glass x={520} y={292} scale={1} />
      <path d="M300 346h48" fill="none" stroke="#A57B32" />
    </>
  );
}

function TableScene() {
  return (
    <>
      <defs>
        <radialGradient id="table-light" cx="50%" cy="0%" r="75%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="55%" stopColor="#F7F1E6" />
          <stop offset="100%" stopColor="#E7F0EA" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <rect width="720" height="540" fill="#F3EBDD" />
      <rect width="720" height="540" fill="url(#table-light)" />
      <path d="M0 168h720" fill="none" stroke="#E2D4C2" />
      <rect x="64" y="250" width="210" height="150" fill="#FFF8EE" stroke="#E2D4C2" />
      <path d="M64 292h210M96 250v150" fill="none" stroke="#E2D4C2" />
      <ellipse cx="430" cy="392" rx="92" ry="18" fill="none" stroke="#E2D4C2" />
      <Glass x={430} y={250} scale={1.35} />
      <path d="M560 360h56" fill="none" stroke="#A57B32" />
    </>
  );
}

function ConferenceScene() {
  return (
    <>
      <defs>
        <linearGradient id="conf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="100%" stopColor="#F3EBDD" />
        </linearGradient>
        <radialGradient id="conf-light" cx="70%" cy="18%" r="48%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="100%" stopColor="#E4EFE8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="420" fill="url(#conf-wall)" />
      <rect x="36" y="32" width="648" height="188" fill="#FFF8EE" stroke="#E2D4C2" />
      <rect x="36" y="32" width="648" height="188" fill="url(#conf-light)" />
      <path d="M252 32v188M468 32v188M36 126h648" fill="none" stroke="#E2D4C2" />
      <path d="M48 248h624" fill="none" stroke="#E2D4C2" />
      <path d="M70 286h580l-48 96H128Z" fill="#FFF8EE" stroke="#E2D4C2" />
      <path d="M150 318h180" fill="none" stroke="#E2D4C2" />
      <Glass x={214} y={292} scale={0.72} />
      <rect x="470" y="318" width="92" height="48" fill="#F3EBDD" stroke="#E2D4C2" />
      <path d="M470 334h92" fill="none" stroke="#A57B32" />
    </>
  );
}

function RimScene() {
  return (
    <>
      <defs>
        <radialGradient id="rim-light" cx="28%" cy="18%" r="62%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="70%" stopColor="#F3EBDD" />
          <stop offset="100%" stopColor="#E4EFE8" />
        </radialGradient>
      </defs>
      <rect width="720" height="420" fill="url(#rim-light)" />
      <circle cx="360" cy="214" r="148" fill="#3F6B56" fillOpacity="0.05" stroke="#3F6B56" />
      <circle cx="360" cy="214" r="128" fill="none" stroke="#3F6B56" strokeOpacity="0.4" />
      <g className="still-glass">
        <ellipse cx="360" cy="214" rx="86" ry="22" fill="#FFF8EE" stroke="#3F6B56" />
        <path d="M292 214c6 46 28 74 68 74s62-28 68-74" fill="#3F6B56" fillOpacity="0.1" stroke="#3F6B56" />
        <path d="M318 206c8 28 22 42 42 42" fill="none" stroke="#FFF8EE" />
      </g>
      <path d="M250 292h64" fill="none" stroke="#A57B32" />
    </>
  );
}

function Glass({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g className="still-glass" transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="46" ry="11" fill="#FFF8EE" stroke="#3F6B56" />
      <path
        d="M-40 2  -30 78 Q 0 92 30 78 L 40 2"
        fill="#3F6B56"
        fillOpacity="0.14"
        stroke="#3F6B56"
      />
      <ellipse cx="0" cy="62" rx="26" ry="7" fill="#3F6B56" fillOpacity="0.22" />
      <path d="M-22 12  -16 70" fill="none" stroke="#FFF8EE" />
    </g>
  );
}
