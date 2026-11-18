import { getIndex } from "../../lib/content";
export const GET = () => new Response(JSON.stringify(getIndex()), { headers: { "Content-Type": "application/json" } });
