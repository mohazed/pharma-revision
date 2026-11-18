import { useMemo } from "react";
import type { CoursResume } from "../lib/types";
import { useProgression } from "../lib/store";
import { maitriseCours, maitriseParCours } from "../lib/maitrise";

const TYPES: [keyof CoursResume["comptes"], string][] = [
  ["qcm", "QCM"],
  ["flashcards", "cartes"],
  ["cas", "cas"],
  ["calculs", "calculs"],
  ["structures", "structures"],
];

export default function ListeCours({ cours }: { cours: CoursResume[] }) {
  const p = useProgression();
  const sommes = useMemo(() => maitriseParCours(p), [p]);
  return (
    <ul className="flex flex-col gap-2.5">
      {cours.map((c) => {
        const m = maitriseCours(c, sommes);
        return (
          <li key={c.path}>
            <a href={`/cours/${c.path}/`} className="carte carte-module flex items-center gap-4 p-4 text-ink no-underline">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-heading text-lg font-extrabold mod-ink" style={{ background: "color-mix(in oklab, var(--mod) 13%, var(--pr-surface))" }}>
                {c.type === "td" ? "TD" : c.ordre}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold leading-snug">{c.titre}</span>
                  {c.nouveau && <span className="pastille pastille-nouveau">Nouveau</span>}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {TYPES.filter(([k]) => c.comptes[k] > 0)
                    .map(([k, l]) => `${c.comptes[k]} ${l}`)
                    .join(" · ")}
                  {c.comptes.fiche ? " · fiche" : ""}
                </span>
                <span className="gelule gelule-module mt-2 block" aria-hidden="true">
                  <span style={{ width: `${m * 100}%` }} />
                </span>
              </span>
              <span className="tnum mod-ink shrink-0 font-heading font-extrabold">{Math.round(m * 100)} %</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
