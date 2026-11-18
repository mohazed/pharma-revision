// Markdown minimal et sûr (**gras**, *italique*) : on échappe d'abord le HTML.
const echap = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function mdEnLigne(s: string | undefined | null): string {
  if (!s) return "";
  return echap(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");
}
