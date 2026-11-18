import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mdEnLigne } from "../lib/markdown";
import { modifier, marquerActivite, useProgression } from "../lib/store";
import { reviser, type NoteSrs } from "../lib/srs";
import { melanger } from "../lib/donnees";
import { lienSignalement } from "../lib/signaler";
import { evenement } from "../lib/evenements";
import { mouvementReduit } from "../lib/apparence";
import Chargement, { Vide } from "./Chargement";

export interface CarteSrs {
  id: string;
  recto: string;
  verso: string;
  c?: string;
  coursId?: string;
  module?: string;
  titreCours?: string;
}

interface Props {
  /** cartes d'un cours (sinon : toutes les cartes, chargées depuis /data/flashcards.json) */
  cartes?: CarteSrs[];
  titre?: string;
  modules?: { slug: string; titre: string }[];
}

const NOUVELLES_PAR_SESSION = 20;
const BOUTONS: { note: NoteSrs; label: string; sc: string; ink: string }[] = [
  { note: 0, label: "À revoir", sc: "var(--pr-danger)", ink: "var(--pr-danger-ink)" },
  { note: 1, label: "Difficile", sc: "var(--pr-warning)", ink: "var(--pr-warning-ink)" },
  { note: 2, label: "Bien", sc: "var(--pr-success)", ink: "var(--pr-success-ink)" },
  { note: 3, label: "Facile", sc: "var(--pr-primary-2)", ink: "var(--pr-primary-ink)" },
];

function delai(ms: number) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const j = Math.round(h / 24);
  if (j < 31) return `${j} jour${j > 1 ? "s" : ""}`;
  const mois = Math.round(j / 30);
  return `${mois} mois`;
}

export default function Flashcards({ cartes: cartesProps, titre, modules }: Props) {
  const p = useProgression();
  const [toutes, setToutes] = useState<CarteSrs[] | null>(cartesProps ?? null);
  const [module, setModule] = useState<string>("");
  const [file, setFile] = useState<CarteSrs[] | null>(null);
  const [retournee, setRetournee] = useState(false);
  const [anim, setAnim] = useState<"" | "sortie" | "entree">("");
  const [faites, setFaites] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const carteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cartesProps) return;
    const m = new URLSearchParams(location.search).get("module");
    if (m) setModule(m);
    fetch("/data/flashcards.json")
      .then((r) => r.json())
      .then(setToutes)
      .catch(() => setErreur("Impossible de charger les flashcards. Vérifiez votre connexion."));
  }, [cartesProps]);

  const maintenant = Date.now();
  const filtrees = useMemo(() => (toutes ?? []).filter((c) => !module || c.module === module), [toutes, module]);
  const dues = useMemo(() => filtrees.filter((c) => p.cartes[c.id] && p.cartes[c.id].due <= maintenant), [filtrees, p.cartes, maintenant]);
  const nouvelles = useMemo(() => filtrees.filter((c) => !p.cartes[c.id]), [filtrees, p.cartes]);
  const apprises = filtrees.length - nouvelles.length;

  const demarrer = (toutReviser = false) => {
    const f = toutReviser ? melanger(filtrees) : [...melanger(dues), ...nouvelles.slice(0, NOUVELLES_PAR_SESSION)];
    setFile(f);
    setFaites(0);
    setRetournee(false);
  };

  const carte = file?.[0];

  const noter = useCallback(
    (note: NoteSrs) => {
      if (!carte || !file) return;
      modifier((pr) => {
        pr.cartes[carte.id] = { ...reviser(pr.cartes[carte.id], note), c: carte.coursId ?? carte.c };
        marquerActivite(pr);
      });
      const suite = () => {
        setFile((f) => {
          if (!f) return f;
          const [premiere, ...reste] = f;
          const nf = note === 0 ? [...reste, premiere] : reste;
          if (nf.length === 0) evenement("flashcards_session");
          return nf;
        });
        setFaites((n) => n + 1);
        setRetournee(false);
        setAnim(mouvementReduit() ? "" : "entree");
        requestAnimationFrame(() => carteRef.current?.focus());
      };
      if (mouvementReduit()) suite();
      else {
        setAnim("sortie");
        setTimeout(suite, 0.42 * 1100);
      }
    },
    [carte, file],
  );

  useEffect(() => {
    if (!carte) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "SELECT" || t?.tagName === "TEXTAREA") return;
      if ((e.key === " " || e.key === "Enter") && t?.tagName !== "BUTTON" && t?.tagName !== "A") {
        e.preventDefault();
        setRetournee((r) => !r);
      } else if (retournee && ["1", "2", "3", "4"].includes(e.key)) {
        noter((Number(e.key) - 1) as NoteSrs);
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [carte, retournee, noter]);

  if (erreur) return <Vide titre="Erreur" texte={erreur} />;
  if (!toutes) return <Chargement texte="Chargement des flashcards…" />;
  if (toutes.length === 0) return <Vide titre="Pas encore de flashcards" texte="Les flashcards sont en cours de préparation. Revenez bientôt !" />;

  // Écran d'accueil de la révision
  if (!file) {
    return (
      <div className="flex flex-col gap-4">
        {modules && modules.length > 1 && (
          <label className="block max-w-sm">
            <span className="mb-1 block text-sm font-semibold">Module</span>
            <select className="champ" value={module} onChange={(e) => setModule(e.target.value)}>
              <option value="">Tous les modules</option>
              {modules.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.titre}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-3 gap-2">
          {[
            [dues.length, "à revoir"],
            [nouvelles.length, "nouvelles"],
            [apprises, "déjà vues"],
          ].map(([v, l]) => (
            <div key={l} className="carte flex flex-col items-center p-3 text-center">
              <b className="tnum font-heading text-2xl text-primary-ink">{v}</b>
              <span className="text-xs text-ink-muted">{l}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primaire" onClick={() => demarrer()} disabled={dues.length + nouvelles.length === 0}>
            {dues.length + nouvelles.length === 0 ? "Tout est à jour" : `Réviser ${Math.min(dues.length + Math.min(nouvelles.length, NOUVELLES_PAR_SESSION), 9999)} carte(s)`}
          </button>
          <button className="btn btn-secondaire" onClick={() => demarrer(true)} disabled={filtrees.length === 0}>
            Tout parcourir ({filtrees.length})
          </button>
        </div>
        <p className="text-sm text-ink-muted">
          Répétition espacée : plus une carte vous paraît facile, plus elle revient tard. Maximum {NOUVELLES_PAR_SESSION} nouvelles cartes par session.
        </p>
      </div>
    );
  }

  if (!carte)
    return (
      <Vide titre="Session terminée 🎉" texte={`${faites} carte(s) révisée(s). Revenez demain pour les prochaines échéances.`}>
        <button className="btn btn-primaire" onClick={() => setFile(null)}>
          Retour
        </button>
      </Vide>
    );

  const etat = p.cartes[carte.id];
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="tnum">
          <b>{file.length}</b> carte{file.length > 1 ? "s" : ""} restante{file.length > 1 ? "s" : ""}
        </span>
        {carte.titreCours && <span className="puce max-w-[60%] truncate">{carte.titreCours}</span>}
        {!carte.titreCours && titre && <span className="puce">{titre}</span>}
      </div>
      <div>
        <div className="fc-scene">
          <div
            ref={carteRef}
            className={["fc", retournee ? "retournee" : "", anim].join(" ")}
            onAnimationEnd={() => setAnim("")}
            tabIndex={0}
            role="button"
            aria-pressed={retournee}
            aria-label={retournee ? "Carte retournée : réponse affichée. Appuyez pour revoir la question." : "Retourner la carte pour voir la réponse"}
            onClick={() => setRetournee((r) => !r)}
          >
            <div className="fc-face" aria-hidden={retournee}>
              <p className="surtitre">{etat ? "Question" : "Nouvelle carte"}</p>
              <p className="font-heading text-xl font-bold leading-snug" dangerouslySetInnerHTML={{ __html: mdEnLigne(carte.recto) }} />
              <p className="text-xs text-ink-muted">Touchez la carte (ou Espace) pour la retourner</p>
            </div>
            <div className="fc-face fc-verso" aria-hidden={!retournee}>
              <p className="surtitre">Réponse</p>
              <p className="texte-riche" dangerouslySetInnerHTML={{ __html: mdEnLigne(carte.verso) }} />
              <div className="source mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-ink-muted">
                <span>📄 {carte.titreCours ?? titre ?? "Cours"}</span>
                <a
                  href={lienSignalement({ id: carte.id, enonce: carte.recto, cours: carte.titreCours ?? titre, type: "Flashcard" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-danger-ink hover:underline"
                >
                  ⚑ Signaler
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="pile" />
        <div className="pile p2" />
      </div>
      {retournee ? (
        <div className="srs" role="group" aria-label="Comment avez-vous répondu ?">
          {BOUTONS.map((b) => (
            <button key={b.note} type="button" style={{ ["--sc" as string]: b.sc, ["--sc-ink" as string]: b.ink }} onClick={() => noter(b.note)}>
              {b.label}
              <small>{delai(reviser(etat, b.note, maintenant).due - maintenant)}</small>
            </button>
          ))}
        </div>
      ) : (
        <button className="btn btn-primaire w-full" onClick={() => setRetournee(true)}>
          Afficher la réponse
        </button>
      )}
      <p className="hidden text-center text-xs text-ink-muted sm:block">Raccourcis : Espace pour retourner, 1 à 4 pour noter.</p>
    </div>
  );
}
