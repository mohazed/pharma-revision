// Types du contenu (voir content/SCHEMA.md).

export interface Source {
  page?: number | string;
  extrait?: string;
}

export interface Qcm {
  id: string;
  type: "unique" | "multiple";
  enonce: string;
  options: string[];
  correctes: number[];
  explication: string;
  source?: Source;
  difficulte?: 1 | 2 | 3;
  tags?: string[];
  origine?: "genere" | "annale";
  annale?: string;
  /** Ajouté au build : cours auquel la question appartient (null = hors cours actuel). */
  cours?: string | null;
  verifie?: boolean;
}

export interface Flashcard {
  id: string;
  recto: string;
  verso: string;
  tags?: string[];
}

export interface Fiche {
  id?: string;
  titre?: string;
  sections: { titre: string; points: string[] }[];
  aRetenir?: string[];
  pieges?: string[];
}

export interface CasClinique {
  id: string;
  titre: string;
  enonce: string;
  questions: Qcm[];
}

export interface VariableCalcul {
  min: number;
  max: number;
  pas?: number;
  unite?: string;
}

export interface Calcul {
  id: string;
  titre: string;
  enonce: string;
  variables: Record<string, VariableCalcul>;
  formule: string;
  unite?: string;
  decimales?: number;
  etapes?: string[];
  rappel?: string;
}

export interface Structure {
  id: string;
  nom: string;
  smiles: string;
  classe?: string;
  question?: string;
  options?: string[];
  correctes?: number[];
  explication?: string;
}

export interface Tableau {
  id: string;
  type?: undefined | "tableau";
  titre: string;
  colonnes: string[];
  lignes: string[][];
}

export interface NoeudCarte {
  label: string;
  enfants?: NoeudCarte[];
}

export interface CarteMentale {
  id: string;
  type: "carte";
  titre: string;
  racine: NoeudCarte;
}

export interface Mnemo {
  id: string;
  titre: string;
  moyen: string;
  explication?: string;
}

export interface Terme {
  terme: string;
  definition: string;
  cours?: string | null;
}

export interface CoursMeta {
  id: string;
  module: string;
  ordre: number;
  titre: string;
  type: "cours" | "td";
  source?: { driveId?: string; fichier?: string; modifiedTime?: string };
  resume?: string;
}

export interface Comptes {
  qcm: number;
  annales: number;
  flashcards: number;
  fiche: number;
  cas: number;
  calculs: number;
  structures: number;
  tableaux: number;
  mnemos: number;
}

export interface CoursResume extends CoursMeta {
  /** chemin d'URL : /cours/<path>/ */
  path: string;
  comptes: Comptes;
  nouveau: boolean;
}

export interface Cours extends CoursResume {
  qcm: Qcm[];
  flashcards: Flashcard[];
  fiche: Fiche | null;
  cas: CasClinique[];
  calculs: Calcul[];
  structures: Structure[];
  tableaux: Tableau[];
  cartes: CarteMentale[];
  mnemos: Mnemo[];
}

export interface ModuleInfo {
  slug: string;
  titre: string;
  couleur: string;
  driveFolder?: string;
}

export interface Annale {
  id: string;
  titre: string;
  date?: string;
  duree?: number;
  faculte?: string;
  questions: Qcm[];
}

export interface IndexDonnees {
  modules: (ModuleInfo & { cours: CoursResume[]; totalQcm: number })[];
  annales: { id: string; titre: string; date?: string; duree?: number; nbQuestions: number; nbHorsCours: number }[];
  totalQcm: number;
  totalFlashcards: number;
}
