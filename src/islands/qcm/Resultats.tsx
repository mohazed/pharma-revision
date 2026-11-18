import { useEffect, useMemo, useState } from "react";
import type { IndexDonnees, Qcm } from "../../lib/types";
import { chargerIndex, chargerQuestions, trouverCours } from "../../lib/donnees";
import { dateLongue, duree, nombre } from "../../lib/format";
import { getProgression, type Resultat } from "../../lib/store";
import { LIBELLES_MODE, sessionDepuisRefs } from "../../lib/session";
import { arrondi, surVingt } from "../../lib/scoring";
import { mdEnLigne } from "../../lib/markdown";
import QuestionQcm, { couleurNote } from "./QuestionQcm";
import Mouvement from "../Mouvement";
import { pluieConfettis } from "../../lib/effets";
import Chargement, { Vide } from "../Chargement";
import Icone from "../Icone";

export default function Resultats() {
  return (
    <Mouvement>
      <Contenu />
    </Mouvement>
  );
}

export function AnneauNote({ note20, taille = 160 }: { note20: number; taille?: number }) {
  const circ = 326.7;
  const ratio = Math.max(0, Math.min(1, note20 / 20));
  const [affiche, setAffiche] = useState(0);
  const [decal, setDecal] = useState(circ);
  useEffect(() => {
    const reduit = document.documentElement.dataset.motion === "reduced";
    const raf = requestAnimationFrame(() => setDecal(circ * (1 - ratio)));
    if (reduit) {
      setAffiche(note20);
      return () => cancelAnimationFrame(raf);
    }
    const dur = 0.42 * 3500;
    const t0 = performance.now();
    let id = 0;
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setAffiche(Math.round(note20 * e * 2) / 2);
      if (k < 1) id = requestAnimationFrame(pas);
      else setAffiche(note20);
    };
    id = requestAnimationFrame(pas);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(id);
    };
  }, [note20, ratio]);
  return (
    <div className="relative" style={{ width: taille, height: taille }} role="img" aria-label={`Note : ${nombre(note20, 2)} sur 20`}>
      <svg viewBox="0 0 120 120" width={taille} height={taille} aria-hidden="true" className="-rotate-90">
        <defs>
          <linearGradient id="degrade-anneau" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--pr-primary)" }} />
            <stop offset="1" style={{ stopColor: "var(--pr-primary-2)" }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" style={{ stroke: "var(--pr-border)" }} strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="url(#degrade-anneau)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={decal}
          style={{ transition: "stroke-dashoffset calc(var(--pr-dur) * 3.5) var(--pr-ease)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <b className="tnum font-heading text-4xl font-extrabold leading-none">{nombre(affiche, 2)}</b>
        <span className="text-xs text-ink-muted">sur 20</span>
      </div>
    </div>
  );
}

export const mention = (n: number) => (n >= 16 ? "Très bien, continue comme ça !" : n >= 14 ? "Bien" : n >= 10 ? "Assez bien, encore un effort" : "Encore un effort");

function Contenu() {
  const [res, setRes] = useState<Resultat | null | undefined>(undefined);
  const [questions, setQuestions] = useState<Map<string, Qcm> | null>(null);
  const [index, setIndex] = useState<IndexDonnees | null>(null);
  const [filtre, setFiltre] = useState<"toutes" | "ratees">("toutes");

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    const p = getProgression();
    const r = (id ? p.resultats.find((x) => x.id === id) : p.resultats[0]) ?? null;
    setRes(r);
    if (r) {
      chargerQuestions(r.details.map((d) => ({ id: d.id, src: d.src })))
        .then(setQuestions)
        .catch(() => setQuestions(new Map()));
      chargerIndex().then(setIndex).catch(() => {});
    }
  }, []);

  const parCours = useMemo(() => {
    if (!res) return [];
    const m = new Map<string, { points: number; nb: number }>();
    for (const d of res.details) {
      const k = d.cours ?? "__hors";
      const v = m.get(k) ?? { points: 0, nb: 0 };
      v.points += d.note;
      v.nb += 1;
      m.set(k, v);
    }
    return [...m.entries()]
      .map(([k, v]) => {
        const t = index && k !== "__hors" ? trouverCours(index, k) : undefined;
        return { cle: k, titre: k === "__hors" ? "Hors cours actuel" : t?.cours.titre ?? k, module: t?.module.titre, path: t?.cours.path, ...v };
      })
      .sort((a, b) => a.points / a.nb - b.points / b.nb);
  }, [res, index]);

  useEffect(() => {
    if (res && res.note20 >= 16) pluieConfettis(45);
  }, [res]);

  if (res === undefined) return <Chargement />;
  if (res === null)
    return (
      <Vide titre="Résultat introuvable" texte="Ce résultat n'existe pas (ou plus) dans ce navigateur.">
        <a href="/entrainement/" className="btn btn-primaire">
          Nouvelle session
        </a>
      </Vide>
    );

  const ratees = res.details.filter((d) => d.note < 1);
  const parfaites = res.details.filter((d) => d.note >= 1).length;
  const nulles = res.details.filter((d) => d.note <= 0).length;
  const partielles = res.details.length - parfaites - nulles;
  const affichees = filtre === "ratees" ? ratees : res.details;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="surtitre">Session terminée</p>
        <h1 className="text-2xl sm:text-3xl">Résultats</h1>
        <p className="text-sm text-ink-muted">
          {res.titre} · {LIBELLES_MODE[res.mode]} · {res.nb} question{res.nb > 1 ? "s" : ""}
        </p>
      </div>
      <section className="carte flex flex-col items-center gap-3 p-6 text-center">
        <AnneauNote note20={res.note20} />
        <p className="font-heading text-lg font-bold text-primary-ink">{mention(res.note20)}</p>
        <div className="flex flex-wrap justify-center gap-1.5 text-xs">
          <span className="rounded-pill border border-line px-2.5 py-1 font-semibold text-success-ink">{parfaites} juste{parfaites > 1 ? "s" : ""}</span>
          <span className="rounded-pill border border-line px-2.5 py-1 font-semibold">{partielles} partielle{partielles > 1 ? "s" : ""}</span>
          <span className="rounded-pill border border-line px-2.5 py-1 font-semibold text-danger-ink">{nulles} fausse{nulles > 1 ? "s" : ""}</span>
        </div>
        <p className="text-sm text-ink-muted">
          {nombre(res.points, 2)} point(s) sur {res.nb} · durée {duree(res.dureeSec)} · {dateLongue(res.date)}
        </p>
        <div className="flex flex-col gap-2">
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {ratees.length > 0 && (
              <button
                className="btn btn-primaire"
                onClick={() => {
                  sessionDepuisRefs(`Refaire mes erreurs — ${res.titre}`, ratees.map((d) => ({ id: d.id, src: d.src })));
                  window.location.href = "/qcm/";
                }}
              >
                <Icone nom="rafraichir" taille={18} /> Refaire mes erreurs ({ratees.length})
              </button>
            )}
            <a href="/entrainement/" className="btn btn-secondaire">
              Nouvelle session
            </a>
            <a href="/" className="btn btn-fantome">
              Accueil
            </a>
          </div>
        </div>
      </section>

      {parCours.length > 0 && (
        <section aria-labelledby="titre-par-cours" className="carte flex flex-col gap-3 p-5">
          <h2 id="titre-par-cours" className="text-lg">
            Par cours
          </h2>
          {parCours.map((c) => (
            <div key={c.cle} className="flex flex-col gap-1">
              <div className="flex justify-between gap-3 text-sm">
                <span>
                  {c.path ? (
                    <a href={`/cours/${c.path}/`} className="hover:text-primary-ink hover:underline">
                      {c.titre}
                    </a>
                  ) : (
                    c.titre
                  )}
                  {c.module && <span className="ml-1 text-xs text-ink-muted">· {c.module}</span>}
                </span>
                <b className="tnum shrink-0">
                  {nombre(c.points, 2)} / {c.nb} <span className="font-normal text-ink-muted">({nombre(arrondi(surVingt(c.points, c.nb)), 1)}/20)</span>
                </b>
              </div>
              <div className="gelule" role="progressbar" aria-label={`${c.titre} : ${Math.round((c.points / c.nb) * 100)} %`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((c.points / c.nb) * 100)}>
                <span style={{ width: `${(c.points / c.nb) * 100}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="titre-detail">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="titre-detail" className="text-xl">
            Correction question par question
          </h2>
          <div className="flex gap-1 rounded-pill bg-surface-2 p-1" role="group" aria-label="Filtrer les questions">
            {(["toutes", "ratees"] as const).map((f) => (
              <button
                key={f}
                className={"rounded-pill px-3 py-1 text-sm font-semibold " + (filtre === f ? "bg-surface shadow-sm" : "text-ink-muted")}
                aria-pressed={filtre === f}
                onClick={() => setFiltre(f)}
              >
                {f === "toutes" ? `Toutes (${res.details.length})` : `À revoir (${ratees.length})`}
              </button>
            ))}
          </div>
        </div>
        {!questions ? (
          <Chargement texte="Chargement de la correction…" />
        ) : (
          <ol className="flex flex-col gap-2">
            {affichees.map((d) => {
              const q = questions.get(d.id);
              const n = res.details.indexOf(d) + 1;
              return (
                <li key={d.id}>
                  <details className="carte group overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">{n}</span>
                      <span className="line-clamp-2 flex-1 text-sm" dangerouslySetInnerHTML={{ __html: mdEnLigne(q?.enonce ?? "Question indisponible") }} />
                      <span className="shrink-0 font-heading font-extrabold" style={{ color: couleurNote(d.note) }}>
                        {nombre(d.note, 2)}
                      </span>
                      <Icone nom="chevron" taille={18} className="shrink-0 text-ink-muted transition-transform group-open:rotate-90" />
                    </summary>
                    {q && (
                      <div className="border-t border-line p-4">
                        <QuestionQcm q={q} cochees={d.cochees} corrige note={d.note} titreCours={index ? trouverCours(index, q.cours)?.cours.titre : undefined} />
                        {d.cochees.length === 0 && <p className="mt-2 text-sm font-semibold text-danger">Sans réponse.</p>}
                      </div>
                    )}
                  </details>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
