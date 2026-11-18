// Chargement du contenu au moment du build (import.meta.glob sur content/**).
// Ce module n'est importé que par les pages .astro et les endpoints : rien n'est envoyé au navigateur.
import type {
  Annale,
  CarteMentale,
  Cours,
  CoursMeta,
  CoursResume,
  IndexDonnees,
  ModuleInfo,
  Qcm,
  Tableau,
  Terme,
} from "./types";

const fichiers = import.meta.glob("/content/**/*.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** Les dossiers commençant par « _ » (ex. content/_exemple) sont des données de test : exclus en production. */
const inclureExemples =
  import.meta.env.DEV || (typeof process !== "undefined" && process.env.PHARMA_EXEMPLE === "1");

const estIgnore = (chemin: string) =>
  !inclureExemples && chemin.split("/").some((seg) => seg.startsWith("_"));

const PARTIES = ["cours", "qcm", "flashcards", "fiche", "cas", "calculs", "structures", "tableaux", "mnemos"] as const;

const ORDRE_MODULES = [
  "pharmacologie",
  "pharmacognosie",
  "pharmacie-galenique",
  "chimie-analytique",
  "chimie-therapeutique",
  "semiologie",
];

function construire() {
  const modulesJson = (fichiers["/content/modules.json"] as ModuleInfo[] | undefined) ?? [];
  const dossiers = new Map<string, Record<string, unknown>>();
  const annales: Annale[] = [];
  const glossaire: Terme[] = [];

  for (const [chemin, data] of Object.entries(fichiers)) {
    const rel = chemin.replace(/^\/content\//, "");
    if (rel === "modules.json" || estIgnore(rel)) continue;
    const segments = rel.split("/");
    const nom = segments.pop()!.replace(/\.json$/, "");
    const parent = segments[segments.length - 1];
    if (parent === "annales") {
      if (data && Array.isArray((data as Annale).questions)) annales.push(data as Annale);
      continue;
    }
    if (parent === "glossaire") {
      if (Array.isArray(data)) glossaire.push(...(data as Terme[]));
      continue;
    }
    if (!(PARTIES as readonly string[]).includes(nom)) continue;
    const dossier = segments.join("/");
    if (!dossiers.has(dossier)) dossiers.set(dossier, {});
    dossiers.get(dossier)![nom] = data;
  }

  const maintenant = Date.now();
  const cours: Cours[] = [];
  for (const [path, parts] of dossiers) {
    const meta = parts.cours as CoursMeta | undefined;
    if (!meta) continue;
    const tableauxBruts = (parts.tableaux as (Tableau | CarteMentale)[] | undefined) ?? [];
    const modifie = meta.source?.modifiedTime ? Date.parse(meta.source.modifiedTime) : NaN;
    const qcm = ((parts.qcm as Qcm[] | undefined) ?? []).map((q) => ({ ...q, cours: meta.id ?? path }));
    cours.push({
      ...meta,
      id: meta.id ?? path,
      type: meta.type ?? (path.includes("/td/") ? "td" : "cours"),
      path,
      nouveau: Number.isFinite(modifie) && maintenant - modifie < 21 * 24 * 3600 * 1000,
      qcm,
      flashcards: (parts.flashcards as Cours["flashcards"]) ?? [],
      fiche: (parts.fiche as Cours["fiche"]) ?? null,
      cas: (parts.cas as Cours["cas"]) ?? [],
      calculs: (parts.calculs as Cours["calculs"]) ?? [],
      structures: ((parts.structures as Cours["structures"]) ?? []).filter((s) => s && s.smiles),
      tableaux: tableauxBruts.filter((t): t is Tableau => t && (t as CarteMentale).type !== "carte"),
      cartes: tableauxBruts.filter((t): t is CarteMentale => t && (t as CarteMentale).type === "carte"),
      mnemos: (parts.mnemos as Cours["mnemos"]) ?? [],
      comptes: {} as Cours["comptes"],
    });
  }

  // Fusion des questions d'annales dans le cours correspondant.
  const parId = new Map<string, Cours>();
  for (const c of cours) {
    parId.set(c.id, c);
    parId.set(c.path, c);
  }
  const horsCours: (Qcm & { annaleId: string })[] = [];
  for (const a of annales) {
    a.questions = a.questions.map((q, i) => {
      const libelle = q.annale ?? a.titre + (a.date ? " " + a.date.slice(0, 4) : "");
      const qq: Qcm = { ...q, id: q.id ?? `${a.id}/q${String(i + 1).padStart(2, "0")}`, origine: "annale", annale: libelle };
      const cible = qq.cours ? parId.get(qq.cours) : undefined;
      if (cible) cible.qcm.push({ ...qq, cours: cible.id });
      else {
        qq.cours = null;
        horsCours.push({ ...qq, annaleId: a.id });
      }
      return qq;
    });
  }

  for (const c of cours) {
    c.comptes = {
      qcm: c.qcm.length,
      annales: c.qcm.filter((q) => q.origine === "annale").length,
      flashcards: c.flashcards.length,
      fiche: c.fiche && Array.isArray(c.fiche.sections) ? 1 : 0,
      cas: c.cas.length,
      calculs: c.calculs.length,
      structures: c.structures.length,
      tableaux: c.tableaux.length + c.cartes.length,
      mnemos: c.mnemos.length,
    };
  }

  cours.sort((a, b) => (a.type === b.type ? a.ordre - b.ordre : a.type === "cours" ? -1 : 1));

  const slugs = new Set([...modulesJson.map((m) => m.slug), ...cours.map((c) => c.module)]);
  const modules: ModuleInfo[] = [...slugs]
    .map((slug) => modulesJson.find((m) => m.slug === slug) ?? { slug, titre: slug, couleur: "gris" })
    .sort((a, b) => {
      const ia = ORDRE_MODULES.indexOf(a.slug);
      const ib = ORDRE_MODULES.indexOf(b.slug);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  annales.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  glossaire.sort((a, b) => a.terme.localeCompare(b.terme, "fr", { sensitivity: "base" }));

  return { modules, cours, annales, horsCours, glossaire };
}

const donnees = construire();

export const getModules = () => donnees.modules;
export const getModule = (slug: string) => donnees.modules.find((m) => m.slug === slug);
export const getTousLesCours = () => donnees.cours;
export const getCoursDuModule = (slug: string) => donnees.cours.filter((c) => c.module === slug);
export const getCours = (path: string) => donnees.cours.find((c) => c.path === path);
export const getAnnales = () => donnees.annales;
export const getHorsCours = () => donnees.horsCours;
export const getGlossaire = () => donnees.glossaire;

export function resumeCours(c: Cours): CoursResume {
  const { qcm, flashcards, fiche, cas, calculs, structures, tableaux, cartes, mnemos, ...reste } = c;
  return reste;
}

export function getIndex(): IndexDonnees {
  const modules = donnees.modules.map((m) => {
    const cours = getCoursDuModule(m.slug).map(resumeCours);
    return { ...m, cours, totalQcm: cours.reduce((s, c) => s + c.comptes.qcm, 0) };
  });
  return {
    modules,
    annales: donnees.annales.map((a) => ({
      id: a.id,
      titre: a.titre,
      date: a.date,
      duree: a.duree,
      nbQuestions: a.questions.length,
      nbHorsCours: a.questions.filter((q) => !q.cours).length,
    })),
    totalQcm: modules.reduce((s, m) => s + m.totalQcm, 0),
    totalFlashcards: donnees.cours.reduce((s, c) => s + c.flashcards.length, 0),
  };
}
