import { useState } from "react";
import type { IndexDonnees } from "../lib/types";
import { useProgression } from "../lib/store";
import { sessionAnnale } from "../lib/session";
import { dateCourte, nombre } from "../lib/format";

export default function Annales({ annales }: { annales: IndexDonnees["annales"] }) {
  const p = useProgression();
  const [erreur, setErreur] = useState<string | null>(null);
  const horsCours = annales.reduce((t, a) => t + a.nbHorsCours, 0);

  const lancer = async (id: string) => {
    setErreur(null);
    const r = await sessionAnnale(id);
    if ("erreur" in r) setErreur(r.erreur);
    else window.location.href = "/qcm/";
  };

  if (annales.length === 0)
    return (
      <div className="carte p-6 text-center">
        <p className="font-semibold">Les annales sont en cours de transcription.</p>
        <p className="text-ink-muted">Elles apparaîtront ici dès qu'elles seront prêtes.</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 sm:grid-cols-2">
        {annales.map((a) => {
          const essais = p.resultats.filter((r) => r.mode === "annale" && r.titre.startsWith(a.titre));
          return (
            <li key={a.id} className="carte flex flex-col gap-2 p-4">
              <h2 className="text-lg">{a.titre}</h2>
              <p className="text-sm text-ink-muted">
                {a.date ? dateCourte(a.date) + " · " : ""}
                {a.nbQuestions} questions · {a.duree ?? Math.round(a.nbQuestions * 2)} min
              </p>
              {essais.length > 0 && (
                <p className="text-sm">
                  Dernière note : <b className="text-primary-ink">{nombre(essais[0].note20, 2)}/20</b>
                </p>
              )}
              <button className="btn btn-primaire mt-auto self-start" onClick={() => lancer(a.id)}>
                Passer l'épreuve chronométrée
              </button>
            </li>
          );
        })}
      </ul>
      {horsCours > 0 && (
        <section className="carte flex flex-col gap-2 p-4" aria-labelledby="titre-hors-cours">
          <h2 id="titre-hors-cours" className="text-lg">
            Hors cours actuel
          </h2>
          <p className="text-sm text-ink-muted">
            {horsCours} question(s) d'annales portent sur des chapitres qui ne sont pas encore dans les cours disponibles. Elles seront rattachées à leur cours dès qu'il sera ajouté.
          </p>
          <button className="btn btn-secondaire self-start" onClick={() => lancer("hors-cours")}>
            S'entraîner sur ces questions
          </button>
        </section>
      )}
      {erreur && (
        <p className="font-semibold text-danger-ink" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
