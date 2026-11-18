import { useState } from "react";
import type { IndexDonnees } from "../lib/types";
import { useProgression } from "../lib/store";
import { creerSession } from "../lib/session";
import { dateCourte, nombre } from "../lib/format";
import { varModule } from "../lib/maitrise";
import Erlenmeyer from "./Erlenmeyer";

const NB = 30;
const DUREE = 60 * 60;

export default function ExamensBlancs({ index }: { index: IndexDonnees }) {
  const p = useProgression();
  const [charge, setCharge] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const historique = p.resultats.filter((r) => r.mode === "examen-module");

  const lancer = async (slug: string, titre: string) => {
    setCharge(slug);
    setErreur(null);
    const m = index.modules.find((x) => x.slug === slug)!;
    const r = await creerSession({
      mode: "examen-module",
      cours: m.cours.filter((c) => c.comptes.qcm > 0).map((c) => c.path),
      nb: NB,
      titre: `EMD blanc — ${titre}`,
      dureeSec: DUREE,
      retour: "/examens-blancs/",
    });
    if ("erreur" in r) {
      setErreur(r.erreur);
      setCharge(null);
    } else window.location.href = "/qcm/";
  };

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {index.modules.map((m) => {
          const meilleurs = historique.filter((r) => r.titre.endsWith(m.titre));
          const meilleur = meilleurs.reduce((b, r) => Math.max(b, r.note20), 0);
          return (
            <li key={m.slug} className="carte carte-module flex flex-col gap-3 p-4" style={varModule(m.couleur)}>
              <div className="flex items-center gap-3">
                <Erlenmeyer ratio={meilleur / 20} taille={40} />
                <div className="min-w-0">
                  <h2 className="text-base">{m.titre}</h2>
                  <p className="text-xs text-ink-muted">
                    {m.totalQcm ? `${Math.min(NB, m.totalQcm)} questions · 60 min · ${nombre(m.totalQcm, 0)} dans la banque` : "Bientôt disponible"}
                  </p>
                </div>
              </div>
              {meilleurs.length > 0 && (
                <p className="text-sm">
                  Meilleure note : <b className="mod-ink">{nombre(meilleur, 2)}/20</b> · {meilleurs.length} tentative(s)
                </p>
              )}
              <button className="btn btn-primaire mt-auto" disabled={!m.totalQcm || charge !== null} onClick={() => lancer(m.slug, m.titre)}>
                {charge === m.slug ? "Préparation…" : "Commencer l'examen"}
              </button>
            </li>
          );
        })}
      </ul>
      {erreur && (
        <p className="font-semibold text-danger-ink" role="alert">
          {erreur}
        </p>
      )}
      <section aria-labelledby="titre-historique">
        <h2 id="titre-historique" className="mb-3 text-xl">
          Historique
        </h2>
        {historique.length === 0 ? (
          <p className="text-ink-muted">Aucun examen blanc passé pour l'instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historique.map((r) => (
              <li key={r.id}>
                <a href={`/resultats/?id=${r.id}`} className="carte flex items-center justify-between gap-3 p-3 text-ink no-underline hover:shadow-md">
                  <span>
                    <span className="block font-semibold">{r.titre}</span>
                    <span className="text-xs text-ink-muted">{dateCourte(r.date)}</span>
                  </span>
                  <b className="tnum font-heading text-lg text-primary-ink">{nombre(r.note20, 2)}/20</b>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
