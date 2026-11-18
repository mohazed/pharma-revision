import { ICONES, type NomIcone } from "../lib/icones";

export default function Icone({ nom, taille = 20, className = "", titre }: { nom: NomIcone; taille?: number; className?: string; titre?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={titre ? undefined : true}
      role={titre ? "img" : undefined}
      aria-label={titre}
    >
      <path d={ICONES[nom]} />
    </svg>
  );
}
