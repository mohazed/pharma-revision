import { MotionConfig } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/** Respecte data-motion (réglage « Animations » ou prefers-reduced-motion). */
export default function Mouvement({ children }: { children: ReactNode }) {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    const lire = () => setReduit(document.documentElement.dataset.motion === "reduced");
    lire();
    const obs = new MutationObserver(lire);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => obs.disconnect();
  }, []);
  return <MotionConfig reducedMotion={reduit ? "always" : "never"}>{children}</MotionConfig>;
}
