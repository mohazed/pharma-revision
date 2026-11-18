import type { ReactNode } from "react";

export default function Chargement({ texte = "Chargement…" }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-muted" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary" aria-hidden="true" />
      {texte}
    </div>
  );
}

export function Vide({ titre, texte, children }: { titre: string; texte?: string; children?: ReactNode }) {
  return (
    <div className="carte mx-auto my-8 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <h2 className="text-xl">{titre}</h2>
      {texte && <p className="text-ink-muted">{texte}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
