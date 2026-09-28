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
    <svg className="still" viewBox={viewBox(variant)} role="img" aria-label={labels[variant]}>
      {scene(variant)}
    </svg>
  );
}

function viewBox(variant: Variant): string {
  switch (variant) {
    case "window":
      return "0 0 720 420";
    case "table":
      return "0 0 720 540";
    case "conference":
      return "0 0 720 440";
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
      <rect width="720" height="420" fill="#F3EBDD" />
      <rect x="36" y="22" width="648" height="268" fill="#E5F0EA" stroke="#CDBFAE" />
      <rect x="36" y="22" width="324" height="134" fill="#F7FBF8" />
      <rect x="360" y="22" width="324" height="134" fill="#F3F8F5" />
      <rect x="36" y="156" width="324" height="134" fill="#EEF5F1" />
      <rect x="360" y="156" width="324" height="134" fill="#E7F1EB" />
      <path d="M360 22v268M36 156h648" fill="none" stroke="#D9CBB8" strokeWidth="1.5" />
      <rect x="36" y="22" width="648" height="268" fill="none" stroke="#CDBFAE" />
      <rect x="0" y="304" width="720" height="116" fill="#F7F1E6" />
      <path d="M0 304h720" fill="none" stroke="#CDBFAE" />
      <rect x="72" y="328" width="176" height="68" fill="#FFF8EE" stroke="#E2D4C2" />
      <path d="M72 350h176" fill="none" stroke="#E2D4C2" />
      <Glass x={500} y={300} scale={1} />
      <path d="M280 360h56" fill="none" stroke="#A57B32" strokeWidth="1.5" />
    </>
  );
}

function TableScene() {
  return (
    <>
      <defs>
        <radialGradient id="table-light" cx="50%" cy="8%" r="78%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="48%" stopColor="#F4EFE4" />
          <stop offset="100%" stopColor="#E4EFE8" />
        </radialGradient>
      </defs>
      <rect width="720" height="540" fill="url(#table-light)" />
      <path d="M0 150h720" fill="none" stroke="#E2D4C2" />
      <rect x="48" y="210" width="200" height="168" fill="#FFF8EE" stroke="#E2D4C2" />
      <path d="M48 252h200M88 210v168" fill="none" stroke="#E8DCCB" />
      <Glass x={430} y={248} scale={1.35} />
      <path d="M560 372h48" fill="none" stroke="#A57B32" strokeWidth="1.5" />
    </>
  );
}

function ConferenceScene() {
  return (
    <>
      <rect width="720" height="440" fill="#F3EBDD" />
      <rect x="28" y="20" width="664" height="196" fill="#E7F1EB" stroke="#CDBFAE" />
      <rect x="28" y="20" width="221" height="98" fill="#F7FBF8" />
      <rect x="249" y="20" width="222" height="98" fill="#F4F9F6" />
      <rect x="471" y="20" width="221" height="98" fill="#EEF6F1" />
      <path d="M249 20v196M471 20v196M28 118h664" fill="none" stroke="#D9CBB8" />
      <path d="M20 216h680" fill="none" stroke="#CDBFAE" strokeWidth="1.5" />
      <path d="M64 248h592l-52 150H124Z" fill="#FFF8EE" stroke="#CDBFAE" />
      <path d="M150 300h220" fill="none" stroke="#E2D4C2" />
      <Glass x={360} y={276} scale={1} />
      <rect x="468" y="312" width="108" height="52" fill="#F3EBDD" stroke="#E2D4C2" />
      <path d="M468 328h108" fill="none" stroke="#A57B32" />
    </>
  );
}

function RimScene() {
  return (
    <>
      <defs>
        <radialGradient id="rim-light" cx="24%" cy="12%" r="70%">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="55%" stopColor="#F3EBDD" />
          <stop offset="100%" stopColor="#E5F0EA" />
        </radialGradient>
      </defs>
      <rect width="720" height="420" fill="url(#rim-light)" />
      <Glass x={360} y={132} scale={1.55} />
      <path d="M250 300h72" fill="none" stroke="#A57B32" strokeWidth="1.5" />
    </>
  );
}

function Glass({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g className="still-glass">
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx="0" cy="86" rx="30" ry="6" fill="#E4D8C8" />
        <path
          d="M-34 10 L-26 74 Q 0 88 26 74 L 34 10 Z"
          fill="#D7E6DE"
          stroke="#3F6B56"
          strokeWidth="1.6"
        />
        <path d="M-28 38 L-24 70 Q 0 82 24 70 L 28 38 Z" fill="#3F6B56" fillOpacity="0.34" />
        <ellipse cx="0" cy="10" rx="36" ry="10" fill="#F3FAF6" stroke="#3F6B56" strokeWidth="1.6" />
        <path d="M-16 18 C-14 36 -13 54 -11 68" fill="none" stroke="#FFF8EE" strokeWidth="1.6" />
      </g>
    </g>
  );
}
