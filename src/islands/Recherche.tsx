import { useEffect, useMemo, useRef, useState } from "react";
import { chargerRecherche, type EntreeRecherche } from "../lib/donnees";
import Chargement from "./Chargement";

const normaliser = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const TYPES: Record<EntreeRecherche["t"], string> = { cours: "Cours", qcm: "QCM", carte: "Flashcard", terme: "Glossaire", fiche: "Fiche" };

export default function Recherche() {
  const [entrees, setEntrees] = useState<(EntreeRecherche & { n: string })[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | EntreeRecherche["t"]>("");
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(location.search).get("q");
    if (p) setQ(p);
    champ.current?.focus();
    chargerRecherche()
      .then((e) => setEntrees(e.map((x) => ({ ...x, n: normaliser(`${x.titre} ${x.texte ?? ""}`) }))))
      .catch(() => setEntrees([]));
  }, []);

  const resultats = useMemo(() => {
    if (!entrees) return [];
    const mots = normaliser(q.trim()).split(/\s+/).filter((m) => m.length > 1);
    if (!mots.length) return [];
    return entrees
      .filter((e) => (!type || e.t === type) && mots.every((m) => e.n.includes(m)))
      .map((e) => ({ e, score: (normaliser(e.titre).includes(mots[0]) ? 2 : 0) + (e.t === "cours" || e.t === "terme" ? 1 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map((x) => x.e);
  }, [entrees, q, type]);

  return (
    <div className="flex flex-col gap-4">
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="champ-recherche" className="sr-only">
          Rechercher
        </label>
        <input
          id="champ-recherche"
          ref={champ}
          type="search"
          className="champ text-lg"
          placeholder="Ex. : biodisponibilité, lyophilisation, céphalée…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par type">
        {(["", "cours", "qcm", "carte", "fiche", "terme"] as const).map((t) => (
          <button key={t} className={"btn btn-petit " + (type === t ? "btn-primaire" : "btn-secondaire")} aria-pressed={type === t} onClick={() => setType(t)}>
            {t ? TYPES[t] : "Tout"}
          </button>
        ))}
      </div>
      {!entrees ? (
        <Chargement texte="Chargement de l'index…" />
      ) : q.trim().length < 2 ? (
        <p className="text-ink-muted">Tapez au moins deux lettres pour chercher dans les cours, les QCM, les flashcards, les fiches et le glossaire.</p>
      ) : (
        <>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {resultats.length === 60 ? "60 premiers résultats" : `${resultats.length} résultat(s)`}
          </p>
          <ul className="flex flex-col gap-2">
            {resultats.map((r, i) => (
              <li key={i}>
                <a href={r.url} className="carte flex flex-col gap-1 p-3 text-ink no-underline hover:shadow-md">
                  <span className="flex items-center gap-2">
                    <span className="pastille pastille-primaire">{TYPES[r.t]}</span>
                    {r.ctx && <span className="truncate text-xs text-ink-muted">{r.ctx}</span>}
                  </span>
                  <span className="font-semibold">{r.titre}</span>
                  {r.texte && <span className="line-clamp-2 text-sm text-ink-muted">{r.texte}</span>}
                </a>
              </li>
            ))}
          </ul>
          {resultats.length === 0 && <p>Aucun résultat. Essayez un autre mot.</p>}
        </>
      )}
    </div>
  );
}
