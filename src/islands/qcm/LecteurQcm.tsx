import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IndexDonnees, Qcm } from "../../lib/types";
import { chargerIndex, chargerQuestions, trouverCours } from "../../lib/donnees";
import { noterQuestion, surVingt, arrondi } from "../../lib/scoring";
import { duree, lettre, nombre } from "../../lib/format";
import { enregistrerReponse, getProgression, modifier, nouvelId, type Resultat, type Session } from "../../lib/store";
import { estModeExamen, LIBELLES_MODE } from "../../lib/session";
import { evenement } from "../../lib/evenements";
import QuestionQcm from "./QuestionQcm";
import Mouvement from "../Mouvement";
import Icone from "../Icone";
import Chargement, { Vide } from "../Chargement";

export default function LecteurQcm() {
  return (
    <Mouvement>
      <Lecteur />
    </Mouvement>
  );
}

function Lecteur() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [questions, setQuestions] = useState<Map<string, Qcm> | null>(null);
  const [index, setIndexDonnees] = useState<IndexDonnees | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [maintenant, setMaintenant] = useState(Date.now());
  const termineRef = useRef(false);
  const titreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getProgression().enCours;
    setSession(s);
    if (!s) return;
    Promise.all([chargerQuestions(s.refs), chargerIndex()])
      .then(([qs, idx]) => {
        setQuestions(qs);
        setIndexDonnees(idx);
      })
      .catch(() => setErreur("Impossible de charger les questions. Vérifiez votre connexion puis rechargez la page."));
  }, []);

  const examen = session ? estModeExamen(session.mode) : false;
  const refs = useMemo(() => (session && questions ? session.refs.filter((r) => questions.has(r.id)) : []), [session, questions]);

  const maj = useCallback((fn: (s: Session) => void) => {
    setSession((prev) => {
      if (!prev) return prev;
      const s = structuredClone(prev);
      fn(s);
      modifier((p) => {
        p.enCours = s;
      });
      return s;
    });
  }, []);

  const terminer = useCallback(() => {
    if (!session || !questions || termineRef.current) return;
    const s = getProgression().enCours ?? session;
    const pris = examen ? refs : refs.filter((r) => s.validees[r.id]);
    if (pris.length === 0) {
      modifier((p) => {
        p.enCours = null;
      });
      window.location.href = s.retour ?? "/";
      return;
    }
    termineRef.current = true;
    const details = pris.map((r) => {
      const q = questions.get(r.id)!;
      const cochees = s.reponses[r.id] ?? [];
      return { id: r.id, src: r.src, cours: q.cours ?? null, note: noterQuestion(q, cochees), cochees };
    });
    const points = details.reduce((t, d) => t + d.note, 0);
    const res: Resultat = {
      id: nouvelId(),
      mode: s.mode,
      titre: s.titre,
      date: Date.now(),
      points: arrondi(points),
      nb: details.length,
      note20: arrondi(surVingt(points, details.length)),
      dureeSec: Math.round((Date.now() - s.debut) / 1000),
      details,
    };
    modifier((p) => {
      if (examen) details.forEach((d) => enregistrerReponse(p, d.id, d.cours, d.note));
      p.resultats = [res, ...p.resultats].slice(0, 40);
      p.enCours = null;
    });
    evenement(examen ? "examen_blanc_termine" : "session_qcm_terminee", s.mode);
    window.location.href = `/resultats/?id=${res.id}`;
  }, [session, questions, refs, examen]);

  // Chronomètre
  const fin = session?.dureeSec ? session.debut + session.dureeSec * 1000 : null;
  useEffect(() => {
    if (!fin) return;
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, [fin]);
  const restant = fin ? Math.max(0, Math.round((fin - maintenant) / 1000)) : null;
  useEffect(() => {
    if (restant === 0 && questions) terminer();
  }, [restant, questions, terminer]);

  const i = Math.min(session?.index ?? 0, Math.max(0, refs.length - 1));
  const ref = refs[i];
  const q = ref ? questions?.get(ref.id) : undefined;
  const cochees = (ref && session?.reponses[ref.id]) || [];
  const validee = !!(ref && session?.validees[ref.id]);
  const note = q ? noterQuestion(q, cochees) : 0;
  const infoCours = useMemo(() => (q && index ? trouverCours(index, q.cours) : undefined), [q, index]);
  const titreCours = infoCours?.cours.titre;

  const basculer = useCallback(
    (opt: number) => {
      if (!q || !ref || validee) return;
      maj((s) => {
        const cur = s.reponses[ref.id] ?? [];
        s.reponses[ref.id] = q.type === "unique" ? (cur[0] === opt ? [] : [opt]) : cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt].sort();
      });
    },
    [q, ref, validee, maj],
  );

  const aller = useCallback(
    (n: number) => {
      maj((s) => {
        s.index = Math.max(0, Math.min(refs.length - 1, n));
      });
      requestAnimationFrame(() => titreRef.current?.focus());
    },
    [maj, refs.length],
  );

  const valider = useCallback(() => {
    if (!q || !ref || validee || cochees.length === 0) return;
    const n = noterQuestion(q, cochees);
    maj((s) => {
      s.validees[ref.id] = true;
    });
    modifier((p) => enregistrerReponse(p, q.id, q.cours ?? null, n));
  }, [q, ref, validee, cochees, maj]);

  const suivant = useCallback(() => {
    if (i >= refs.length - 1) {
      if (!examen) terminer();
      return;
    }
    aller(i + 1);
  }, [i, refs.length, examen, terminer, aller]);

  const demanderFin = useCallback(() => {
    if (!session) return;
    const sansReponse = refs.filter((r) => !(session.reponses[r.id]?.length)).length;
    const msg = examen
      ? sansReponse > 0
        ? `Il reste ${sansReponse} question(s) sans réponse. Terminer l'examen et voir la correction ?`
        : "Terminer l'examen et voir la correction ?"
      : "Terminer la session maintenant ? Seules les questions validées seront comptées.";
    if (window.confirm(msg)) terminer();
  }, [session, refs, examen, terminer]);

  // Raccourcis clavier : A–E (ou 1–5) pour cocher, Entrée pour valider / continuer, ← → en examen.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cible = e.target as HTMLElement;
      if (cible && (cible.tagName === "TEXTAREA" || (cible.tagName === "INPUT" && (cible as HTMLInputElement).type === "text"))) return;
      const k = e.key.toLowerCase();
      const idx = "abcde".indexOf(k) >= 0 ? "abcde".indexOf(k) : "12345".indexOf(k);
      if (idx >= 0 && k.length === 1) {
        e.preventDefault();
        basculer(idx);
      } else if (e.key === "Enter") {
        if (cible?.tagName === "BUTTON" || cible?.tagName === "A") return;
        e.preventDefault();
        if (examen) suivant();
        else if (!validee) valider();
        else suivant();
      } else if (examen && e.key === "ArrowRight" && cible?.tagName !== "INPUT") {
        aller(i + 1);
      } else if (examen && e.key === "ArrowLeft" && cible?.tagName !== "INPUT") {
        aller(i - 1);
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [basculer, valider, suivant, aller, examen, validee, i]);

  if (session === undefined) return <Chargement texte="Préparation de la session…" />;
  if (session === null)
    return (
      <Vide titre="Aucune session en cours" texte="Configurez une session de QCM pour commencer à vous entraîner.">
        <a href="/entrainement/" className="btn btn-primaire">
          Configurer une session
        </a>
      </Vide>
    );
  if (erreur) return <Vide titre="Erreur de chargement" texte={erreur} />;
  if (!questions || !index) return <Chargement texte="Chargement des questions…" />;
  if (!q || refs.length === 0)
    return (
      <Vide titre="Questions introuvables" texte="Les questions de cette session ne sont plus disponibles (le contenu a peut-être été mis à jour).">
        <button
          className="btn btn-primaire"
          onClick={() => {
            modifier((p) => {
              p.enCours = null;
            });
            window.location.href = "/entrainement/";
          }}
        >
          Nouvelle session
        </button>
      </Vide>
    );

  const repondues = refs.filter((r) => session.reponses[r.id]?.length).length;
  const progres = examen ? repondues / refs.length : (refs.filter((r) => session.validees[r.id]).length) / refs.length;
  const alerteTemps = restant !== null && restant <= 60;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-b-md sm:px-0">
        <div className="flex items-center gap-3">
          <a href={session.retour ?? "/"} className="btn btn-fantome btn-petit !px-2" aria-label="Quitter la session (vous pourrez la reprendre)" title="Quitter (reprendre plus tard)">
            <Icone nom="fermer" />
          </a>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {LIBELLES_MODE[session.mode]} · <span className="text-ink-muted">{session.titre}</span>
            </p>
            <div className="gelule mt-1.5" role="progressbar" aria-label="Progression" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progres * 100)}>
              <span style={{ width: `${progres * 100}%` }} />
            </div>
          </div>
          {restant !== null && (
            <p
              className={"flex items-center gap-1 rounded-pill px-3 py-1 font-mono text-sm font-bold " + (alerteTemps ? "bg-danger-soft text-danger" : "bg-surface-2")}
              aria-live={alerteTemps ? "assertive" : "off"}
              aria-label={`Temps restant : ${duree(restant)}`}
            >
              <Icone nom="chrono" taille={16} />
              {duree(restant)}
            </p>
          )}
        </div>
      </div>

      <div ref={titreRef} tabIndex={-1} className="outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={ref.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <QuestionQcm
              q={q}
              cochees={cochees}
              onBasculer={basculer}
              corrige={!examen && validee}
              note={note}
              numero={i + 1}
              total={refs.length}
              titreCours={titreCours}
              fil={infoCours ? `${infoCours.module.titre} › ${infoCours.cours.ordre}. ${infoCours.cours.titre}` : q.origine === "annale" ? "Hors cours actuel" : undefined}
              anime
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {examen ? (
          <>
            <button className="btn btn-secondaire" onClick={() => aller(i - 1)} disabled={i === 0}>
              <Icone nom="retour" taille={18} /> Précédente
            </button>
            {i < refs.length - 1 ? (
              <button className="btn btn-primaire" onClick={() => aller(i + 1)}>
                Suivante <Icone nom="fleche" taille={18} />
              </button>
            ) : (
              <button className="btn btn-primaire" onClick={demanderFin}>
                Terminer et corriger
              </button>
            )}
            {i < refs.length - 1 && (
              <button className="btn btn-fantome ml-auto" onClick={demanderFin}>
                Terminer l'examen
              </button>
            )}
          </>
        ) : !validee ? (
          <>
            <button className="btn btn-primaire" onClick={valider} disabled={cochees.length === 0}>
              Valider <kbd className="hidden rounded bg-on-primary/20 px-1.5 text-xs sm:inline">Entrée</kbd>
            </button>
            <button className="btn btn-fantome ml-auto" onClick={demanderFin}>
              Terminer
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primaire" onClick={suivant} autoFocus>
              {i < refs.length - 1 ? "Question suivante" : "Voir les résultats"} <Icone nom="fleche" taille={18} />
            </button>
            {i < refs.length - 1 && (
              <button className="btn btn-fantome ml-auto" onClick={demanderFin}>
                Terminer
              </button>
            )}
          </>
        )}
      </div>

      <p className="hidden text-xs text-ink-muted sm:block">
        Raccourcis : touches <kbd>A</kbd> à <kbd>E</kbd> pour cocher, <kbd>Entrée</kbd> pour {examen ? "passer à la suivante" : "valider puis continuer"}
        {examen ? ", flèches ← → pour naviguer" : ""}.
      </p>

      {examen && (
        <nav aria-label="Aller à une question" className="carte p-3">
          <p className="mb-2 text-sm font-semibold text-ink-muted">
            {repondues} / {refs.length} réponses
          </p>
          <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 md:grid-cols-15">
            {refs.map((r, n) => {
              const rep = !!session.reponses[r.id]?.length;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => aller(n)}
                    className={
                      "h-9 w-full rounded-sm text-sm font-bold transition-colors " +
                      (n === i ? "ring-2 ring-primary " : "") +
                      (rep ? "bg-primary text-on-primary" : "bg-surface-2 text-ink-muted hover:bg-line")
                    }
                    aria-label={`Question ${n + 1}${rep ? ", répondue" : ", sans réponse"}`}
                    aria-current={n === i ? "step" : undefined}
                  >
                    {n + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {!examen && validee && note < 1 && (
        <p className="sr-only" role="status">
          Réponse incomplète : {nombre(note, 2)} sur 1. Bonnes réponses : {q.correctes.map(lettre).join(", ")}.
        </p>
      )}
    </div>
  );
}
