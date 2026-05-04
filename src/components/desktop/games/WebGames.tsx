// Web games loaded from the gn-math/html repo (owner-permitted import).
// Each game is rendered inside an iframe routed through the existing
// /api/public/proxy so the source URL is hidden from inspect.
import { useEffect, useState } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { logActivity } from "@/lib/surveillance";
import { GameRating } from "./GameRating";

interface WebGame { id: string; name: string; url: string; thumb: string }

const cardGradient = (id: string) => {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 35%), hsl(${(h + 60) % 360} 70% 25%))`;
};

export function WebGames() {
  const [items, setItems] = useState<WebGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<WebGame | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/public/gn-math");
        const j = await r.json() as { items?: WebGame[] };
        if (alive) setItems(j.items ?? []);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = items.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()));

  if (active) {
    return (
      <div className="flex h-full flex-col bg-background/40">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <button onClick={() => setActive(null)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium">{active.name}</span>
          <div className="ml-auto"><GameRating gameId={active.id} /></div>
        </div>
        <iframe
          src={`/api/public/proxy?url=${encodeURIComponent(active.url)}`}
          className="flex-1 bg-black"
          allow="autoplay; fullscreen; gamepad; pointer-lock; clipboard-read; clipboard-write"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={active.name}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="text-sm font-medium">
          Games · {loading ? "loading…" : `${items.length} titles`}
        </span>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games"
            className="w-40 bg-transparent text-xs outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-foreground/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching game library…
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((g) => (
            <button key={g.id}
              onClick={() => { setActive(g); void logActivity("game.open", g.id, { name: g.name, source: "gn-math" }); }}
              className="group flex flex-col overflow-hidden rounded-xl bg-white/[0.04] text-left ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-white/20">
              <div className="flex aspect-video w-full items-center justify-center"
                style={{ background: cardGradient(g.id) }}>
                <span className="text-3xl font-black tracking-tighter text-white/85">
                  {g.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 p-2">
                <span className="line-clamp-1 text-xs font-medium">{g.name}</span>
                <GameRating gameId={g.id} compact />
              </div>
            </button>
          ))}
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-foreground/40">No games match your search.</div>
        )}
      </div>
    </div>
  );
}
