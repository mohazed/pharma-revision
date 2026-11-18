import { getGlossaire } from "../../lib/content";
export const GET = () => new Response(JSON.stringify(getGlossaire()), { headers: { "Content-Type": "application/json" } });
