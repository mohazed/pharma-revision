import { useEffect, useMemo, useState } from "react";
import type { IndexDonnees } from "../lib/types";
import { creerSession, SECONDES_PAR_QUESTION } from "../lib/session";
import { estErreur, useProgression, type ModeSession } from "../lib/store";
import { duree, pluriel } from "../lib/format";
import Icone from "./Icone";
import type { NomIcone } from "../lib/icones";

type Portee = "tout" | "module" | "cours";

const MODES: { id: ModeSession; titre: string; texte: string; icone: NomIcone }[] = [
  { id: "entrainement", titre: "Entraînement", texte: "Correction et explication après chaque question.", icone: "reviser" },
  { id: "examen", titre: "Examen blanc", texte: "Chronométré (2 min par question), correction à la fin.", icone: "chrono" },
  { id: "erreurs", titre: "Mes erreurs", texte: "Uniquement les questions déjà ratées.", icone: "erreurs" },
  { id: "express", titre: "Révision express", texte: "10 questions au hasard, tout de suite.", icone: "flamme" },
];

export default function ConfigSession({ index }: { index: IndexDonnees }) {
  const prog = useProgression();
  const [mode, setMode] = useState<ModeSession>("entrainement");
  const [portee, setPortee] = useState<Portee>("tout");
  const [module, setModule] = useState(index.modules.find((m) => m.cours.length)?.slug ?? "");
  const [cours, setCours] = useState<string[]>([]);
  const [nb, setNb] = useState(20);
  const [diff, setDiff] = useState<number[]>([1, 2, 3]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const c = p.get("cours");
    const m = p.get("module");
    const md = p.get("mode") as ModeSession | null;
    if (c) {
      setPortee("cours");
      setCours(c.split(","));
    } else if (m) {
      setPortee("module");
      setModule(m);
    }
    if (md && MODES.some((x) => x.id === md)) setMode(md);
  }, []);

  const tousLesCours = useMemo(() => index.modules.flatMap((m) => m.cours.map((c) => ({ ...c, moduleTitre: m.titre }))), [index]);
  const chemins = useMemo(() => {
    if (portee === "tout") return tousLesCours.filter((c) => c.comptes.qcm > 0).map((c) => c.path);
    if (portee === "module") return tousLesCours.filter((c) => c.module === module && c.comptes.qcm > 0).map((c) => c.path);
    return cours;
  }, [portee, module, cours, tousLesCours]);

  const disponibles = useMemo(() => {
    const sel = tousLesCours.filter((c) => chemins.includes(c.path));
    if (mode === "erreurs") {
      const ids = new Set(sel.map((c) => c.id));
      return Object.values(prog.questions).filter((s) => estErreur(s) && s.c && ids.has(s.c)).length;
    }
    return sel.reduce((t, c) => t + c.comptes.qcm, 0);
  }, [chemins, mode, prog.questions, tousLesCours]);

  const nbFinal = mode === "express" ? Math.min(10, disponibles) : nb === 0 ? disponibles : Math.min(nb, disponibles);

  const titre = useMemo(() => {
    if (portee === "tout") return "Tout le programme";
    if (portee === "module") return index.modules.find((m) => m.slug === module)?.titre ?? module;
    if (cours.length === 1) return tousLesCours.find((c) => c.path === cours[0])?.titre ?? "1 cours";
    return pluriel(cours.length, "cours", "cours");
  }, [portee, module, cours, index, tousLesCours]);

  async function lancer() {
    setErreur(null);
    if (chemins.length === 0) return setErreur("Choisissez au moins un cours.");
    setEnCours(true);
    try {
      const r = await creerSession({ mode, cours: chemins, nb: mode === "express" ? 10 : nb, difficultes: diff, titre });
      if ("erreur" in r) {
        setErreur(r.erreur);
        setEnCours(false);
      } else window.location.href = "/qcm/";
    } catch {
      setErreur("Impossible de charger les questions. Vérifiez votre connexion.");
      setEnCours(false);
    }
  }

  const basculerCours = (p: string) => setCours((cs) => (cs.includes(p) ? cs.filter((x) => x !== p) : [...cs, p]));

  if (index.totalQcm === 0)
    return (
      <div className="carte p-6 text-center">
        <p className="font-semibold">Les questions sont en cours de préparation.</p>
        <p className="text-ink-muted">Revenez bientôt : les cours sont ajoutés au fur et à mesure.</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 font-heading text-lg font-bold">1. Mode</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <label
              key={m.id}
              className={"carte flex cursor-pointer items-start gap-3 border-2 p-4 transition-colors " + (mode === m.id ? "!border-primary bg-primary/5" : "hover:border-primary/50")}
            >
              <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="sr-only" />
              <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full " + (mode === m.id ? "bg-primary text-on-primary" : "bg-surface-2 text-ink-muted")}>
                <Icone nom={m.icone} />
              </span>
              <span>
                <span className="block font-bold">{m.titre}</span>
                <span className="block text-sm text-ink-muted">{m.texte}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-heading text-lg font-bold">2. Questions sur…</legend>
        <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Portée">
          {(
            [
              ["tout", "Tout le programme"],
              ["module", "Un module"],
              ["cours", "Des cours précis"],
            ] as [Portee, string][]
          ).map(([v, l]) => (
            <label key={v} className={"btn btn-petit cursor-pointer " + (portee === v ? "btn-primaire" : "btn-secondaire")}>
              <input type="radio" name="portee" className="sr-only" checked={portee === v} onChange={() => setPortee(v)} />
              {l}
            </label>
          ))}
        </div>
        {portee === "module" && (
          <label className="block max-w-sm">
            <span className="mb-1 block text-sm font-semibold">Module</span>
            <select className="champ" value={module} onChange={(e) => setModule(e.target.value)}>
              {index.modules
                .filter((m) => m.totalQcm > 0)
                .map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.titre} ({m.totalQcm} QCM)
                  </option>
                ))}
            </select>
          </label>
        )}
        {portee === "cours" && (
          <div className="flex flex-col gap-2">
            {index.modules
              .filter((m) => m.totalQcm > 0)
              .map((m) => {
                const sel = m.cours.filter((c) => cours.includes(c.path)).length;
                return (
                  <details key={m.slug} className="carte" open={sel > 0 || m.slug === module}>
                    <summary className="flex cursor-pointer items-center justify-between gap-2 p-3 font-semibold">
                      <span>{m.titre}</span>
                      <span className="text-sm font-normal text-ink-muted">{sel > 0 ? `${sel} sélectionné(s)` : ""}</span>
                    </summary>
                    <ul className="flex flex-col gap-1 border-t border-line p-2">
                      {m.cours
                        .filter((c) => c.comptes.qcm > 0)
                        .map((c) => (
                          <li key={c.path}>
                            <label className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 hover:bg-surface-2">
                              <input type="checkbox" className="h-5 w-5 accent-[var(--pr-primary)]" checked={cours.includes(c.path)} onChange={() => basculerCours(c.path)} />
                              <span className="flex-1">
                                {c.type === "td" ? "TD — " : ""}
                                {c.titre}
                              </span>
                              <span className="text-sm text-ink-muted">{c.comptes.qcm}</span>
                            </label>
                          </li>
                        ))}
                    </ul>
                  </details>
                );
              })}
          </div>
        )}
      </fieldset>

      {mode !== "express" && (
        <fieldset>
          <legend className="mb-3 font-heading text-lg font-bold">3. Nombre de questions</legend>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 40, 0].map((n) => (
              <label key={n} className={"btn btn-petit min-w-16 cursor-pointer " + (nb === n ? "btn-primaire" : "btn-secondaire")}>
                <input type="radio" name="nb" className="sr-only" checked={nb === n} onChange={() => setNb(n)} />
                {n === 0 ? "Toutes" : n}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 font-heading text-lg font-bold">{mode === "express" ? "3" : "4"}. Difficulté</legend>
        <div className="flex flex-wrap gap-2">
          {[
            [1, "Facile"],
            [2, "Moyen"],
            [3, "Difficile"],
          ].map(([d, l]) => (
            <label key={d} className={"btn btn-petit cursor-pointer " + (diff.includes(d as number) ? "btn-primaire" : "btn-secondaire")}>
              <input
                type="checkbox"
                className="sr-only"
                checked={diff.includes(d as number)}
                onChange={() => setDiff((x) => (x.includes(d as number) ? (x.length > 1 ? x.filter((y) => y !== d) : x) : [...x, d as number]))}
              />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="carte sticky bottom-20 flex flex-col gap-3 p-4 shadow-lg sm:flex-row sm:items-center lg:bottom-4">
        <div className="flex-1 text-sm">
          <p className="font-semibold">
            {titre} · {pluriel(disponibles, "question disponible", "questions disponibles")}
          </p>
          <p className="text-ink-muted">
            {disponibles > 0 ? `Session de ${pluriel(nbFinal, "question")}` : "Aucune question"}
            {mode === "examen" && nbFinal > 0 ? ` · durée ${duree(nbFinal * SECONDES_PAR_QUESTION)}` : ""}
          </p>
          {erreur && (
            <p className="mt-1 font-semibold text-danger" role="alert">
              {erreur}
            </p>
          )}
        </div>
        <button className="btn btn-primaire" onClick={lancer} disabled={enCours || disponibles === 0}>
          {enCours ? "Préparation…" : "Commencer"} <Icone nom="fleche" taille={18} />
        </button>
      </div>
    </div>
  );
}
