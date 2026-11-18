import { getGlossaire, getModules, getTousLesCours } from "../../lib/content";
// Index de recherche global (léger) : cours, questions, flashcards, fiches, glossaire.
export const GET = () => {
  const mod = new Map(getModules().map((m) => [m.slug, m.titre]));
  const parId = new Map(getTousLesCours().map((c) => [c.id, c]));
  const e: { t: string; titre: string; texte?: string; url: string; ctx?: string }[] = [];
  for (const c of getTousLesCours()) {
    const url = `/cours/${c.path}/`;
    const ctx = `${mod.get(c.module) ?? c.module} › ${c.titre}`;
    e.push({ t: "cours", titre: c.titre, texte: c.resume, url, ctx: mod.get(c.module) });
    for (const q of c.qcm) e.push({ t: "qcm", titre: q.enonce, texte: q.options.join(" · "), url: url + "#qcm", ctx });
    for (const f of c.flashcards) e.push({ t: "carte", titre: f.recto, texte: f.verso, url: url + "#flashcards", ctx });
    if (c.fiche) for (const s of c.fiche.sections ?? []) e.push({ t: "fiche", titre: s.titre, texte: (s.points ?? []).join(" "), url: url + "#fiche", ctx });
  }
  for (const t of getGlossaire()) {
    const c = t.cours ? parId.get(t.cours) : undefined;
    e.push({ t: "terme", titre: t.terme, texte: t.definition, url: `/glossaire/#${encodeURIComponent(t.terme)}`, ctx: c ? c.titre : "Glossaire" });
  }
  return new Response(JSON.stringify(e), { headers: { "Content-Type": "application/json" } });
};
