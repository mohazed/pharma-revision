// « ⚑ Signaler » : ouvre un ticket GitHub prérempli (aucune donnée collectée automatiquement).
export const DEPOT = "https://github.com/mohazed/pharma-revision";

export function lienSignalement(opts: { id: string; enonce?: string; cours?: string | null; type?: string }): string {
  const titre = `Erreur signalée : ${opts.id}`;
  const corps = [
    `**Élément** : \`${opts.id}\``,
    opts.cours ? `**Cours** : ${opts.cours}` : "",
    opts.type ? `**Type** : ${opts.type}` : "",
    opts.enonce ? `**Énoncé** : ${opts.enonce.slice(0, 300)}` : "",
    "",
    "**Quel est le problème ?**",
    "(réponse fausse, faute, ambiguïté, hors cours…)",
    "",
    "**Correction proposée (avec la page du cours si possible)** :",
    "",
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  const p = new URLSearchParams({ title: titre, body: corps, labels: "contenu" });
  return `${DEPOT}/issues/new?${p.toString()}`;
}
