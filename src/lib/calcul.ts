// Exercices de calcul : tirage des variables, évaluation de la formule, tolérance de ±1 %.
import type { Calcul } from "./types";
import { nombre } from "./format";

export type Valeurs = Record<string, number>;

const decimalesDe = (x: number) => {
  const s = String(x);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
};

export function tirerValeurs(calcul: Calcul, alea: () => number = Math.random): Valeurs {
  const v: Valeurs = {};
  for (const [nom, def] of Object.entries(calcul.variables ?? {})) {
    const min = Number(def.min);
    const max = Number(def.max);
    if (!(max > min)) {
      v[nom] = min;
      continue;
    }
    if (def.pas && def.pas > 0) {
      const n = Math.floor((max - min) / def.pas + 1e-9);
      const k = Math.floor(alea() * (n + 1));
      const d = Math.max(decimalesDe(def.pas), decimalesDe(min));
      v[nom] = Number((min + k * def.pas).toFixed(d));
    } else {
      v[nom] = Number((min + alea() * (max - min)).toFixed(2));
    }
  }
  return v;
}

const MATHS: Record<string, unknown> = {
  ...Object.fromEntries(Object.getOwnPropertyNames(Math).map((k) => [k, (Math as unknown as Record<string, unknown>)[k]])),
  ln: Math.log,
  log10: Math.log10,
};

export function evaluer(formule: string, valeurs: Valeurs): number {
  const noms = Object.keys(valeurs);
  const aides = Object.keys(MATHS).filter((k) => !noms.includes(k));
  const fn = new Function(...noms, ...aides, `"use strict"; return (${formule});`);
  return Number(fn(...noms.map((n) => valeurs[n]), ...aides.map((a) => MATHS[a])));
}

/** Réponse acceptée si l'écart relatif est ≤ 1 % (ou égale à la valeur arrondie affichée). */
export function estCorrect(saisie: number, attendu: number, decimales = 2, tolerance = 0.01): boolean {
  if (!Number.isFinite(saisie) || !Number.isFinite(attendu)) return false;
  if (Math.abs(saisie - attendu) <= Math.abs(attendu) * tolerance) return true;
  const arrondi = Number(attendu.toFixed(decimales));
  return Math.abs(saisie - arrondi) < 10 ** -(decimales + 3);
}

/** Remplace {variable} et {resultat}/{reponse} dans un texte par les valeurs tirées (format français). */
export function remplir(texte: string, valeurs: Valeurs, resultat?: number, decimales = 2): string {
  return texte.replace(/\{(\w+)\}/g, (m, nom: string) => {
    if (nom in valeurs) return nombre(valeurs[nom], 6);
    if ((nom === "resultat" || nom === "reponse") && resultat !== undefined) return nombre(resultat, decimales);
    return m;
  });
}
