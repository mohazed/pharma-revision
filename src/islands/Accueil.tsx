import { useEffect, useMemo, useState } from "react";
import type { IndexDonnees } from "../lib/types";
import { estErreur, serie, useProgression } from "../lib/store";
import { jourLocal, nombre } from "../lib/format";
import { LIBELLES_MODE, creerSession } from "../lib/session";
import { maitriseModule, maitriseParCours, varModule } from "../lib/maitrise";
import Erlenmeyer from "./Erlenmeyer";
import Icone from "./Icone";

const FLAMME = (
  <svg className="flamme" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2c1 3.5 5 5.7 5 11a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.2 1.6 1 2.6 2 3.1-.6-3.4.2-6.4 1-9.5z" />
    <path fill="#ffd166" d="M12 13c.6 1.4 2.2 2.1 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1.2.8-2 1.4-2.4 0 .8.3 1.3.8 1.6z" />
  </svg>
);

export default function Accueil({ index }: { index: IndexDonnees }) {
  const p = useProgression();
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [monte, setMonte] = useState(false);
  useEffect(() => {
    setMonte(true);
    const t = setInterval(() => setMaintenant(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const sommes = useMemo(() => maitriseParCours(p), [p]);
  const nbSerie = serie(p.jours);

  const prochain = useMemo(
    () =>
      p.reglages.examens
        .map((e) => ({ ...e, t: new Date(e.date + (e.date.length <= 10 ? "T08:30" : "")).getTime() }))
        .filter((e) => e.t > maintenant)
        .sort((a, b) => a.t - b.t)[0],
    [p.reglages.examens, maintenant],
  );
  const reste = prochain ? prochain.t - maintenant : 0;
  const jours = Math.floor(reste / 864e5);
  const heures = Math.floor((reste % 864e5) / 36e5);
  const minutes = Math.floor((reste % 36e5) / 6e4);

  // Semaine en cours (lundi → dimanche)
  const semaine = useMemo(() => {
    const d = new Date(maintenant);
    const decal = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - decal);
    const set = new Set(p.jours);
    return ["L", "M", "M", "J", "V", "S", "D"].map((l, i) => {
      const j = new Date(d);
      j.setDate(d.getDate() + i);
      return { l, on: set.has(jourLocal(j)), nom: j.toLocaleDateString("fr-FR", { weekday: "long" }) };
    });
  }, [p.jours, maintenant]);

  const cartesDues = Object.values(p.cartes).filter((c) => c.due <= maintenant).length;
  const nouvellesCartes = Math.max(0, index.totalFlashcards - Object.keys(p.cartes).length);
  const erreurs = Object.values(p.questions).filter(estErreur).length;
  const nouveauxCours = index.modules.flatMap((m) => m.cours).filter((c) => c.nouveau).length;
  const avecCours = index.modules.filter((m) => m.cours.length > 0);
  const moyenne = avecCours.length ? avecCours.reduce((t, m) => t + maitriseModule(m.cours, sommes), 0) / avecCours.length : 0;

  const enCours = p.enCours;
  const dateTexte = new Date(maintenant).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  async function express() {
    const chemins = index.modules.flatMap((m) => m.cours).filter((c) => c.comptes.qcm > 0).map((c) => c.path);
    if (!chemins.length) return;
    const r = await creerSession({ mode: "express", cours: chemins, nb: 10, titre: "Tout le programme" });
    if (!("erreur" in r)) window.location.href = "/qcm/";
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="surtitre first-letter:uppercase">{monte ? dateTexte : " "}</p>
        <h1 className="text-2xl sm:text-3xl">Bonjour, prêt·e à réviser ?</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {prochain ? (
          <section className="carte carte-degrade flex flex-col p-4" aria-label="Compte à rebours avant le prochain examen">
            <p className="libelle">Prochain examen</p>
            <p className="mt-0.5 text-sm font-bold">{prochain.libelle}</p>
            <div className="tnum mt-2 flex gap-1.5">
              {[
                [jours, "jours"],
                [heures, "heures"],
                [minutes, "min"],
              ].map(([v, l]) => (
                <div key={l} className="boite flex flex-1 flex-col py-1.5 text-center">
                  <b className="font-heading text-xl leading-tight">{v}</b>
                  <span className="text-[10px] opacity-85">{l}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="carte carte-degrade flex flex-col gap-2 p-4">
            <p className="libelle">Prochain examen</p>
            <p className="text-sm font-semibold">Ajoutez vos dates d'EMD pour voir le compte à rebours.</p>
            <a href="/parametres/#examens" className="mt-auto self-start rounded-pill bg-white/20 px-3 py-1.5 text-sm font-bold text-white no-underline hover:bg-white/30">
              Ajouter une date
            </a>
          </section>
        )}
        <section className="carte flex flex-col gap-1.5 p-4" aria-label="Série de jours de révision">
          <p className="libelle">Série</p>
          <div className="flex items-center gap-2">
            {FLAMME}
            <p>
              <b className="tnum font-heading text-3xl leading-none">{monte ? nbSerie : 0}</b>{" "}
              <span className="text-ink-muted">{nbSerie > 1 ? "jours d'affilée" : "jour d'affilée"}</span>
            </p>
          </div>
          <div className="semaine" aria-label="Jours révisés cette semaine">
            {semaine.map((j, i) => (
              <span key={i} className={j.on ? "on" : ""} title={j.nom}>
                <i />
                <span aria-hidden="true">{j.l}</span>
                <span className="sr-only">
                  {j.nom} : {j.on ? "révisé" : "non révisé"}
                </span>
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="carte flex items-center gap-3 p-4" aria-label="Reprendre">
        {enCours ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="libelle">Reprendre</p>
              <p className="truncate text-sm font-bold">{enCours.titre}</p>
              <p className="text-xs text-ink-muted">
                {LIBELLES_MODE[enCours.mode]} · question {Math.min(enCours.index + 1, enCours.refs.length)} sur {enCours.refs.length}
              </p>
              <div className="gelule mt-2">
                <span style={{ width: `${(enCours.index / Math.max(1, enCours.refs.length)) * 100}%` }} />
              </div>
            </div>
            <a href="/qcm/" className="btn btn-primaire">
              Reprendre
            </a>
          </>
        ) : p.dernierCours ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="libelle">Reprendre</p>
              <p className="truncate text-sm font-bold">{p.dernierCours.titre}</p>
              <p className="text-xs text-ink-muted">Dernier cours consulté</p>
            </div>
            <a href={`/cours/${p.dernierCours.path}/`} className="btn btn-primaire">
              Continuer
            </a>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="libelle">Pour commencer</p>
              <p className="text-sm font-bold">Révision express : 10 questions au hasard</p>
              <p className="text-xs text-ink-muted">{nombre(index.totalQcm, 0)} QCM disponibles, tirés des cours</p>
            </div>
            <button className="btn btn-primaire" onClick={express} disabled={index.totalQcm === 0}>
              C'est parti
            </button>
          </>
        )}
      </section>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <h2 className="text-lg">Mes modules</h2>
        <span className="text-xs text-ink-muted">maîtrise moyenne {monte ? Math.round(moyenne * 100) : 0} %</span>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {index.modules.map((m) => {
          const r = monte ? maitriseModule(m.cours, sommes) : 0;
          const nbCours = m.cours.filter((c) => c.type === "cours").length;
          return (
            <li key={m.slug}>
              <a
                href={`/modules/${m.slug}/`}
                className="carte carte-module flex h-full flex-col items-start gap-1.5 p-3 text-ink no-underline"
                style={varModule(m.couleur)}
                aria-label={`${m.titre}, ${Math.round(r * 100)} % maîtrisé`}
              >
                <div className="flex w-full items-end justify-between">
                  <Erlenmeyer ratio={r} />
                  <span className="tnum mod-ink font-heading text-lg font-extrabold">{Math.round(r * 100)} %</span>
                </div>
                <span className="text-sm font-bold leading-tight">{m.titre}</span>
                <span className="text-xs text-ink-muted">
                  {nbCours ? `${nbCours} cours · ${nombre(m.totalQcm, 0)} QCM` : "Bientôt disponible"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <section className="carte flex flex-wrap items-center gap-2 p-4" aria-labelledby="titre-a-reviser">
        <h2 id="titre-a-reviser" className="basis-full text-base">
          À réviser aujourd'hui
        </h2>
        {monte && cartesDues + nouvellesCartes + erreurs + nouveauxCours === 0 ? (
          <p className="text-sm text-ink-muted">Rien en attente : lancez une révision express ou ouvrez un module.</p>
        ) : null}
        {cartesDues > 0 && (
          <a href="/flashcards/" className="puce">
            <Icone nom="cartes" taille={14} /> {cartesDues} carte{cartesDues > 1 ? "s" : ""} à revoir
          </a>
        )}
        {nouvellesCartes > 0 && (
          <a href="/flashcards/" className="puce">
            <Icone nom="cartes" taille={14} /> {nombre(nouvellesCartes, 0)} nouvelle{nouvellesCartes > 1 ? "s" : ""} carte{nouvellesCartes > 1 ? "s" : ""}
          </a>
        )}
        {monte && erreurs > 0 && (
          <a href="/entrainement/?mode=erreurs" className="puce">
            <Icone nom="erreurs" taille={14} /> {erreurs} erreur{erreurs > 1 ? "s" : ""} à refaire
          </a>
        )}
        {nouveauxCours > 0 && (
          <span className="puce">
            {nouveauxCours} nouveau{nouveauxCours > 1 ? "x" : ""} cours
          </span>
        )}
      </section>
    </div>
  );
}
