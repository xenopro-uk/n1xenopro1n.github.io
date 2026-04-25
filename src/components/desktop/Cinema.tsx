import { useState } from "react";
import { Film, Search, Tv, Play } from "lucide-react";

// Free streaming embeds — vidsrc.to / vidsrc.in style: takes IMDb/TMDB id
// We use TMDB search to populate a catalog, then build a vidsrc embed URL.
type Mode = "movie" | "tv";

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  overview: string;
}

const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8"; // public demo key shipped with TMDB tutorials
const IMG = "https://image.tmdb.org/t/p/w300";

export function Cinema() {
  const [mode, setMode] = useState<Mode>("movie");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<TmdbItem | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(
        `https://api.themoviedb.org/3/search/${mode}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`
      );
      const j = await r.json();
      setItems(j.results ?? []);
    } finally { setLoading(false); }
  };

  const loadTrending = async (m: Mode) => {
    setMode(m); setLoading(true);
    try {
      const r = await fetch(`https://api.themoviedb.org/3/trending/${m}/week?api_key=${TMDB_KEY}`);
      const j = await r.json();
      setItems(j.results ?? []);
    } finally { setLoading(false); }
  };

  const embedUrl = (it: TmdbItem) =>
    mode === "movie"
      ? `https://vidsrc.xyz/embed/movie/${it.id}`
      : `https://vidsrc.xyz/embed/tv/${it.id}`;

  if (active) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 bg-background/60 px-3 py-2">
          <button onClick={() => setActive(null)} className="rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-white/5">
            ← Back
          </button>
          <span className="text-sm font-medium">{active.title || active.name}</span>
        </div>
        <iframe
          src={embedUrl(active)}
          className="flex-1 w-full bg-black"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          title={active.title || active.name}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Film className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Cinema</span>
        <div className="ml-2 flex gap-1">
          <button
            onClick={() => loadTrending("movie")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${mode === "movie" ? "bg-primary/20 text-primary" : "text-foreground/60 hover:bg-white/5"}`}
          >
            <Film className="h-3 w-3" /> Movies
          </button>
          <button
            onClick={() => loadTrending("tv")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${mode === "tv" ? "bg-primary/20 text-primary" : "text-foreground/60 hover:bg-white/5"}`}
          >
            <Tv className="h-3 w-3" /> TV
          </button>
        </div>
        <form onSubmit={search} className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title…"
            className="w-44 bg-transparent text-xs outline-none"
          />
        </form>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {items.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-foreground/50">
            <Film className="h-10 w-10 text-foreground/20" />
            <p>Search a title or load trending.</p>
            <button onClick={() => loadTrending("movie")} className="mt-2 rounded-full bg-primary/20 px-4 py-1.5 text-xs text-primary">
              Load Trending Movies
            </button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setActive(it)}
              className="group overflow-hidden rounded-xl glass text-left transition hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/40"
            >
              {it.poster_path ? (
                <img src={IMG + it.poster_path} alt="" className="aspect-[2/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-white/5 text-foreground/30">
                  <Film className="h-8 w-8" />
                </div>
              )}
              <div className="p-2">
                <div className="flex items-center gap-1 text-[10px] text-primary">
                  <Play className="h-2.5 w-2.5 fill-current" /> Play free
                </div>
                <div className="line-clamp-1 text-xs font-medium">{it.title || it.name}</div>
                <div className="text-[10px] text-foreground/50">
                  {(it.release_date || it.first_air_date || "").slice(0, 4)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
