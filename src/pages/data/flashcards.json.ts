import { getTousLesCours } from "../../lib/content";
// Toutes les flashcards, pour la révision globale (SRS).
export const GET = () =>
  new Response(
    JSON.stringify(
      getTousLesCours().flatMap((c) =>
        c.flashcards.map((f) => ({ id: f.id, recto: f.recto, verso: f.verso, c: c.path, coursId: c.id, module: c.module, titreCours: c.titre })),
      ),
    ),
    { headers: { "Content-Type": "application/json" } },
  );
