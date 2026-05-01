// Lists games available from the gn-math/html GitHub repo (owner-permitted import).
// GET /api/public/gn-math -> { items: { id, name, url, thumb }[] }
//
// Fetches the GitHub tree once, caches in-memory at the edge, and returns a
// playable URL routed through our existing proxy so iframes always render.
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

const RAW_BASE = "https://gn-math.github.io";
// the gn-math/html pages site lives at gn-math.github.io and serves each game folder

function nameOf(folder: string): string {
  return folder
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
          const folders = t.tree
            .filter((n) => n.type === "tree" && !n.path.startsWith(".") && !["node_modules", "assets"].includes(n.path))
            .map((n) => n.path);
          const items = folders.map((f) => ({
            id: `gn-${f}`,
            name: nameOf(f),
            url: `${RAW_BASE}/${f}/`,
            thumb: `${RAW_BASE}/${f}/thumb.png`,
          }));
          return json({ items });
        } catch (e) {
          return json({ error: (e as Error).message, items: [] }, 502);
        }
      },
    },
  },
});
