import { useMemo, useState } from "react";
import { Gamepad2, Search, ArrowLeft, ExternalLink } from "lucide-react";

interface Game {
  name: string;
  category: string;
  url: string;
  image: string;
}

const thumb = (slug: string) => `https://images.crazygames.com/${slug}.png?auto=format,compress&q=65&cs=strip`;

// Direct game URLs (open in a new tab — no iframe required).
const GAMES: Game[] = [
  { name: "Slope",                category: "Arcade",     url: "https://www.crazygames.com/game/slope",                image: thumb("slope") },
  { name: "Subway Surfers",       category: "Runner",     url: "https://www.crazygames.com/game/subway-surfers",       image: thumb("subway-surfers") },
  { name: "Drive Mad",            category: "Driving",    url: "https://www.crazygames.com/game/drive-mad",            image: thumb("drive-mad") },
  { name: "Basket Random",        category: "Sports",     url: "https://www.crazygames.com/game/basket-random",        image: thumb("basket-random") },
  { name: "Basket Bros",          category: "Sports",     url: "https://www.crazygames.com/game/basketbros",           image: thumb("basketbros") },
  { name: "Boxing Random",        category: "Sports",     url: "https://www.crazygames.com/game/boxing-random",        image: thumb("boxing-random") },
  { name: "Cluster Rush",         category: "Platformer", url: "https://www.crazygames.com/game/cluster-rush",         image: thumb("cluster-rush") },
  { name: "Bacon May Die",        category: "Brawler",    url: "https://www.crazygames.com/game/bacon-may-die",        image: thumb("bacon-may-die") },
  { name: "Crazy Cattle 3D",      category: "Arena",      url: "https://www.crazygames.com/game/crazy-cattle-3d",      image: thumb("crazy-cattle-3d") },
  { name: "Escape Road",          category: "Driving",    url: "https://www.crazygames.com/game/escape-road",          image: thumb("escape-road") },
  { name: "Crossy Road",          category: "Arcade",     url: "https://www.crazygames.com/game/crossy-road",          image: thumb("crossy-road") },
  { name: "Big Tower Tiny Square",category: "Platformer", url: "https://www.crazygames.com/game/big-tower-tiny-square",image: thumb("big-tower-tiny-square") },
  { name: "Cookie Clicker",       category: "Idle",       url: "https://orteil.dashnet.org/cookieclicker/",            image: "https://upload.wikimedia.org/wikipedia/en/c/c4/Cookie_Clicker_logo.png" },
  { name: "BitLife",              category: "Sim",        url: "https://www.crazygames.com/game/bitlife-life-simulator",image: thumb("bitlife-life-simulator") },
  { name: "Bloons TD",            category: "Strategy",   url: "https://www.crazygames.com/game/bloons-td",            image: thumb("bloons-td") },
  { name: "1v1.LOL",              category: "Shooter",    url: "https://1v1.lol/",                                     image: "https://1v1.lol/icon-512.png" },
  { name: "Krunker",              category: "Shooter",    url: "https://krunker.io/",                                  image: "https://assets.krunker.io/textures/icon_512.png" },
  { name: "Shell Shockers",       category: "Shooter",    url: "https://shellshock.io/",                               image: "https://shellshock.io/assets/img/og.jpg" },
  { name: "Agar.io",              category: ".io",        url: "https://agar.io/",                                     image: "https://agar.io/img/agario_logo.svg" },
  { name: "Slither.io",           category: ".io",        url: "https://slither.io/",                                  image: "https://slither.io/s/iphone-2x.png" },
  { name: "Paper.io 2",           category: ".io",        url: "https://www.crazygames.com/game/paper-io-2",           image: thumb("paper-io-2") },
  { name: "Smash Karts",          category: "Racing",     url: "https://www.crazygames.com/game/smash-karts",          image: thumb("smash-karts") },
  { name: "Tetris",               category: "Puzzle",     url: "https://www.crazygames.com/game/tetris",               image: thumb("tetris") },
  { name: "2048",                 category: "Puzzle",     url: "https://play2048.co/",                                 image: "https://play2048.co/meta/apple-touch-icon.png" },
  { name: "Chess",                category: "Classic",    url: "https://www.chess.com/play/computer",                  image: "https://www.chess.com/bundles/web/images/offline-play/standardboard.png" },
  { name: "Doom",                 category: "Retro",      url: "https://dos.zone/doom-1993/",                          image: "https://upload.wikimedia.org/wikipedia/en/5/57/Doom_cover_art.jpg" },
  { name: "Snake",                category: "Classic",    url: "https://playsnake.org/",                               image: "https://playsnake.org/icon.png" },
  { name: "Geometry Dash",        category: "Rhythm",     url: "https://www.crazygames.com/game/geometry-dash",        image: thumb("geometry-dash") },
  { name: "Stickman Hook",        category: "Casual",     url: "https://www.crazygames.com/game/stickman-hook",        image: thumb("stickman-hook") },
  { name: "Moto X3M",             category: "Racing",     url: "https://www.crazygames.com/game/moto-x3m",             image: thumb("moto-x3m") },
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

  // Detail view: launch options (no iframe).
  if (active) {
    return (
      <div className="flex h-full flex-col bg-background/40">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <button onClick={() => setActive(null)} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium">{active.name}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <img src={active.image} alt={active.name}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            className="h-48 w-auto rounded-xl object-cover ring-1 ring-white/10" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{active.name}</h2>
            <p className="text-xs uppercase tracking-widest text-foreground/40">{active.category}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90"
            >
              <ExternalLink className="h-4 w-4" /> Launch in new tab
            </a>
            <a
              href={`/api/public/proxy?url=${encodeURIComponent(active.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm text-foreground hover:bg-white/15"
            >
              Launch through Xeno Proxy
            </a>
          </div>
          <p className="max-w-xs text-center text-[10px] text-foreground/40">
            Games open in their own tab so they actually run — no iframe blocking, no broken controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Gamepad2 className="h-4 w-4" />
        <span className="text-sm font-medium">Arcade — {GAMES.length} games</span>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games"
            className="w-40 bg-transparent text-xs outline-none" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-white/10 px-4 py-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full px-2.5 py-1 text-[11px] transition ${
              cat === c ? "bg-white text-black" : "text-foreground/60 hover:bg-white/5"
            }`}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((g) => (
            <button key={g.name} onClick={() => setActive(g)}
              className="group flex flex-col overflow-hidden rounded-xl bg-white/[0.04] text-left ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-white/20">
              <div className="aspect-video w-full overflow-hidden bg-black">
                <img src={g.image} alt={g.name}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 p-2">
                <span className="line-clamp-1 text-xs font-medium">{g.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-foreground/40">{g.category}</span>
              </div>
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
