// Barème : chaque question vaut 1 point, notée indépendamment (voir PLAN.md §5).
// - Réponse unique : 1 si la bonne case est cochée (et elle seule), sinon 0.
// - Réponses multiples : max(0, (bonnes cochées − fausses cochées) / nombre de bonnes réponses).

export interface QuestionNotable {
  type: "unique" | "multiple";
  correctes: number[];
}

export function noterQuestion(q: QuestionNotable, cochees: readonly number[]): number {
  const correctes = new Set(q.correctes);
  const choix = new Set(cochees);
  if (correctes.size === 0) return 0;
  if (q.type === "unique") {
    return choix.size === 1 && correctes.has([...choix][0]) ? 1 : 0;
  }
  let bonnes = 0;
  let fausses = 0;
  for (const c of choix) {
    if (correctes.has(c)) bonnes++;
    else fausses++;
  }
  const note = (bonnes - fausses) / correctes.size;
  return Math.max(0, Math.min(1, note));
}

/** Convertit une somme de points sur `nbQuestions` en note sur 20. */
export function surVingt(points: number, nbQuestions: number): number {
  if (nbQuestions <= 0) return 0;
  return (points / nbQuestions) * 20;
}

/** Arrondi à 2 décimales (évite 0,30000000004). */
export const arrondi = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
