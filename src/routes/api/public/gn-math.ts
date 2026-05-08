// Lists games from the gn-math/html GitHub repo (owner-permitted import).
// Each game is a single .html file at the repo root, served by raw.githubusercontent.com.
// Cover art comes from gn-math/covers (PNG keyed by the numeric base id).
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

const HTML_BASE = "https://raw.githubusercontent.com/gn-math/html/main";
const COVER_BASE = "https://raw.githubusercontent.com/gn-math/covers/main";

// Curated names sourced from the gn-math project.
const NAMES: Record<string, string> = {
  "0": "Bowmasters",
  "1": "OvO",
  "10": "Temple Run 2",
  "11": "Slope",
  "13": "Subway Surfers",
  "14": "Drift Hunters",
  "15": "Stickman Hook",
  "100": "Winter Rush",
  "101": "Geometry Dash",
  "102": "Paper.io 2",
  "103": "Crossy Road",
  "104": "Krunker.io",
  "105": "Shell Shockers",
  "106": "Smash Karts",
  "107": "Among Us",
  "108": "Tiny Fishing",
  "109": "Fireboy & Watergirl",
  "110": "Cookie Clicker",
  "111": "Friday Night Funkin'",
  "112": "Wordle",
  "113": "Vex 5",
  "114": "2048",
  "115": "Cluster Rush",
  "116": "Moto X3M",
  "117": "Drive Mad",
  "118": "Slither.io",
  "119": "Bitlife",
  "120": "Basket Random",
  "121": "Basketball Stars",
  "122": "Boxing Random",
  "123": "Minesweeper",
  "124": "Moto X3M Pool Party",
  "125": "Vex 4",
  "126": "Soccer Random",
  "127": "Stickman Boost",
  "128": "Stickman Climb",
  "129": "Flappy Bird",
  "130": "Volley Random",
  "146": "8 Ball Billiards",
  "147": "Air Hockey",
  "148": "Backgammon",
  "149": "Baseball Pro",
  "150": "Block Blast",
  "151": "Chess",
  "152": "Checkers",
  "153": "Connect 4",
  "154": "Dots & Boxes",
  "155": "Mahjong",
  "156": "Mancala",
  "157": "Othello",
  "158": "Pac-Man",
  "159": "Pinball",
  "160": "Pool Master",
  "161": "Reversi",
  "162": "Solitaire",
  "163": "Sudoku",
  "164": "Crazy Cattle 3D",
  "165": "Tetris",
  "166": "Tic-Tac-Toe",
  "167": "Yatzy",
  "168": "Snake",
  "169": "Hextris",
  "170": "Galaxy Invaders",
  "171": "Candy Crush",
  "172": "Bejeweled",
  "173": "Spider Solitaire",
  "174": "FreeCell",
  "175": "Klondike",
  "176": "Run",
  "177": "Run 3",
  "178": "Run 2",
  "179": "Doodle Jump",
  "180": "Geometry Dash Lite",
  "181": "Minecraft 1.8.8",
  "182": "Minecraft 1.12.2",
  "183": "Eaglercraft",
  "184": "Tomb of the Mask",
  "185": "Burrito Bison",
  "186": "Happy Wheels",
  "187": "Madalin Stunt Cars",
  "188": "Madalin Cars Multiplayer",
  "189": "Bullet Force",
  "190": "Webgl Quake",
  "191": "Slope 2",
  "192": "Slope 3",
};

function baseId(file: string): string {
  // "112-fix.html" -> "112", "117-fix.html" -> "117", "100-f.html" -> "100"
  return file.replace(/\.html?$/i, "").replace(/-(fix|fde|win|f|new|v\d+)$/i, "");
}

function nameOf(file: string): string {
  const id = baseId(file);
  if (NAMES[id]) return NAMES[id];
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
            .map((n) => n.path);
          // Sort numerically by base id
          files.sort((a, b) => Number(baseId(a)) - Number(baseId(b)));
          const items = files.map((f) => {
            const id = baseId(f);
            return {
              id: `gn-${f}`,
              name: nameOf(f),
              url: `${HTML_BASE}/${f}`,
              thumb: `${COVER_BASE}/${id}.png`,
            };
          });
          return json({ items });
        } catch (e) {
          return json({ error: (e as Error).message, items: [] }, 502);
        }
      },
    },
  },
});
