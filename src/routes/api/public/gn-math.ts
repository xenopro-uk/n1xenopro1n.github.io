// Lists games from the gn-math/html GitHub repo (owner-permitted import).
// Each game is a single .html file at the repo root, served by gn-math.github.io/html/<file>.
// GET /api/public/gn-math -> { items: { id, name, url, thumb }[] }
import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=3600" },
  });

interface Tree { tree: { path: string; type: string }[]; }

const RAW_BASE = "https://gn-math.github.io/html";

const FEATURED_NAMES: Record<string, string> = {
  "0.html": "Bowmasters",
  "1-fde.html": "OvO",
  "10.html": "Temple Run 2",
  "102.html": "Paper.io 2",
  "108.html": "Tiny Fishing",
  "112-fix.html": "Wordle",
  "114.html": "2048",
  "124.html": "Moto X3M Pool Party",
  "129.html": "Flappy Bird Multiplayer",
  "146.html": "8 Ball Billiards Classic",
  "151.html": "Chess Classic",
  "158.html": "Pac-Man",
  "171.html": "Candy Crush",
  "177.html": "Run 3",
  "181.html": "Minecraft 1.8.8",
  "182.html": "Minecraft 1.12.2",
};

function nameOf(file: string): string {
  if (FEATURED_NAMES[file]) return FEATURED_NAMES[file];
  const stem = file.replace(/\.html?$/i, "");
  return stem.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Route = createFileRoute("/api/public/gn-math")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        try {
          const r = await fetch("https://api.github.com/repos/gn-math/html/git/trees/main?recursive=0", {
            headers: { "User-Agent": "xenopro-arcade", Accept: "application/vnd.github+json" },
          });
          if (!r.ok) return json({ error: `gh ${r.status}`, items: [] }, 502);
          const t = await r.json() as Tree;
          const files = t.tree
            .filter((n) => n.type === "blob" && /\.html?$/i.test(n.path) && !n.path.includes("/"))
            .filter((n) => !["index.html", "404.html"].includes(n.path.toLowerCase()))
            .map((n) => n.path)
            .sort();
          const preferred = Object.keys(FEATURED_NAMES).filter((f) => files.includes(f));
          const ordered = [...preferred, ...files.filter((f) => !FEATURED_NAMES[f])].slice(0, 180);
          const items = ordered.map((f) => ({
            id: `gn-${f}`,
            name: nameOf(f),
            url: `${RAW_BASE}/${f}`,
            thumb: `https://placehold.co/640x360/111111/ffffff?text=${encodeURIComponent(nameOf(f))}`,
          }));
          return json({ items });
        } catch (e) {
          return json({ error: (e as Error).message, items: [] }, 502);
        }
      },
    },
  },
});
