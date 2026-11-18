// Progression locale : tout reste dans le navigateur (localStorage), schéma versionné.
// Aucune donnée n'est envoyée à un serveur.
import { useSyncExternalStore } from "react";
import type { EtatCarte } from "./srs";
import { jourLocal } from "./format";

export const CLE = "pharmarevision";
export const VERSION_SCHEMA = 1;

export type ModeSession = "entrainement" | "examen" | "erreurs" | "express" | "examen-module" | "annale";

export interface Reglages {
  theme: "systeme" | "clair" | "sombre";
  mouvement: "systeme" | "reduit" | "complet";
  examens: { id: string; libelle: string; date: string }[];
}

export interface StatQuestion {
  /** id du cours (null = hors cours) */
  c: string | null;
  /** nombre de tentatives */
  n: number;
  /** dernière note (0..1) */
  derniere: number;
  meilleure: number;
  erreurs: number;
  at: number;
}

export interface RefQuestion {
  id: string;
  /** source des données : chemin du cours, ou « annale:<id> » */
  src: string;
}

export interface Session {
  id: string;
  mode: ModeSession;
  titre: string;
  refs: RefQuestion[];
  reponses: Record<string, number[]>;
  validees: Record<string, boolean>;
  index: number;
  debut: number;
  /** durée limite en secondes (modes chronométrés) */
  dureeSec?: number;
  retour?: string;
}

export interface DetailResultat {
  id: string;
  src: string;
  cours: string | null;
  note: number;
  cochees: number[];
}

export interface Resultat {
  id: string;
  mode: ModeSession;
  titre: string;
  date: number;
  points: number;
  nb: number;
  note20: number;
  dureeSec: number;
  details: DetailResultat[];
}

export interface Progression {
  version: number;
  reglages: Reglages;
  questions: Record<string, StatQuestion>;
  cartes: Record<string, EtatCarte & { c?: string }>;
  jours: string[];
  resultats: Resultat[];
  enCours: Session | null;
  dernierCours?: { path: string; titre: string; at: number };
}

export const progressionVide = (): Progression => ({
  version: VERSION_SCHEMA,
  reglages: { theme: "clair", mouvement: "systeme", examens: [] },
  questions: {},
  cartes: {},
  jours: [],
  resultats: [],
  enCours: null,
});

/** Migration d'un ancien schéma vers le schéma courant. */
export function migrer(brut: unknown): Progression {
  const base = progressionVide();
  if (!brut || typeof brut !== "object") return base;
  const p = brut as Partial<Progression>;
  // version 1 = schéma actuel ; les futures migrations s'ajouteront ici (if (p.version === 1) {...}).
  return {
    ...base,
    ...p,
    version: VERSION_SCHEMA,
    reglages: { ...base.reglages, ...(p.reglages ?? {}) },
    questions: p.questions ?? {},
    cartes: p.cartes ?? {},
    jours: Array.isArray(p.jours) ? p.jours : [],
    resultats: Array.isArray(p.resultats) ? p.resultats : [],
    enCours: p.enCours ?? null,
  };
}

let etat: Progression | null = null;
const abonnes = new Set<() => void>();

function lire(): Progression {
  if (etat) return etat;
  if (typeof window === "undefined") return (etat = progressionVide());
  try {
    const s = window.localStorage.getItem(CLE);
    etat = s ? migrer(JSON.parse(s)) : progressionVide();
  } catch {
    etat = progressionVide();
  }
  return etat;
}

function ecrire(p: Progression) {
  etat = p;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    /* stockage plein ou indisponible (navigation privée) : on garde en mémoire */
  }
  abonnes.forEach((f) => f());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === CLE) {
      etat = null;
      abonnes.forEach((f) => f());
    }
  });
}

export const getProgression = lire;

export function modifier(fn: (p: Progression) => Progression | void) {
  const copie = structuredClone(lire());
  const res = fn(copie);
  ecrire(res ?? copie);
}

export function useProgression(): Progression {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lire,
    progressionVide_serveur,
  );
}
const PROG_SERVEUR = progressionVide();
function progressionVide_serveur() {
  return PROG_SERVEUR;
}

/* ---------- Actions ---------- */

export function marquerActivite(p: Progression) {
  const j = jourLocal();
  if (!p.jours.includes(j)) {
    p.jours.push(j);
    if (p.jours.length > 400) p.jours = p.jours.slice(-400);
  }
}

export function enregistrerReponse(p: Progression, id: string, cours: string | null, note: number) {
  const s = p.questions[id] ?? { c: cours, n: 0, derniere: 0, meilleure: 0, erreurs: 0, at: 0 };
  s.c = cours ?? s.c;
  s.n += 1;
  s.derniere = note;
  s.meilleure = Math.max(s.meilleure, note);
  if (note < 1) s.erreurs += 1;
  s.at = Date.now();
  p.questions[id] = s;
  marquerActivite(p);
}

export function serie(jours: string[]): number {
  const set = new Set(jours);
  const d = new Date();
  if (!set.has(jourLocal(d))) d.setDate(d.getDate() - 1); // la série reste valable jusqu'à ce soir
  let n = 0;
  while (set.has(jourLocal(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Questions à retravailler : dernière tentative non parfaite. */
export const estErreur = (s: StatQuestion | undefined) => !!s && s.n > 0 && s.derniere < 1;

export function exporter(): string {
  return JSON.stringify({ application: "PharmaRévision", exporteLe: new Date().toISOString(), ...lire() }, null, 2);
}

export function importer(texte: string): { ok: true } | { ok: false; erreur: string } {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, erreur: "Ce fichier n'est pas un fichier JSON valide." };
  }
  const b = brut as Record<string, unknown>;
  if (!b || typeof b !== "object" || typeof b.version !== "number" || typeof b.questions !== "object") {
    return { ok: false, erreur: "Ce fichier ne ressemble pas à une sauvegarde PharmaRévision." };
  }
  if ((b.version as number) > VERSION_SCHEMA) {
    return { ok: false, erreur: "Cette sauvegarde provient d'une version plus récente du site. Rechargez la page puis réessayez." };
  }
  delete b.application;
  delete b.exporteLe;
  ecrire(migrer(b));
  return { ok: true };
}

export function reinitialiser() {
  const reglages = lire().reglages;
  ecrire({ ...progressionVide(), reglages });
}

export const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
