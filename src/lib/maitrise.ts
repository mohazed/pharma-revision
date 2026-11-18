// Maîtrise d'un cours / module = somme des dernières notes ÷ nombre de questions du cours.
import type { CoursResume } from "./types";
import type { Progression } from "./store";

export function maitriseParCours(p: Progression): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of Object.values(p.questions)) if (s.c) m.set(s.c, (m.get(s.c) ?? 0) + s.derniere);
  return m;
}

export function maitriseCours(c: CoursResume, sommes: Map<string, number>): number {
  return c.comptes.qcm ? Math.min(1, (sommes.get(c.id) ?? 0) / c.comptes.qcm) : 0;
}

export function maitriseModule(cours: CoursResume[], sommes: Map<string, number>): number {
  const total = cours.reduce((t, c) => t + c.comptes.qcm, 0);
  if (!total) return 0;
  return Math.min(1, cours.reduce((t, c) => t + Math.min(c.comptes.qcm, sommes.get(c.id) ?? 0), 0) / total);
}

export const varModule = (couleur: string) => ({ "--mod": `var(--pr-mod-${couleur}, var(--pr-primary))` }) as React.CSSProperties;
