// Génère les icônes PNG de la PWA à partir d'un SVG (mortier et pilon sur fond émeraude).
// Usage : npm run icons
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const fond = (r) => `<rect width="512" height="512" rx="${r}" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f9d76"/><stop offset="1" stop-color="#0e6f78"/></linearGradient></defs>`;
const motif = (echelle) => `<g transform="translate(256 256) scale(${echelle}) translate(-32 -34)" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 28h44a22 22 0 0 1-44 0z"/><path d="M22 54h20M36 28 50 8"/><circle cx="51" cy="7.6" r="3.2" fill="#fff" stroke="none"/></g>`;
const svg = (r, echelle) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${fond(r)}${motif(echelle)}</svg>`);

mkdirSync("public/icons", { recursive: true });
await sharp(svg(112, 5.2)).resize(192).png().toFile("public/icons/icon-192.png");
await sharp(svg(112, 5.2)).resize(512).png().toFile("public/icons/icon-512.png");
await sharp(svg(0, 3.8)).resize(512).png().toFile("public/icons/icon-maskable-512.png");
await sharp(svg(0, 4.6)).resize(180).png().toFile("public/icons/apple-touch-icon.png");
console.log("Icônes générées dans public/icons/");
