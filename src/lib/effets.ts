// Effets de la direction « Officine moderne » : éclat de gélules (réponse parfaite)
// et pluie de confettis en gélules (note ≥ 16/20). Désactivés si animations réduites.
import { mouvementReduit } from "./apparence";

function couleurs(): string[] {
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  return [v("--pr-primary"), v("--pr-primary-2"), v("--pr-mod-bleu"), v("--pr-mod-vert"), v("--pr-mod-orange"), v("--pr-mod-violet"), v("--pr-mod-indigo"), v("--pr-mod-rose")].filter(Boolean);
}

export function eclatGelules(ancre: Element | null, n = 10) {
  if (!ancre || mouvementReduit() || typeof document === "undefined") return;
  const r = ancre.getBoundingClientRect();
  const cols = couleurs();
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.className = "eclat";
    p.setAttribute("aria-hidden", "true");
    p.style.left = `${r.left + r.width / 2}px`;
    p.style.top = `${r.top + r.height / 2}px`;
    p.style.background = `linear-gradient(90deg, ${cols[i % cols.length]} 50%, ${cols[(i + 3) % cols.length]} 50%)`;
    document.body.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 70;
    p.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0)", opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist - 30}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.2,1)" },
    ).onfinish = () => p.remove();
  }
}

export function pluieConfettis(n = 45) {
  if (mouvementReduit() || typeof document === "undefined") return;
  const boite = document.createElement("div");
  boite.className = "confettis";
  boite.setAttribute("aria-hidden", "true");
  document.body.appendChild(boite);
  const cols = couleurs();
  const H = window.innerHeight + 40;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = `linear-gradient(90deg, ${cols[i % cols.length]} 50%, ${cols[(i + 2) % cols.length]} 50%)`;
    boite.appendChild(p);
    const derive = (Math.random() - 0.5) * 120;
    p.animate(
      [{ transform: `translate(0,0) rotate(${Math.random() * 180}deg)` }, { transform: `translate(${derive}px, ${H}px) rotate(${360 + Math.random() * 720}deg)` }],
      { duration: 1800 + Math.random() * 1600, delay: 200 + Math.random() * 700, easing: "cubic-bezier(.3,.5,.6,1)", fill: "both" },
    );
  }
  setTimeout(() => boite.remove(), 4800);
}
