import { useEffect, useMemo, useState } from "react";
import type { IndexDonnees, Qcm } from "../lib/types";
import { chargerQuestions, trouverCours } from "../lib/donnees";
import { estErreur, useProgression, type RefQuestion } from "../lib/store";
import { sessionDepuisRefs } from "../lib/session";
import { dateCourte, nombre } from "../lib/format";
import { mdEnLigne } from "../lib/markdown";
import QuestionQcm from "./qcm/QuestionQcm";
import Chargement, { Vide } from "./Chargement";
import Icone from "./Icone";

export default function CarnetErreurs({ index }: { index: IndexDonnees }) {
  const p = useProgression();
  const [questions, setQuestions] = useState<Map<string, Qcm> | null>(null);

  const erreurs = useMemo(
    () =>
      Object.entries(p.questions)
        .filter(([, s]) => estErreur(s))
        .map(([id, s]) => {
          const t = trouverCours(index, s.c);
          return { id, s, src: t ? t.cours.path : "annale:hors-cours", titre: t?.cours.titre ?? "Hors cours actuel", module: t?.module.titre ?? "Annales" };
        })
        .sort((a, b) => b.s.at - a.s.at),
    [p.questions, index],
  );
  const cle = erreurs.map((e) => e.id).join("|");

  useEffect(() => {
    if (!erreurs.length) return setQuestions(new Map());
    chargerQuestions(erreurs.map((e) => ({ id: e.id, src: e.src })))
      .then(setQuestions)
      .catch(() => setQuestions(new Map()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  const groupes = useMemo(() => {
    const g = new Map<string, typeof erreurs>();
    for (const e of erreurs) {
      const k = `${e.module} › ${e.titre}`;
      g.set(k, [...(g.get(k) ?? []), e]);
    }
    return [...g.entries()];
  }, [erreurs]);

  const refaire = (titre: string, refs: RefQuestion[]) => {
    sessionDepuisRefs(titre, refs);
    window.location.href = "/qcm/";
  };

  if (!erreurs.length)
    return (
      <Vide titre="Aucune erreur à retravailler" texte="Les questions que vous ratez (même partiellement) apparaîtront ici. Elles disparaissent dès que vous y répondez parfaitement.">
        <a href="/entrainement/" className="btn btn-primaire">
          S'entraîner
        </a>
      </Vide>
    );
  if (!questions) return <Chargement texte="Chargement de vos erreurs…" />;

  const dispo = (refs: typeof erreurs) => refs.filter((e) => questions.has(e.id));

  return (
    <div className="flex flex-col gap-5">
      <div className="carte flex flex-wrap items-center gap-3 p-4">
        <p className="flex-1">
          <b className="tnum font-heading text-2xl text-primary-ink">{erreurs.length}</b> question(s) à retravailler
        </p>
        <button className="btn btn-primaire" onClick={() => refaire("Carnet d'erreurs", dispo(erreurs).map((e) => ({ id: e.id, src: e.src })))}>
          <Icone nom="rafraichir" taille={18} /> Tout refaire
        </button>
      </div>
      {groupes.map(([nom, liste]) => (
        <section key={nom} aria-label={nom} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base">{nom}</h2>
            <button className="btn btn-secondaire btn-petit" onClick={() => refaire(`Erreurs — ${liste[0].titre}`, dispo(liste).map((e) => ({ id: e.id, src: e.src })))}>
              Refaire ({liste.length})
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {liste.map((e) => {
              const q = questions.get(e.id);
              return (
                <li key={e.id}>
                  <details className="carte group overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                      <span className="line-clamp-2 flex-1 text-sm" dangerouslySetInnerHTML={{ __html: mdEnLigne(q?.enonce ?? "Question retirée du contenu") }} />
                      <span className="shrink-0 text-xs text-ink-muted">
                        {nombre(e.s.derniere, 2)}/1 · {dateCourte(e.s.at)}
                      </span>
                      <Icone nom="chevron" taille={18} className="shrink-0 text-ink-muted transition-transform group-open:rotate-90" />
                    </summary>
                    {q && (
                      <div className="border-t border-line p-4">
                        <QuestionQcm q={q} cochees={[]} corrige note={e.s.derniere} titreCours={e.titre} />
                      </div>
                    )}
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
