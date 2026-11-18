// Création des sessions QCM (entraînement, examen blanc, erreurs, express, annales).
import type { Qcm } from "./types";
import { chargerAnnales, chargerCours, melanger } from "./donnees";
import { estErreur, getProgression, modifier, nouvelId, type ModeSession, type RefQuestion, type Session } from "./store";

export const SECONDES_PAR_QUESTION = 120;
export const MODES_CHRONO: ModeSession[] = ["examen", "examen-module", "annale"];
export const estModeExamen = (m: ModeSession) => MODES_CHRONO.includes(m);

export const LIBELLES_MODE: Record<ModeSession, string> = {
  entrainement: "Entraînement",
  examen: "Examen blanc",
  erreurs: "Mes erreurs",
  express: "Révision express",
  "examen-module": "Examen blanc du module",
  annale: "Annale",
};

export interface ConfigSession {
  mode: ModeSession;
  /** chemins des cours */
  cours: string[];
  /** nombre de questions (0 = toutes) */
  nb: number;
  difficultes?: number[];
  titre: string;
  dureeSec?: number;
  retour?: string;
}

export async function poolDeQuestions(chemins: string[]): Promise<{ q: Qcm; src: string }[]> {
  const cours = await Promise.all(chemins.map((p) => chargerCours(p)));
  return cours.flatMap((c) => c.qcm.map((q) => ({ q, src: c.path })));
}

export async function creerSession(cfg: ConfigSession): Promise<Session | { erreur: string }> {
  let pool = await poolDeQuestions(cfg.cours);
  if (cfg.difficultes && cfg.difficultes.length > 0 && cfg.difficultes.length < 3) {
    pool = pool.filter(({ q }) => !q.difficulte || cfg.difficultes!.includes(q.difficulte));
  }
  if (cfg.mode === "erreurs") {
    const stats = getProgression().questions;
    pool = pool.filter(({ q }) => estErreur(stats[q.id]));
  }
  if (pool.length === 0) {
    return {
      erreur:
        cfg.mode === "erreurs"
          ? "Aucune erreur à retravailler dans cette sélection. Bravo !"
          : "Aucune question ne correspond à cette sélection.",
    };
  }
  const nb = cfg.mode === "express" ? 10 : cfg.nb;
  const choisies = melanger(pool).slice(0, nb > 0 ? nb : pool.length);
  const refs: RefQuestion[] = choisies.map(({ q, src }) => ({ id: q.id, src }));
  return demarrer({
    mode: cfg.mode,
    titre: cfg.titre,
    refs,
    dureeSec: cfg.dureeSec ?? (cfg.mode === "examen" || cfg.mode === "examen-module" ? refs.length * SECONDES_PAR_QUESTION : undefined),
    retour: cfg.retour,
  });
}

export function demarrer(s: Pick<Session, "mode" | "titre" | "refs" | "dureeSec" | "retour">): Session {
  const session: Session = { ...s, id: nouvelId(), reponses: {}, validees: {}, index: 0, debut: Date.now() };
  modifier((p) => {
    p.enCours = session;
  });
  return session;
}

/** Examen d'annale : toutes les questions, dans l'ordre, durée officielle. */
export async function sessionAnnale(id: string): Promise<Session | { erreur: string }> {
  const { annales, horsCours } = await chargerAnnales();
  if (id === "hors-cours") {
    if (!horsCours.length) return { erreur: "Aucune question hors cours." };
    return demarrer({
      mode: "entrainement",
      titre: "Annales — Hors cours actuel",
      refs: horsCours.map((q) => ({ id: q.id, src: "annale:hors-cours" })),
      retour: "/annales/",
    });
  }
  const a = annales.find((x) => x.id === id);
  if (!a || !a.questions.length) return { erreur: "Annale introuvable." };
  return demarrer({
    mode: "annale",
    titre: a.titre + (a.date ? ` (${new Date(a.date).toLocaleDateString("fr-FR")})` : ""),
    refs: a.questions.map((q) => ({ id: q.id, src: `annale:${a.id}` })),
    dureeSec: (a.duree ?? Math.round((a.questions.length * SECONDES_PAR_QUESTION) / 60)) * 60,
    retour: "/annales/",
  });
}

/** Refaire les questions ratées d'un résultat. */
export function sessionDepuisRefs(titre: string, refs: RefQuestion[]): Session {
  return demarrer({ mode: "entrainement", titre, refs: melanger(refs) });
}
