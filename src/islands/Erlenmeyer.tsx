import { useEffect, useId, useState } from "react";

const D = "M23 5h14v19l15 30c2.4 5-1 11-7 11H15c-6 0-9.4-6-7-11l15-30z";
const Y0 = 9;
const Y1 = 65;

/** Erlenmeyer dont le niveau de liquide = maîtrise (0..1). Couleur : --mod du parent. */
export default function Erlenmeyer({ ratio, taille = 52 }: { ratio: number; taille?: number }) {
  const id = useId().replace(/:/g, "");
  const cible = Y1 - (Y1 - Y0) * Math.max(0, Math.min(1, ratio));
  const [ty, setTy] = useState(72);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setTy(cible)));
    return () => cancelAnimationFrame(r);
  }, [cible]);
  return (
    <svg className="erlen" viewBox="0 0 60 70" width={taille} height={(taille * 70) / 60} aria-hidden="true">
      <defs>
        <clipPath id={`c${id}`}>
          <path d={D} />
        </clipPath>
      </defs>
      <path d={D} style={{ fill: "color-mix(in oklab, var(--mod) 9%, transparent)" }} />
      <g clipPath={`url(#c${id})`}>
        <g className="liq" style={{ transform: `translateY(${ty}px)` }}>
          <path className="vague" d="M-60 0q7.5-3.5 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0V80H-60z" style={{ fill: "var(--mod)" }} />
          <circle className="bulle" cx="24" cy="12" r="2" style={{ fill: "var(--pr-surface)" }} />
          <circle className="bulle" cx="34" cy="18" r="1.5" style={{ fill: "var(--pr-surface)" }} />
          <circle className="bulle" cx="29" cy="22" r="2.4" style={{ fill: "var(--pr-surface)" }} />
        </g>
      </g>
      <path d="M20 5h20" style={{ stroke: "var(--mod)" }} strokeWidth="3" strokeLinecap="round" />
      <path d={D} fill="none" style={{ stroke: "var(--mod)" }} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
