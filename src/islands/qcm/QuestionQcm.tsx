import { useEffect, useRef } from "react";
import type { Qcm } from "../../lib/types";
import { lettre, nombre } from "../../lib/format";
import { mdEnLigne } from "../../lib/markdown";
import { lienSignalement } from "../../lib/signaler";
import { eclatGelules } from "../../lib/effets";
import Icone from "../Icone";

interface Props {
  q: Qcm;
  cochees: number[];
  onBasculer?: (i: number) => void;
  /** affiche la correction */
  corrige?: boolean;
  note?: number;
  numero?: number;
  total?: number;
  titreCours?: string;
  /** fil d'Ariane au-dessus de la question (module › cours) */
  fil?: string;
  /** masque le lien « Signaler » */
  sansSignaler?: boolean;
  /** joue les animations de correction (pop / secousse / éclat) */
  anime?: boolean;
}

const DIFFICULTE = ["", "Facile", "Moyen", "Difficile"];

export function BadgesQuestion({ q }: { q: Qcm }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="badge-type">
        <Icone nom={q.type === "unique" ? "verifie" : "qcm"} taille={14} />
        {q.type === "unique" ? "Une seule réponse" : "Plusieurs réponses"}
      </span>
      {q.origine === "annale" && <span className="pastille pastille-annale">{q.annale?.toLowerCase().startsWith("annale") ? q.annale : `Annale ${q.annale ?? ""}`}</span>}
      {q.difficulte ? <span className="pastille">{DIFFICULTE[q.difficulte]}</span> : null}
      {q.origine === "annale" && q.verifie === false && (
        <span className="pastille" title="La réponse n'a pas pu être vérifiée sur le cours">
          Réponse non vérifiée
        </span>
      )}
    </div>
  );
}

export function couleurNote(note: number) {
  return note >= 1 ? "var(--pr-success-ink)" : note > 0 ? "var(--pr-warning-ink)" : "var(--pr-danger-ink)";
}

function formuleNote(q: Qcm, cochees: number[], note: number) {
  if (q.type === "unique") return note >= 1 ? "Bonne réponse" : cochees.length ? "Réponse unique : 1 ou 0" : "Sans réponse";
  const bonnes = cochees.filter((c) => q.correctes.includes(c)).length;
  const fausses = cochees.length - bonnes;
  const s = (n: number) => (n > 1 ? "s" : "");
  return `(${bonnes} cochée${s(bonnes)} juste${s(bonnes)} − ${fausses} cochée${s(fausses)} fausse${s(fausses)}) ÷ ${q.correctes.length} réponse${s(q.correctes.length)} juste${s(q.correctes.length)}${bonnes - fausses < 0 ? ", ramené à 0" : ""}`;
}

export default function QuestionQcm({ q, cochees, onBasculer, corrige = false, note, numero, total, titreCours, fil, sansSignaler, anime = false }: Props) {
  const nomGroupe = `q-${q.id}`;
  const correctes = new Set(q.correctes);
  const noteRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (anime && corrige && note === 1) eclatGelules(noteRef.current, 10);
  }, [anime, corrige, note]);

  return (
    <article className="flex flex-col gap-4" aria-labelledby={`${nomGroupe}-enonce`}>
      <div className="flex flex-col gap-2">
        {fil && <p className="text-xs text-ink-muted">{fil}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {numero !== undefined && total !== undefined && (
            <b className="tnum text-sm">
              Question {numero} / {total}
            </b>
          )}
          <BadgesQuestion q={q} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend id={`${nomGroupe}-enonce`} className="mb-1 font-heading text-lg font-bold leading-snug sm:text-xl">
          {numero !== undefined ? `${numero}. ` : ""}
          <span dangerouslySetInnerHTML={{ __html: mdEnLigne(q.enonce) }} />
        </legend>
        <p className="-mt-1 text-sm italic text-ink-muted">
          {q.type === "unique" ? "Cochez la proposition correcte" : "Cochez la ou les proposition(s) correcte(s)"}
        </p>
        <ul className="flex flex-col gap-2.5">
          {q.options.map((opt, i) => {
            const coche = cochees.includes(i);
            const juste = correctes.has(i);
            let etat = "";
            if (corrige) etat = juste && coche ? "juste" : juste ? "manquee" : coche ? "fausse" : "neutre";
            const etiquette = etat === "juste" ? "✓ Juste" : etat === "manquee" ? "Réponse attendue" : etat === "fausse" ? "✗ Fausse" : "";
            return (
              <li key={i}>
                <label
                  className={["opt", q.type === "unique" ? "radio" : "", corrige ? "corrigee" : "", etat].join(" ")}
                  data-coche={!corrige && coche ? "true" : undefined}
                  style={corrige && !anime ? { animation: "none" } : undefined}
                >
                  <input
                    type={q.type === "unique" ? "radio" : "checkbox"}
                    name={nomGroupe}
                    className="sr-only"
                    checked={coche}
                    disabled={corrige || !onBasculer}
                    onChange={() => onBasculer?.(i)}
                  />
                  <span className="touche" aria-hidden="true">
                    {lettre(i).toLowerCase()}
                  </span>
                  <span className="flex-1 pt-0.5" dangerouslySetInnerHTML={{ __html: mdEnLigne(opt) }} />
                  {etiquette && (
                    <span className="etiquette">
                      {etiquette}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {corrige && (
        <div className={"flex flex-col gap-3 " + (anime ? "retour-question" : "")} role="status">
          <div className="flex flex-wrap items-center gap-3">
            <span ref={noteRef} className={"note-question " + ((note ?? 0) >= 1 ? "pleine" : (note ?? 0) <= 0 ? "nulle" : "")}>
              {nombre(note ?? 0, 2)} / 1
            </span>
            <span className="text-xs text-ink-muted">{formuleNote(q, cochees, note ?? 0)}</span>
          </div>
          <div className="carte p-4">
            <h3 className="flex items-center gap-1.5 font-heading text-base font-bold">
              <Icone nom="ampoule" taille={18} /> Explication
            </h3>
            <p className="texte-riche mt-1.5" dangerouslySetInnerHTML={{ __html: mdEnLigne(q.explication) }} />
            <p className="mt-1 text-sm text-ink-muted">
              Bonne(s) réponse(s) : <strong className="text-ink">{q.correctes.map((c) => lettre(c).toLowerCase()).join(", ")}</strong>
            </p>
            <div className="source mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 text-sm">
              <span className="font-semibold text-primary-ink">
                <span aria-hidden="true">📄 </span>
                <span className="sr-only">Source : </span>
                {titreCours ?? "Cours"}
                {q.source?.page ? `, p. ${q.source.page}` : ""}
              </span>
              {!sansSignaler && (
                <a
                  href={lienSignalement({ id: q.id, enonce: q.enonce, cours: titreCours ?? q.cours, type: "QCM" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ink-muted hover:text-danger-ink hover:underline"
                >
                  ⚑ Signaler<span className="sr-only"> une erreur (ouvre GitHub dans un nouvel onglet)</span>
                </a>
              )}
            </div>
            {q.source?.extrait && <p className="mt-2 text-sm italic text-ink-muted">« {q.source.extrait} »</p>}
          </div>
        </div>
      )}
    </article>
  );
}
