// Événements anonymes Vercel Analytics (aucune donnée personnelle : seulement le mode).
import { track } from "@vercel/analytics";

export function evenement(nom: "session_qcm_terminee" | "flashcards_session" | "examen_blanc_termine", mode?: string) {
  try {
    track(nom, mode ? { mode } : undefined);
  } catch {
    /* analytics indisponible : sans importance */
  }
}
