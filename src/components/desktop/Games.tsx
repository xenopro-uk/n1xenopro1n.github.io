import { useMemo, useState } from "react";
import { Gamepad2, Search, ArrowLeft, Maximize2 } from "lucide-react";

// Curated popular HTML5 games — embed via iframe from public hosts
// Many require their parent domain; if blocked, we open in a new tab as fallback.
interface Game {
  name: string;
  category: string;
  embed: string;
  emoji: string;
}

const GAMES: Game[] = [
  { name: "Slope", category: "Arcade", emoji: "🎢", embed: "https://www.crazygames.com/embed/slope" },
  { name: "Subway Surfers", category: "Runner", emoji: "🚇", embed: "https://www.crazygames.com/embed/subway-surfers" },
  { name: "Drive Mad", category: "Driving", emoji: "🚗", embed: "https://www.crazygames.com/embed/drive-mad" },
  { name: "Basket Random", category: "Sports", emoji: "🏀", embed: "https://www.crazygames.com/embed/basket-random" },
  { name: "Basket Bros", category: "Sports", emoji: "🏀", embed: "https://www.crazygames.com/embed/basketbros" },
  { name: "Boxing Random", category: "Sports", emoji: "🥊", embed: "https://www.crazygames.com/embed/boxing-random" },
  { name: "Cluster Rush", category: "Platformer", emoji: "🚛", embed: "https://www.crazygames.com/embed/cluster-rush" },
  { name: "Bacon May Die", category: "Brawler", emoji: "🥓", embed: "https://www.crazygames.com/embed/bacon-may-die" },
  { name: "Crazy Cattle 3D", category: "Arena", emoji: "🐑", embed: "https://www.crazygames.com/embed/crazy-cattle-3d" },
  { name: "Escape Road", category: "Driving", emoji: "🛣️", embed: "https://www.crazygames.com/embed/escape-road" },
  { name: "Crossy Road", category: "Arcade", emoji: "🐔", embed: "https://www.crazygames.com/embed/crossy-road" },
  { name: "Big Tower Tiny Square", category: "Platformer", emoji: "🟦", embed: "https://www.crazygames.com/embed/big-tower-tiny-square" },
  { name: "Cookie Clicker", category: "Idle", emoji: "🍪", embed: "https://orteil.dashnet.org/cookieclicker/" },
  { name: "BitLife", category: "Sim", emoji: "👤", embed: "https://www.crazygames.com/embed/bitlife-life-simulator" },
  { name: "Bloons TD", category: "Strategy", emoji: "🎈", embed: "https://www.crazygames.com/embed/bloons-td" },
  { name: "1v1.LOL", category: "Shooter", emoji: "🔫", embed: "https://1v1.lol/" },
  { name: "Krunker", category: "Shooter", emoji: "🎯", embed: "https://krunker.io/" },
  { name: "Shell Shockers", category: "Shooter", emoji: "🥚", embed: "https://shellshock.io/" },
  { name: "Agar.io", category: ".io", emoji: "🟢", embed: "https://agar.io/" },
  { name: "Slither.io", category: ".io", emoji: "🐍", embed: "https://slither.io/" },
  { name: "Paper.io 2", category: ".io", emoji: "🟪", embed: "https://www.crazygames.com/embed/paper-io-2" },
  { name: "Smash Karts", category: "Racing", emoji: "🏎️", embed: "https://www.crazygames.com/embed/smash-karts" },
  { name: "Tetris", category: "Puzzle", emoji: "🟦", embed: "https://www.crazygames.com/embed/tetris" },
  { name: "2048", category: "Puzzle", emoji: "🔢", embed: "https://play2048.co/" },
  { name: "Chess", category: "Classic", emoji: "♟️", embed: "https://www.chess.com/play/computer" },
  { name: "Doom", category: "Retro", emoji: "👹", embed: "https://dos.zone/doom-1993/" },
  { name: "Snake", category: "Classic", emoji: "🐍", embed: "https://playsnake.org/" },
  { name: "Geometry Dash", category: "Rhythm", emoji: "🟧", embed: "https://www.crazygames.com/embed/geometry-dash" },
  { name: "Stickman Hook", category: "Casual", emoji: "🪝", embed: "https://www.crazygames.com/embed/stickman-hook" },
  { name: "Moto X3M", category: "Racing", emoji: "🏍️", embed: "https://www.crazygames.com/embed/moto-x3m" },
];

const CATEGORIES = ["All", ...Array.from(new Set(GAMES.map(g => g.category)))];

export function Games() {
  const [active, setActive] = useState<Game | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => GAMES.filter(g =>
    (cat === "All" || g.category === cat) &&
    g.name.toLowerCase().includes(q.toLowerCase())
  ), [q, cat]);

  if (active) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 bg-background/60 px-3 py-2">
          <button
            onClick={() => setActive(null)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium">{active.emoji} {active.name}</span>
          <a
            href={active.embed}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground/60 hover:bg-white/5"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Open in tab
          </a>
        </div>
        <iframe
          src={active.embed}
          className="flex-1 w-full bg-black"
          allow="autoplay; fullscreen; gamepad; pointer-lock"
          allowFullScreen
          title={active.name}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Gamepad2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Arcade — {GAMES.length} games</span>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search games"
            className="w-40 bg-transparent text-xs outline-none"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-white/10 px-4 py-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-2.5 py-1 text-[11px] transition ${
              cat === c
                ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                : "text-foreground/60 hover:bg-white/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((g) => (
            <button
              key={g.name}
              onClick={() => setActive(g)}
              className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl glass p-3 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-1 hover:ring-primary/40"
            >
              <span className="text-4xl transition group-hover:scale-110">{g.emoji}</span>
              <span className="line-clamp-1 text-xs font-medium text-foreground/90">{g.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-foreground/40">{g.category}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-foreground/40">No games match your search.</div>
        )}
      </div>
    </div>
  );
}
