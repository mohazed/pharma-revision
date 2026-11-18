// Répétition espacée, inspirée de SM-2.
// Notes : 0 « À revoir », 1 « Difficile », 2 « Bien », 3 « Facile ».

export type NoteSrs = 0 | 1 | 2 | 3;

export interface EtatCarte {
  /** facteur de facilité */
  ef: number;
  /** intervalle en jours */
  intervalle: number;
  /** nombre de réussites consécutives */
  reps: number;
  /** prochaine échéance (timestamp ms) */
  due: number;
  /** nombre d'oublis */
  oublis: number;
  derniere?: number;
}

const JOUR = 24 * 3600 * 1000;

export const etatInitial = (): EtatCarte => ({ ef: 2.5, intervalle: 0, reps: 0, due: 0, oublis: 0 });

export function reviser(etat: EtatCarte | undefined, note: NoteSrs, maintenant = Date.now()): EtatCarte {
  const e = { ...(etat ?? etatInitial()) };
  // qualité SM-2 (0..5) correspondant aux 4 boutons
  const qualite = [1, 3, 4, 5][note];
  e.ef = Math.max(1.3, e.ef + (0.1 - (5 - qualite) * (0.08 + (5 - qualite) * 0.02)));
  if (note === 0) {
    e.reps = 0;
    e.oublis += 1;
    e.intervalle = 0;
    e.due = maintenant + 10 * 60 * 1000; // revoir dans 10 min
  } else {
    if (e.reps === 0) e.intervalle = note === 1 ? 1 : note === 2 ? 1 : 3;
    else if (e.reps === 1) e.intervalle = note === 1 ? 3 : note === 2 ? 6 : 8;
    else {
      const facteur = note === 1 ? 1.2 : note === 2 ? e.ef : e.ef * 1.3;
      e.intervalle = Math.max(e.intervalle + 1, Math.round(e.intervalle * facteur));
    }
    e.reps += 1;
    e.due = maintenant + e.intervalle * JOUR;
  }
  e.derniere = maintenant;
  return e;
}

export const estDue = (etat: EtatCarte | undefined, maintenant = Date.now()) => !etat || etat.due <= maintenant;
export const estNouvelle = (etat: EtatCarte | undefined) => !etat;
