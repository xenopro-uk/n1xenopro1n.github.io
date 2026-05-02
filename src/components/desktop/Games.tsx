import { useMemo, useState } from "react";
import { Gamepad2, Search, ArrowLeft, Cpu, Globe } from "lucide-react";
import { GAMES, CATEGORIES, type GameDef, type EngineId } from "./games/data";
import {
  SnakeEngine, PongEngine, Game2048Engine, MemoryEngine, BreakoutEngine,
  TicTacToeEngine, FlappyEngine, ReactionEngine, TypingEngine, SimonEngine,
  WhackEngine, ClickerEngine, GuessEngine, DodgerEngine, RunnerEngine,
  Connect4Engine, MinesweeperEngine, TetrisEngine, Match3Engine,
  LightsOutEngine, HangmanEngine, RPSEngine,
} from "./games/engines";
import { logActivity } from "@/lib/surveillance";
import { WebGames } from "./games/WebGames";
import { GameRating } from "./games/GameRating";

const ENGINES: Record<EngineId, React.ComponentType<{ config: Record<string, number | string | boolean>; gameId: string }>> = {
  snake: SnakeEngine,
  pong: PongEngine,
  "2048": Game2048Engine,
  memory: MemoryEngine,
  breakout: BreakoutEngine,
  tictactoe: TicTacToeEngine,
  flappy: FlappyEngine,
  reaction: ReactionEngine,
  typing: TypingEngine,
  simon: SimonEngine,
  whack: WhackEngine,
  clicker: ClickerEngine,
  guess: GuessEngine,
  dodger: DodgerEngine,
  runner: RunnerEngine,
  connect4: Connect4Engine,
  minesweeper: MinesweeperEngine,
  tetris: TetrisEngine,
  match3: Match3Engine,
  lightsout: LightsOutEngine,
  hangman: HangmanEngine,
  rps: RPSEngine,
};

// Deterministic pastel-ish gradient per game so the cards look colorful
// without relying on external thumbnails.
const cardGradient = (id: string) => {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 35%), hsl(${(h + 60) % 360} 70% 25%))`;
};

export function Games() {
  const [active, setActive] = useState<GameDef | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [tab, setTab] = useState<"native" | "web">("native");

  const filtered = useMemo(() => GAMES.filter((g) =>
    (cat === "All" || g.category === cat) &&
    g.name.toLowerCase().includes(q.toLowerCase())
  ), [q, cat]);

  if (active) {
    const Engine = ENGINES[active.engine];
    return (
      <div className="flex h-full flex-col bg-background/40">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <button onClick={() => setActive(null)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium">{active.name}</span>
          <span className="ml-2 rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/50">
            {active.category}
          </span>
          <div className="ml-auto"><GameRating gameId={active.id} /></div>
        </div>
        <div className="flex-1 overflow-auto">
          <Engine config={active.config ?? {}} gameId={active.id} />
        </div>
      </div>
    );
  }

  if (tab === "web") {
    return (
      <div className="flex h-full flex-col bg-background/40">
        <TabStrip tab={tab} setTab={setTab} />
        <div className="flex-1 overflow-hidden"><WebGames /></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Gamepad2 className="h-4 w-4" />
        <span className="text-sm font-medium">Xeno's Arcade — {GAMES.length} games · in-site</span>
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
            <button key={g.id}
              onClick={() => { setActive(g); void logActivity("game.open", g.id, { name: g.name }); }}
              className="group flex flex-col overflow-hidden rounded-xl bg-white/[0.04] text-left ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-white/20">
              <div className="flex aspect-video w-full items-center justify-center"
                style={{ background: cardGradient(g.id) }}>
                <span className="text-3xl font-black tracking-tighter text-white/85">
                  {g.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 p-2">
                <span className="line-clamp-1 text-xs font-medium">{g.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-foreground/40">{g.category}</span>
                {g.blurb && <span className="line-clamp-1 text-[10px] text-foreground/50">{g.blurb}</span>}
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
