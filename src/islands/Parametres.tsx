import { useRef, useState } from "react";
import { exporter, importer, modifier, nouvelId, reinitialiser, useProgression, type Reglages } from "../lib/store";
import { appliquerApparence } from "../lib/apparence";
import { dateLongue, jourLocal } from "../lib/format";
import Icone from "./Icone";

function Choix<T extends string>({ nom, valeur, options, onChange }: { nom: string; valeur: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-pill bg-surface-2 p-1" role="radiogroup" aria-label={nom}>
      {options.map(([v, l]) => (
        <label key={v} className={"cursor-pointer rounded-pill px-3.5 py-1.5 text-sm font-semibold " + (valeur === v ? "bg-surface text-ink shadow-sm" : "text-ink-muted")}>
          <input type="radio" className="sr-only" name={nom} checked={valeur === v} onChange={() => onChange(v)} />
          {l}
        </label>
      ))}
    </div>
  );
}

export default function Parametres() {
  const p = useProgression();
  const fichier = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [libelle, setLibelle] = useState("");
  const [date, setDate] = useState("");
  const [horsLigne, setHorsLigne] = useState<string | null>(null);

  const regler = (r: Partial<Reglages>) => {
    modifier((pr) => {
      pr.reglages = { ...pr.reglages, ...r };
    });
    appliquerApparence({ ...p.reglages, ...r });
  };

  const telecharger = () => {
    const blob = new Blob([exporter()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmarevision-progression-${jourLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, texte: "Fichier de sauvegarde téléchargé." });
  };

  const lireFichier = async (f: File | undefined) => {
    if (!f) return;
    const r = importer(await f.text());
    setMessage(r.ok ? { ok: true, texte: "Progression importée avec succès." } : { ok: false, texte: r.erreur });
    if (r.ok) appliquerApparence(JSONreglages());
    if (fichier.current) fichier.current.value = "";
  };
  const JSONreglages = () => {
    try {
      return JSON.parse(localStorage.getItem("pharmarevision") || "{}").reglages ?? p.reglages;
    } catch {
      return p.reglages;
    }
  };

  const toutTelecharger = async () => {
    const reg = await navigator.serviceWorker?.ready.catch(() => null);
    if (!reg?.active) return setHorsLigne("Le mode hors-ligne n'est pas disponible dans ce navigateur (ou en développement).");
    const canal = new MessageChannel();
    canal.port1.onmessage = (e) => setHorsLigne(e.data.termine ? "Tout le site est disponible hors ligne ✓" : `Téléchargement… ${e.data.fait} / ${e.data.total}`);
    reg.active.postMessage({ type: "TOUT_TELECHARGER" }, [canal.port2]);
    setHorsLigne("Téléchargement en cours…");
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="carte flex flex-col gap-4 p-5" aria-labelledby="t-apparence">
        <h2 id="t-apparence" className="text-lg">
          Apparence
        </h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Thème</span>
          <Choix
            nom="Thème"
            valeur={p.reglages.theme}
            options={[
              ["clair", "Clair"],
              ["sombre", "Sombre"],
              ["systeme", "Comme l'appareil"],
            ]}
            onChange={(theme) => regler({ theme })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Animations</span>
          <Choix
            nom="Animations"
            valeur={p.reglages.mouvement}
            options={[
              ["systeme", "Comme l'appareil"],
              ["complet", "Normales"],
              ["reduit", "Réduites"],
            ]}
            onChange={(mouvement) => regler({ mouvement })}
          />
        </div>
      </section>

      <section id="examens" className="carte flex flex-col gap-3 p-5" aria-labelledby="t-examens">
        <h2 id="t-examens" className="text-lg">
          Mes dates d'examen
        </h2>
        <p className="text-sm text-ink-muted">Le compte à rebours de l'accueil affiche la prochaine date.</p>
        {p.reglages.examens.length > 0 && (
          <ul className="flex flex-col gap-2">
            {[...p.reglages.examens]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-md bg-surface-2 p-3">
                  <Icone nom="calendrier" taille={18} className="text-primary-ink" />
                  <span className="flex-1">
                    <span className="block font-semibold">{e.libelle}</span>
                    <span className="text-xs text-ink-muted first-letter:uppercase">{dateLongue(e.date + "T08:30")}</span>
                  </span>
                  <button
                    className="btn btn-fantome btn-petit !px-2"
                    aria-label={`Supprimer ${e.libelle}`}
                    onClick={() => regler({ examens: p.reglages.examens.filter((x) => x.id !== e.id) })}
                  >
                    <Icone nom="corbeille" taille={18} />
                  </button>
                </li>
              ))}
          </ul>
        )}
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!libelle.trim() || !date) return;
            regler({ examens: [...p.reglages.examens, { id: nouvelId(), libelle: libelle.trim(), date }] });
            setLibelle("");
            setDate("");
          }}
        >
          <label className="min-w-[12rem] flex-1">
            <span className="mb-1 block text-sm font-semibold">Examen</span>
            <input className="champ" placeholder="ex. EMD1 · Pharmacologie" value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={60} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Date</span>
            <input className="champ" type="date" value={date} min={jourLocal()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button className="btn btn-primaire" type="submit" disabled={!libelle.trim() || !date}>
            Ajouter
          </button>
        </form>
      </section>

      <section className="carte flex flex-col gap-3 p-5" aria-labelledby="t-progression">
        <h2 id="t-progression" className="text-lg">
          Ma progression
        </h2>
        <p className="text-sm text-ink-muted">
          Votre progression est enregistrée uniquement dans ce navigateur. Pour changer d'appareil, exportez-la puis importez le fichier sur l'autre appareil.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primaire" onClick={telecharger}>
            <Icone nom="telecharger" taille={18} /> Exporter (fichier JSON)
          </button>
          <button className="btn btn-secondaire" onClick={() => fichier.current?.click()}>
            <Icone nom="importer" taille={18} /> Importer
          </button>
          <input ref={fichier} type="file" accept="application/json,.json" className="sr-only" aria-label="Choisir un fichier de sauvegarde" onChange={(e) => lireFichier(e.target.files?.[0])} />
          <button
            className="btn btn-fantome text-danger-ink"
            onClick={() => {
              if (window.confirm("Effacer toute votre progression (questions, flashcards, résultats) ? Cette action est irréversible. Pensez à exporter d'abord.")) {
                reinitialiser();
                setMessage({ ok: true, texte: "Progression réinitialisée." });
              }
            }}
          >
            <Icone nom="corbeille" taille={18} /> Réinitialiser
          </button>
        </div>
        {message && (
          <p role="status" className={"text-sm font-semibold " + (message.ok ? "text-success-ink" : "text-danger-ink")}>
            {message.texte}
          </p>
        )}
        <p className="text-xs text-ink-muted">
          {Object.keys(p.questions).length} question(s) travaillée(s) · {Object.keys(p.cartes).length} flashcard(s) · {p.resultats.length} résultat(s) enregistrés.
        </p>
      </section>

      <section className="carte flex flex-col gap-3 p-5" aria-labelledby="t-horsligne">
        <h2 id="t-horsligne" className="text-lg">
          Hors ligne
        </h2>
        <p className="text-sm text-ink-muted">
          Les pages consultées restent disponibles sans connexion. Vous pouvez aussi tout télécharger d'un coup (quelques Mo) pour réviser sans internet.
        </p>
        <button className="btn btn-secondaire self-start" onClick={toutTelecharger}>
          Télécharger tout pour le hors-ligne
        </button>
        {horsLigne && (
          <p role="status" className="text-sm font-semibold">
            {horsLigne}
          </p>
        )}
      </section>

      <section className="carte flex flex-col gap-2 p-5" aria-labelledby="t-bareme">
        <h2 id="t-bareme" className="text-lg">
          Barème
        </h2>
        <p className="text-sm">Chaque question vaut 1 point et est notée indépendamment ; la note finale est ramenée sur 20.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>Une seule réponse</strong> : 1 si la bonne proposition est cochée, sinon 0.
          </li>
          <li>
            <strong>Plusieurs réponses</strong> : (bonnes cochées − fausses cochées) ÷ nombre de bonnes réponses, sans descendre sous 0. Exemple : réponses A, C, D ; vous cochez A, C, E → (2 − 1) ÷ 3 = 0,33.
          </li>
        </ul>
      </section>
    </div>
  );
}
