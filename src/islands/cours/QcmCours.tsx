import { useMemo } from "react";
import type { CoursResume } from "../../lib/types";
import { estErreur, useProgression } from "../../lib/store";
import { creerSession } from "../../lib/session";
import { maitriseCours, maitriseParCours } from "../../lib/maitrise";
import Icone from "../Icone";

export default function QcmCours({ cours }: { cours: CoursResume }) {
  const p = useProgression();
  const stats = useMemo(() => {
    const qs = Object.values(p.questions).filter((s) => s.c === cours.id);
    return { vues: qs.length, erreurs: qs.filter(estErreur).length, maitrise: maitriseCours(cours, maitriseParCours(p)) };
  }, [p, cours]);

  const lancer = async (mode: "express" | "erreurs") => {
    const r = await creerSession({ mode, cours: [cours.path], nb: 10, titre: cours.titre, retour: `/cours/${cours.path}/` });
    if ("erreur" in r) alert(r.erreur);
    else window.location.href = "/qcm/";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          [cours.comptes.qcm, "questions"],
          [stats.vues, "déjà faites"],
          [`${Math.round(stats.maitrise * 100)} %`, "maîtrise"],
        ].map(([v, l]) => (
          <div key={String(l)} className="carte flex flex-col items-center p-3 text-center">
            <b className="tnum font-heading text-2xl text-primary-ink">{v}</b>
            <span className="text-xs text-ink-muted">{l}</span>
          </div>
        ))}
      </div>
      <div className="gelule" role="progressbar" aria-label="Maîtrise du cours" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stats.maitrise * 100)}>
        <span style={{ width: `${stats.maitrise * 100}%` }} />
      </div>
      {cours.comptes.annales > 0 && (
        <p className="text-sm">
          <span className="pastille pastille-annale">Annales</span> {cours.comptes.annales} question(s) d'EMD sont intégrées à ce cours.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <a href={`/entrainement/?cours=${encodeURIComponent(cours.path)}`} className="btn btn-primaire">
          <Icone nom="lecture" taille={16} /> Configurer une session
        </a>
        <button className="btn btn-secondaire" onClick={() => lancer("express")}>
          Révision express (10)
        </button>
        {stats.erreurs > 0 && (
          <button className="btn btn-secondaire" onClick={() => lancer("erreurs")}>
            Refaire mes erreurs ({stats.erreurs})
          </button>
        )}
      </div>
    </div>
  );
}
