import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search, Play, Pause, SkipBack, SkipForward, Volume2,
  Heart, Library, Home, ListMusic,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { toast } from "sonner";

// Spotify Web API via /api/public/spotify (Client Credentials flow, server-side).
// Returns 30s previews (Spotify limitation for non-Premium API access).
interface Track {
  trackId: string;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl: string;
  previewUrl: string;
}

interface SavedRow {
  track_id: string;
  track_name: string;
  artist_name: string;
  artwork_url: string | null;
  preview_url: string;
  collection_name: string | null;
}

const SEED = ["top hits 2024", "lofi", "pop", "rock", "hip hop", "edm", "jazz", "k-pop", "indie"];
type View = "home" | "search" | "liked";

const cover = (url: string) => url.replace("100x100", "300x300");

export function MusicApp() {
  const { user } = useAccount();
  const [view, setView] = useState<View>("home");
  const [q, setQ] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [liked, setLiked] = useState<Track[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadLiked = useCallback(async () => {
    if (!user) { setLiked([]); setLikedIds(new Set()); return; }
    const { data } = await supabase.from("saved_songs")
      .select("track_id,track_name,artist_name,artwork_url,preview_url,collection_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as SavedRow[];
    const ts: Track[] = rows.map((r) => ({
      trackId: r.track_id, trackName: r.track_name, artistName: r.artist_name,
      artworkUrl: r.artwork_url ?? "", previewUrl: r.preview_url, collectionName: r.collection_name ?? undefined,
    }));
    setLiked(ts);
    setLikedIds(new Set(ts.map((t) => t.trackId)));
  }, [user]);

  useEffect(() => { loadLiked(); }, [loadLiked]);
  useEffect(() => { runSearch(SEED[Math.floor(Math.random() * SEED.length)]); }, []);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const url = `https://itunes.apple.com/search?media=music&limit=40&term=${encodeURIComponent(query)}`;
      const r = await fetch(url);
      const j = await r.json();
      const ts: Track[] = (j.results ?? [])
        .filter((t: { previewUrl?: string }) => t.previewUrl)
        .map((t: { trackId: number; trackName: string; artistName: string; collectionName?: string; artworkUrl100: string; previewUrl: string }) => ({
          trackId: String(t.trackId), trackName: t.trackName, artistName: t.artistName,
          collectionName: t.collectionName, artworkUrl: t.artworkUrl100, previewUrl: t.previewUrl,
        }));
      setTracks(ts);
    } catch { setTracks([]); }
    finally { setLoading(false); }
  };

  const play = (t: Track) => {
    setCurrent(t);
    setTimeout(() => {
      const a = audioRef.current; if (!a) return;
      a.src = t.previewUrl; a.volume = vol;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }, 0);
  };

  const toggle = () => {
    const a = audioRef.current; if (!a || !current) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const queue = view === "liked" ? liked : tracks;
  const skip = (dir: 1 | -1) => {
    if (!current || queue.length === 0) return;
    const i = queue.findIndex((t) => t.trackId === current.trackId);
    const next = queue[(i + dir + queue.length) % queue.length];
    if (next) play(next);
  };

  const toggleLike = async (t: Track) => {
    if (!user) { toast.error("Sign in to save songs."); return; }
    if (likedIds.has(t.trackId)) {
      const { error } = await supabase.from("saved_songs").delete()
        .eq("user_id", user.id).eq("track_id", t.trackId);
      if (error) return toast.error(error.message);
      setLikedIds((s) => { const n = new Set(s); n.delete(t.trackId); return n; });
      setLiked((arr) => arr.filter((x) => x.trackId !== t.trackId));
    } else {
      const { error } = await supabase.from("saved_songs").insert({
        user_id: user.id, track_id: t.trackId, track_name: t.trackName,
        artist_name: t.artistName, artwork_url: t.artworkUrl, preview_url: t.previewUrl,
        collection_name: t.collectionName ?? null,
      });
      if (error) return toast.error(error.message);
      setLikedIds((s) => new Set(s).add(t.trackId));
      setLiked((arr) => [t, ...arr]);
      toast.success("Added to Liked Songs");
    }
  };

  const TrackCard = ({ t }: { t: Track }) => (
    <div className="group flex flex-col gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5 transition hover:bg-white/[0.08]">
      <button onClick={() => play(t)} className="relative aspect-square overflow-hidden rounded-lg">
        {t.artworkUrl
          ? <img src={cover(t.artworkUrl)} alt="" className="h-full w-full object-cover" loading="lazy" />
          : <div className="grid h-full w-full place-items-center bg-white/5"><ListMusic className="h-8 w-8 opacity-40" /></div>}
        <div className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-emerald-500 opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-4 w-4 fill-black text-black" />
        </div>
      </button>
      <div className="min-w-0">
        <div className="line-clamp-1 text-sm font-medium">{t.trackName}</div>
        <div className="line-clamp-1 text-xs text-foreground/50">{t.artistName}</div>
      </div>
      <button onClick={() => toggleLike(t)}
        className={`self-start rounded-full p-1 ${likedIds.has(t.trackId) ? "text-emerald-400" : "text-foreground/40 hover:text-foreground"}`}>
        <Heart className={`h-4 w-4 ${likedIds.has(t.trackId) ? "fill-emerald-400" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#121212] to-black text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Spotify-like */}
        <aside className="hidden w-56 flex-col gap-1 border-r border-white/5 bg-black/40 p-3 sm:flex">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Xeno's Sonic</div>
          {[
            { id: "home" as View, label: "Home", icon: Home },
            { id: "search" as View, label: "Search", icon: Search },
            { id: "liked" as View, label: "Liked Songs", icon: Heart },
          ].map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
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
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-black/60 px-6 py-3 backdrop-blur">
            <form onSubmit={(e) => { e.preventDefault(); setView("search"); runSearch(q); }}
              className="flex flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10 focus-within:ring-white/30">
              <Search className="h-4 w-4 text-white/50" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="What do you want to play?"
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
                      {liked.map((t) => <TrackCard key={t.trackId} t={t} />)}
                    </div>}
              </>
            )}

            {view !== "liked" && (
              <>
                <h2 className="mb-4 text-2xl font-bold">{view === "search" ? `Results for "${q || "music"}"` : "Made for you"}</h2>
                {loading && <div className="text-center text-xs text-white/40">Loading…</div>}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {tracks.map((t) => <TrackCard key={t.trackId} t={t} />)}
                </div>
                {tracks.length === 0 && !loading && (
                  <div className="py-16 text-center text-xs text-white/40">No results.</div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Now playing bar */}
      <div className="border-t border-white/10 bg-black/90 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex w-64 min-w-0 items-center gap-3">
            {current ? (
              <>
                <img src={cover(current.artworkUrl)} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-xs font-medium">{current.trackName}</div>
                  <div className="line-clamp-1 text-[10px] text-white/50">{current.artistName}</div>
                </div>
                <button onClick={() => toggleLike(current)}
                  className={likedIds.has(current.trackId) ? "text-emerald-400" : "text-white/40 hover:text-white"}>
                  <Heart className={`h-4 w-4 ${likedIds.has(current.trackId) ? "fill-emerald-400" : ""}`} />
                </button>
              </>
            ) : <div className="text-[10px] text-white/30">No song playing</div>}
          </div>

          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <button onClick={() => skip(-1)} className="text-white/70 hover:text-white"><SkipBack className="h-4 w-4" /></button>
              <button onClick={toggle} disabled={!current}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-black hover:scale-105 disabled:opacity-40">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={() => skip(1)} className="text-white/70 hover:text-white"><SkipForward className="h-4 w-4" /></button>
            </div>
            <div className="h-1 w-full max-w-md overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-emerald-400 transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>

          <div className="hidden w-40 items-center gap-2 sm:flex">
            <Volume2 className="h-3.5 w-3.5 text-white/50" />
            <input type="range" min={0} max={1} step={0.01} value={vol}
              onChange={(e) => { const v = +e.target.value; setVol(v); if (audioRef.current) audioRef.current.volume = v; }}
              className="h-1 flex-1 accent-white" />
          </div>
        </div>
        <p className="mt-2 text-center text-[9px] text-white/30">Previews via iTunes · 30s · Sign in to save songs</p>
        <audio ref={audioRef}
          onTimeUpdate={(e) => { const a = e.currentTarget; setProgress(a.duration ? a.currentTime / a.duration : 0); }}
          onEnded={() => skip(1)} />
      </div>
    </div>
  );
}
