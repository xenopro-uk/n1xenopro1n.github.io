import { useEffect, useRef, useState } from "react";
import { Music, Search, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

// iTunes Search API — free, no key, CORS-enabled. Returns 30s previews + artwork.
interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100: string;
  previewUrl: string;
}

const SEED = ["top hits 2024", "lofi", "pop", "rock", "hip hop", "edm", "jazz", "k-pop"];

export function MusicApp() {
  const [q, setQ] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vol, setVol] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    runSearch(SEED[Math.floor(Math.random() * SEED.length)]);
  }, []);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const url = `https://itunes.apple.com/search?media=music&limit=40&term=${encodeURIComponent(query)}`;
      const r = await fetch(url);
      const j = await r.json();
      setTracks((j.results ?? []).filter((t: Track) => t.previewUrl));
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const play = (t: Track) => {
    setCurrent(t);
    setTimeout(() => {
      const a = audioRef.current;
      if (!a) return;
      a.src = t.previewUrl;
      a.volume = vol;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }, 0);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const skip = (dir: 1 | -1) => {
    if (!current) return;
    const i = tracks.findIndex((t) => t.trackId === current.trackId);
    const next = tracks[(i + dir + tracks.length) % tracks.length];
    if (next) play(next);
  };

  const cover = (t: Track) => t.artworkUrl100.replace("100x100", "300x300");

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Music className="h-4 w-4" />
        <span className="text-sm font-medium">Sonic</span>
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(q); }}
          className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10"
        >
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search any song or artist…"
            className="w-56 bg-transparent text-xs outline-none"
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading && <div className="text-center text-xs text-foreground/40">Loading…</div>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {tracks.map((t) => (
            <button key={t.trackId} onClick={() => play(t)}
              className="group flex flex-col gap-2 rounded-xl bg-white/[0.04] p-2 text-left ring-1 ring-white/5 transition hover:bg-white/10">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img src={cover(t)} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Play className="h-8 w-8 fill-white" />
                </div>
              </div>
              <div className="line-clamp-1 text-xs font-medium">{t.trackName}</div>
              <div className="line-clamp-1 text-[10px] text-foreground/50">{t.artistName}</div>
            </button>
          ))}
        </div>
        {tracks.length === 0 && !loading && (
          <div className="py-16 text-center text-xs text-foreground/40">No results. Try another search.</div>
        )}
      </div>

      {current && (
        <div className="border-t border-white/10 bg-black/40 p-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <img src={cover(current)} alt="" className="h-12 w-12 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-xs font-medium">{current.trackName}</div>
              <div className="line-clamp-1 text-[10px] text-foreground/50">{current.artistName}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => skip(-1)} className="rounded p-1.5 hover:bg-white/10"><SkipBack className="h-4 w-4" /></button>
              <button onClick={toggle} className="rounded-full bg-white p-2 text-black hover:bg-white/90">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={() => skip(1)} className="rounded p-1.5 hover:bg-white/10"><SkipForward className="h-4 w-4" /></button>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Volume2 className="h-3 w-3 text-foreground/50" />
              <input type="range" min={0} max={1} step={0.01} value={vol}
                onChange={(e) => { const v = +e.target.value; setVol(v); if (audioRef.current) audioRef.current.volume = v; }}
                className="h-1 w-20 accent-white" />
            </div>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-white transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-foreground/40">30-second previews · iTunes · free, no account</p>
          <audio
            ref={audioRef}
            onTimeUpdate={(e) => { const a = e.currentTarget; setProgress(a.duration ? a.currentTime / a.duration : 0); }}
            onEnded={() => skip(1)}
          />
        </div>
      )}
    </div>
  );
}
