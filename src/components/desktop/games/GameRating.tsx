// Star rating for any game (in-site or web). Persists per-user in `game_ratings`.
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

interface RatingRow { user_id: string; stars: number }

export function GameRating({ gameId, compact = false }: { gameId: string; compact?: boolean }) {
  const { user } = useAccount();
  const [mine, setMine] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("game_ratings").select("user_id,stars").eq("game_id", gameId);
      if (!alive || !data) return;
      const rows = data as RatingRow[];
      setCount(rows.length);
      setAvg(rows.length ? rows.reduce((s, r) => s + r.stars, 0) / rows.length : 0);
      setMine(user ? (rows.find((r) => r.user_id === user.id)?.stars ?? 0) : 0);
    })();
    return () => { alive = false; };
  }, [gameId, user]);

  const rate = async (s: number) => {
    if (!user) return;
    const { error } = await supabase.from("game_ratings").upsert(
      { user_id: user.id, game_id: gameId, stars: s, updated_at: new Date().toISOString() },
      { onConflict: "user_id,game_id" },
    );
    if (error) return;
    const next = mine === 0 ? count + 1 : count;
    const prevSum = avg * count;
    const nextSum = mine === 0 ? prevSum + s : prevSum - mine + s;
    setCount(next); setAvg(next ? nextSum / next : 0); setMine(s);
  };

  const display = hover || mine || Math.round(avg);

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-foreground/50">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span>{avg ? avg.toFixed(1) : "—"}</span>
        <span className="text-foreground/30">({count})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[11px] text-foreground/60"
      onMouseLeave={() => setHover(0)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} disabled={!user}
            onMouseEnter={() => setHover(s)} onClick={(e) => { e.stopPropagation(); void rate(s); }}
            className="p-0.5 disabled:cursor-not-allowed">
            <Star className={`h-3.5 w-3.5 ${s <= display ? "fill-yellow-400 text-yellow-400" : "text-foreground/30"}`} />
          </button>
        ))}
      </div>
      <span>{avg ? avg.toFixed(1) : "—"} · {count} {count === 1 ? "rating" : "ratings"}</span>
      {!user && <span className="text-foreground/30">(sign in to rate)</span>}
    </div>
  );
}
