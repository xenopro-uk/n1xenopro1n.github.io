import { useEffect, useState } from "react";
import { Film, Search, Tv, Play, ExternalLink, AlertTriangle, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

const WARN_KEY = "xenopro:cinema-warned";

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

const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const IMG = "https://image.tmdb.org/t/p/w300";

// Free streaming sources. We render with our server proxy so X-Frame headers are stripped.
const SOURCES = [
  { id: "vidsrc.to",  movie: (id: number) => `https://vidsrc.to/embed/movie/${id}`,  tv: (id: number) => `https://vidsrc.to/embed/tv/${id}` },
  { id: "vidsrc.xyz", movie: (id: number) => `https://vidsrc.xyz/embed/movie/${id}`, tv: (id: number) => `https://vidsrc.xyz/embed/tv/${id}` },
  { id: "vidsrc.cc",  movie: (id: number) => `https://vidsrc.cc/v2/embed/movie/${id}`, tv: (id: number) => `https://vidsrc.cc/v2/embed/tv/${id}/1/1` },
  { id: "embed.su",   movie: (id: number) => `https://embed.su/embed/movie/${id}`,   tv: (id: number) => `https://embed.su/embed/tv/${id}/1/1` },
  { id: "2embed",     movie: (id: number) => `https://www.2embed.cc/embed/${id}`,    tv: (id: number) => `https://www.2embed.cc/embedtv/${id}` },
  { id: "multiembed", movie: (id: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1`, tv: (id: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=1&e=1` },
];

export function Cinema() {
  const { user } = useAccount();
  const [mode, setMode] = useState<Mode>("movie");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<TmdbItem | null>(null);
  const [sourceIdx, setSourceIdx] = useState(0);
  const [warned, setWarned] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(WARN_KEY) === "ok");
  const [recent, setRecent] = useState<TmdbItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("recently_watched").select("*").eq("user_id", user.id)
      .order("watched_at", { ascending: false }).limit(12)
      .then(({ data }) => {
        if (!data) return;
        setRecent(data.map((r) => ({
          id: Number(r.media_id), title: r.title, name: r.title,
          poster_path: r.poster?.replace(IMG, "") ?? "", overview: "",
        })));
      });
  }, [user]);

  useEffect(() => {
    if (!active || !user) return;
    supabase.from("recently_watched").upsert({
      user_id: user.id,
      media_type: mode,
      media_id: String(active.id),
      title: active.title || active.name || "",
      poster: active.poster_path ? IMG + active.poster_path : null,
      watched_at: new Date().toISOString(),
    }, { onConflict: "user_id,media_type,media_id" }).then(() => {});
  }, [active, mode, user]);

  if (!warned) {
    return (
      <div className="grid h-full place-items-center bg-background/40 p-6">
        <div className="max-w-md rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-yellow-400" />
          <h2 className="text-lg font-semibold">Third-party content warning</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Movies and shows stream from third-party hosts that XenoPro does not control or moderate.
            Players may show ads, popups, or adult content. Use an ad-blocker. Quality and uptime are not guaranteed.
          </p>
          <button onClick={() => { localStorage.setItem(WARN_KEY, "ok"); setWarned(true); }}
            className="mt-5 rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:bg-white/90">
            I understand, continue
          </button>
        </div>
      </div>
    );
  }

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`https://api.themoviedb.org/3/search/${mode}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`);
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

  const rawEmbed = (it: TmdbItem) => {
    const src = SOURCES[sourceIdx];
    return mode === "movie" ? src.movie(it.id) : src.tv(it.id);
  };

  if (active) {
    const direct = rawEmbed(active);
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-background/60 px-3 py-2">
          <button onClick={() => setActive(null)} className="rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-white/5">
            ← Back
          </button>
          <span className="line-clamp-1 text-sm font-medium">{active.title || active.name}</span>
          <a href={direct} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-black hover:bg-white/90">
            <ExternalLink className="h-3 w-3" /> Open in new tab
          </a>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-foreground/40">Source:</span>
            {SOURCES.map((s, i) => (
              <button key={s.id} onClick={() => setSourceIdx(i)}
                className={`rounded px-2 py-0.5 text-[10px] ${sourceIdx === i ? "bg-white text-black" : "text-foreground/60 hover:bg-white/10"}`}>
                {s.id}
              </button>
            ))}
          </div>
        </div>
        <iframe key={`${active.id}-${sourceIdx}`}
          src={direct}
          className="flex-1 w-full bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="origin"
          title={active.title || active.name}
        />
        <div className="border-t border-white/10 bg-black/40 px-3 py-1.5 text-[10px] text-foreground/50">
          If a player shows ads or doesn't load, switch source above or open in a new tab.
        </div>
      </div>
    );
  }

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="flex h-full flex-col bg-black text-white">
      {/* Netflix-style top bar */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-black/80 px-5 py-3 backdrop-blur">
        <span className="text-lg font-black tracking-tight text-red-600">XENOFLIX</span>
        <div className="ml-2 flex gap-1">
          <button onClick={() => loadTrending("movie")}
            className={`rounded-md px-3 py-1 text-xs ${mode === "movie" ? "bg-white text-black" : "text-white/70 hover:bg-white/10"}`}>
            Movies
          </button>
          <button onClick={() => loadTrending("tv")}
            className={`rounded-md px-3 py-1 text-xs ${mode === "tv" ? "bg-white text-black" : "text-white/70 hover:bg-white/10"}`}>
            TV Shows
          </button>
        </div>
        <form onSubmit={search} className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <Search className="h-3.5 w-3.5 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titles, people, genres"
            className="w-44 bg-transparent text-xs outline-none" />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.length === 0 && !loading && (
          <div className="grid h-full place-items-center text-center text-sm text-white/50">
            <div className="flex flex-col items-center gap-3">
              <Film className="h-10 w-10 text-white/20" />
              <p>Search a title or load trending.</p>
              <button onClick={() => loadTrending("movie")} className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500">
                Load Trending
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        {featured && (
          <div className="relative h-72 w-full overflow-hidden">
            {featured.poster_path && (
              <img src={IMG + featured.poster_path} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-sm opacity-60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end gap-3 p-8">
              <h2 className="text-4xl font-black tracking-tight drop-shadow-lg">{featured.title || featured.name}</h2>
              <p className="line-clamp-3 text-sm text-white/80">{featured.overview}</p>
              <div className="flex gap-2">
                <button onClick={() => setActive(featured)}
                  className="flex items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90">
                  <Play className="h-4 w-4 fill-black" /> Play
                </button>
                <button className="rounded-md bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30">
                  More info
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rails */}
        <div className="space-y-8 px-6 py-6">
          {recent.length > 0 && (
            <Rail title="Continue Watching" icon={<History className="h-3.5 w-3.5" />}>
              {recent.map((it) => <Poster key={it.id} item={it} onClick={() => setActive(it)} />)}
            </Rail>
          )}
          {rest.length > 0 && (
            <Rail title={`Trending ${mode === "movie" ? "Movies" : "TV"} this week`}>
              {rest.map((it) => <Poster key={it.id} item={it} onClick={() => setActive(it)} />)}
            </Rail>
          )}
        </div>
      </div>
    </div>
  );
}

function Rail({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/90">
        {icon} {title}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

function Poster({ item, onClick }: { item: TmdbItem; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group w-32 shrink-0 overflow-hidden rounded-md bg-white/5 text-left ring-1 ring-white/5 transition hover:scale-105 hover:ring-white/30">
      {item.poster_path ? (
        <img src={IMG + item.poster_path} alt="" className="aspect-[2/3] w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid aspect-[2/3] place-items-center bg-white/5 text-white/30"><Film className="h-6 w-6" /></div>
      )}
      <div className="line-clamp-1 p-1.5 text-[10px]">{item.title || item.name}</div>
    </button>
  );
}
