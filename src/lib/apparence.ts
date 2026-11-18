// Applique le thème et l'intensité des animations sur <html> (data-theme / data-motion).
import type { Reglages } from "./store";

export function appliquerApparence(r: Pick<Reglages, "theme" | "mouvement">) {
  const html = document.documentElement;
  const sombre = r.theme === "sombre" || (r.theme === "systeme" && matchMedia("(prefers-color-scheme: dark)").matches);
  html.dataset.theme = sombre ? "dark" : "light";
  const reduit = r.mouvement === "reduit" || (r.mouvement === "systeme" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  html.dataset.motion = reduit ? "reduced" : "full";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", getComputedStyle(html).getPropertyValue("--pr-bg").trim() || "#0f7a5c");
}

export const mouvementReduit = () =>
  typeof document !== "undefined" && document.documentElement.dataset.motion === "reduced";
