import { useEffect } from "react";
import { modifier } from "../../lib/store";

/** Mémorise le dernier cours consulté (pour « Reprendre » sur l'accueil). */
export default function MemoriserCours({ path, titre }: { path: string; titre: string }) {
  useEffect(() => {
    modifier((p) => {
      p.dernierCours = { path, titre, at: Date.now() };
    });
  }, [path, titre]);
  return null;
}
