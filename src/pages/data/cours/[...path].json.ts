import type { APIRoute, GetStaticPaths } from "astro";
import { getTousLesCours } from "../../../lib/content";

export const getStaticPaths: GetStaticPaths = () => getTousLesCours().map((c) => ({ params: { path: c.path }, props: { cours: c } }));

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.cours), { headers: { "Content-Type": "application/json" } });
