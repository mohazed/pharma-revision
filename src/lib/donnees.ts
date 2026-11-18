// Accès aux données générées au build (/data/*.json), côté navigateur.
import type { Annale, Cours, IndexDonnees, Qcm, Terme } from "./types";
import type { RefQuestion } from "./store";

const memo = new Map<string, Promise<unknown>>();

function charger<T>(url: string): Promise<T> {
  if (!memo.has(url)) {
    const p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Impossible de charger ${url} (${r.status})`);
      return r.json();
    });
    p.catch(() => memo.delete(url));
    memo.set(url, p);
  }
  return memo.get(url) as Promise<T>;
}

export const chargerIndex = () => charger<IndexDonnees>("/data/index.json");
export const chargerCours = (path: string) => charger<Cours>(`/data/cours/${path}.json`);
export const chargerAnnales = () => charger<{ annales: Annale[]; horsCours: (Qcm & { annaleId: string })[] }>("/data/annales.json");
export const chargerGlossaire = () => charger<Terme[]>("/data/glossaire.json");

export interface EntreeRecherche {
  t: "cours" | "qcm" | "carte" | "terme" | "fiche";
  titre: string;
  texte?: string;
  url: string;
  ctx?: string;
}
export const chargerRecherche = () => charger<EntreeRecherche[]>("/data/recherche.json");

/** Charge les questions correspondant à des références de session. */
export async function chargerQuestions(refs: RefQuestion[]): Promise<Map<string, Qcm>> {
  const sources = [...new Set(refs.map((r) => r.src))];
  const res = new Map<string, Qcm>();
  await Promise.all(
    sources.map(async (src) => {
      if (src.startsWith("annale:")) {
        const { annales, horsCours } = await chargerAnnales();
        const id = src.slice("annale:".length);
        const qs = id === "hors-cours" ? horsCours : annales.find((a) => a.id === id)?.questions ?? [];
        qs.forEach((q) => res.set(q.id, q));
      } else {
        const c = await chargerCours(src);
        c.qcm.forEach((q) => res.set(q.id, q));
      }
    }),
  );
  return res;
}

/** Retrouve le chemin d'un cours à partir de son id. */
export function cheminDuCours(index: IndexDonnees, id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  for (const m of index.modules) for (const c of m.cours) if (c.id === id || c.path === id) return c.path;
  return undefined;
}

export function trouverCours(index: IndexDonnees, id: string | null | undefined) {
  if (!id) return undefined;
  for (const m of index.modules) for (const c of m.cours) if (c.id === id || c.path === id) return { cours: c, module: m };
  return undefined;
}

export function melanger<T>(t: T[]): T[] {
  const a = [...t];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
