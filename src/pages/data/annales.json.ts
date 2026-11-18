import { getAnnales, getHorsCours } from "../../lib/content";
export const GET = () =>
  new Response(JSON.stringify({ annales: getAnnales(), horsCours: getHorsCours() }), { headers: { "Content-Type": "application/json" } });
