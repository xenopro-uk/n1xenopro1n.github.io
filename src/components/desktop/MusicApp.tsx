// YouTube-powered music player.
// - Search via /api/public/youtube (YouTube Data API v3, server-side; key hidden).
// - Plays full songs via the YouTube IFrame embed (no length limit).
// - "Liked Songs" persists per-account in saved_songs (track_id stores the videoId).
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Play, Heart, Library, Home, ListMusic, Music as MusicIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { toast } from "sonner";
import { logActivity } from "@/lib/surveillance";

interface YTItem {
  videoId: string;
  title: string;
  channel: string;
  thumb: string;
}
interface SavedRow {
  track_id: string;
  track_name: string;
  artist_name: string;
  artwork_url: string | null;
  preview_url: string;
  collection_name: string | null;
}

const SEED = ["top hits 2026", "lofi beats", "pop hits", "rock anthems", "hip hop", "edm", "phonk", "k-pop", "indie", "rnb chill"];
type View = "home" | "search" | "liked";

const itemFromSaved = (r: SavedRow): YTItem => ({
  videoId: r.track_id,
  title: r.track_name,
  channel: r.artist_name,
  thumb: r.artwork_url ?? "",
});

export function MusicApp() {
  const { user } = useAccount();
  const [view, setView] = useState<View>("home");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<YTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<YTItem | null>(null);
  const [liked, setLiked] = useState<YTItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const audioBoot = useRef(false);

  const loadLiked = useCallback(async () => {
    if (!user) { setLiked([]); setLikedIds(new Set()); return; }
    const { data } = await supabase.from("saved_songs")
      .select("track_id,track_name,artist_name,artwork_url,preview_url,collection_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as SavedRow[];
    const ts = rows.map(itemFromSaved);
    setLiked(ts);
    setLikedIds(new Set(ts.map((t) => t.videoId)));
  }, [user]);

  useEffect(() => { loadLiked(); }, [loadLiked]);

  const runQuery = useCallback(async (action: "search" | "trending", query?: string) => {
    setLoading(true);
    try {
      const u = action === "search"
        ? `/api/public/youtube?action=search&q=${encodeURIComponent(query ?? "music")}`
        : `/api/public/youtube?action=trending`;
      const r = await fetch(u);
      const j = await r.json() as { items?: YTItem[] };
      setItems(j.items ?? []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void runQuery("trending"); }, [runQuery]);

  const play = (t: YTItem) => {
    audioBoot.current = true;
    setCurrent(t);
    void logActivity("music.play", t.videoId, { title: t.title });
  };

  const queue = view === "liked" ? liked : items;
  const skip = (dir: 1 | -1) => {
    if (!current || queue.length === 0) return;
    const i = queue.findIndex((t) => t.videoId === current.videoId);
    const next = queue[(i + dir + queue.length) % queue.length];
    if (next) play(next);
  };

  const toggleLike = async (t: YTItem) => {
    if (!user) { toast.error("Sign in to save songs."); return; }
    if (likedIds.has(t.videoId)) {
      const { error } = await supabase.from("saved_songs").delete()
        .eq("user_id", user.id).eq("track_id", t.videoId);
      if (error) return toast.error(error.message);
      setLikedIds((s) => { const n = new Set(s); n.delete(t.videoId); return n; });
      setLiked((arr) => arr.filter((x) => x.videoId !== t.videoId));
    } else {
      const { error } = await supabase.from("saved_songs").insert({
        user_id: user.id,
        track_id: t.videoId,
        track_name: t.title,
        artist_name: t.channel,
        artwork_url: t.thumb,
        preview_url: `https://www.youtube.com/watch?v=${t.videoId}`,
        collection_name: null,
      });
      if (error) return toast.error(error.message);
      setLikedIds((s) => new Set(s).add(t.videoId));
      setLiked((arr) => [t, ...arr]);
      toast.success("Added to Liked Songs");
    }
  };

  const TrackCard = ({ t }: { t: YTItem }) => (
    <div className="group flex flex-col gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5 transition hover:bg-white/[0.08]">
      <button onClick={() => play(t)} className="relative aspect-square overflow-hidden rounded-lg">
        {t.thumb
          ? <img src={t.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          : <div className="grid h-full w-full place-items-center bg-white/5"><ListMusic className="h-8 w-8 opacity-40" /></div>}
        <div className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-emerald-500 opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-4 w-4 fill-black text-black" />
        </div>
      </button>
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-medium leading-tight">{t.title}</div>
        <div className="line-clamp-1 text-xs text-foreground/50">{t.channel}</div>
      </div>
      <button onClick={() => toggleLike(t)}
        className={`self-start rounded-full p-1 ${likedIds.has(t.videoId) ? "text-emerald-400" : "text-foreground/40 hover:text-foreground"}`}>
        <Heart className={`h-4 w-4 ${likedIds.has(t.videoId) ? "fill-emerald-400" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#121212] to-black text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-col gap-1 border-r border-white/5 bg-black/40 p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            <MusicIcon className="h-3 w-3" /> Xeno's Sonic
          </div>
          {[
            { id: "home" as View, label: "Home", icon: Home },
            { id: "search" as View, label: "Search", icon: Search },
            { id: "liked" as View, label: "Liked Songs", icon: Heart },
          ].map((n) => (
            <button key={n.id} onClick={() => {
              setView(n.id);
              if (n.id === "home") void runQuery("trending");
            }}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${view === n.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
          <div className="mt-4 rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Library className="h-4 w-4" /> Your Library
            </div>
            <div className="mt-2 text-[11px] text-white/50">
              {user ? `${liked.length} liked song${liked.length === 1 ? "" : "s"}` : "Sign in to save songs"}
            </div>
          </div>
          <div className="mt-2 px-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Try</div>
            {SEED.slice(0, 6).map((s) => (
              <button key={s} onClick={() => { setQ(s); setView("search"); void runQuery("search", s); }}
                className="block w-full rounded px-2 py-1 text-left text-[11px] text-white/55 hover:bg-white/5 hover:text-white">
                {s}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-black/60 px-6 py-3 backdrop-blur">
            <form onSubmit={(e) => { e.preventDefault(); setView("search"); void runQuery("search", q); }}
              className="flex flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10 focus-within:ring-white/30">
              <Search className="h-4 w-4 text-white/50" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search songs, artists, albums…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/40" />
            </form>
            {user && <span className="text-xs text-white/50">@{user.email?.split("@")[0]}</span>}
          </div>

          <div className="px-6 py-6">
            {view === "liked" && (
              <>
                <div className="mb-6 flex items-end gap-5">
                  <div className="grid h-40 w-40 place-items-center rounded-md bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl">
                    <Heart className="h-16 w-16 fill-white text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">Playlist</div>
                    <h1 className="text-5xl font-extrabold tracking-tight">Liked Songs</h1>
                    <div className="mt-3 text-xs text-white/60">{liked.length} songs</div>
                  </div>
                </div>
                {liked.length === 0
                  ? <div className="rounded-xl bg-white/5 p-8 text-center text-sm text-white/50">No liked songs yet — tap the heart on any song.</div>
                  : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {liked.map((t) => <TrackCard key={t.videoId} t={t} />)}
                    </div>}
              </>
            )}

            {view !== "liked" && (
              <>
                <h2 className="mb-4 text-2xl font-bold">
                  {view === "search" ? `Results for "${q || "music"}"` : "Trending music today"}
                </h2>
                {loading && <div className="text-center text-xs text-white/40">Loading…</div>}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((t) => <TrackCard key={t.videoId} t={t} />)}
                </div>
                {items.length === 0 && !loading && (
                  <div className="py-16 text-center text-xs text-white/40">No results.</div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Now playing — embedded YouTube */}
      <div className="border-t border-white/10 bg-black/90 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex w-64 min-w-0 items-center gap-3">
            {current ? (
              <>
                <img src={current.thumb} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-xs font-medium">{current.title}</div>
                  <div className="line-clamp-1 text-[10px] text-white/50">{current.channel}</div>
                </div>
                <button onClick={() => toggleLike(current)}
                  className={likedIds.has(current.videoId) ? "text-emerald-400" : "text-white/40 hover:text-white"}>
                  <Heart className={`h-4 w-4 ${likedIds.has(current.videoId) ? "fill-emerald-400" : ""}`} />
                </button>
              </>
            ) : <div className="text-[10px] text-white/30">Pick a song to start playing</div>}
          </div>

          <div className="flex flex-1 flex-col items-center gap-1">
            {current ? (
              <iframe
                key={current.videoId}
                src={`https://www.youtube-nocookie.com/embed/${current.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={current.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-20 w-full max-w-md rounded-md bg-black ring-1 ring-white/10"
              />
            ) : (
              <div className="grid h-20 w-full max-w-md place-items-center rounded-md bg-white/5 text-[11px] text-white/30">
                YouTube player will appear here
              </div>
            )}
          </div>

          <div className="hidden w-40 items-center justify-end gap-2 sm:flex">
            <button onClick={() => skip(-1)} className="rounded bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10">Prev</button>
            <button onClick={() => skip(1)} className="rounded bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10">Next</button>
          </div>
        </div>
        <p className="mt-2 text-center text-[9px] text-white/30">
          Powered by YouTube · full tracks · {user ? `signed in as @${user.email?.split("@")[0]}` : "sign in to save songs"}
        </p>
      </div>
    </div>
  );
}
