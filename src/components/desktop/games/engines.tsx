// All in-site game engines. Each is a small, self-contained React component
// that takes a `config` prop. No external assets — everything renders from
// canvas / JSX. This guarantees games can never be "stolen" by inspecting
// network requests.
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { logActivity } from "@/lib/surveillance";

type Cfg = Record<string, number | string | boolean>;
type EngineProps = { config: Cfg; gameId: string };

const num = (c: Cfg, k: string, d: number): number => (typeof c[k] === "number" ? c[k] as number : d);
const str = (c: Cfg, k: string, d: string): string => (typeof c[k] === "string" ? c[k] as string : d);
const bool = (c: Cfg, k: string, d: boolean): boolean => (typeof c[k] === "boolean" ? c[k] as boolean : d);

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="grid h-full w-full place-items-center bg-gradient-to-b from-black to-zinc-950 p-4">
    <div className="rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/10">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────── SNAKE ─────
export function SnakeEngine({ config, gameId }: EngineProps) {
  const grid = num(config, "grid", 20);
  const speed = num(config, "speed", 8);
  const walls = bool(config, "walls", false);
  const portal = bool(config, "portal", true) && !walls;
  const doubleFood = bool(config, "double", false);
  const theme = str(config, "theme", "default");
  const cell = 20;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const stateRef = useRef({
    snake: [{ x: 5, y: 5 }],
    dir: { x: 1, y: 0 },
    food: [{ x: 10, y: 10 }],
    grow: 0,
    over: false,
  });

  const reset = useCallback(() => {
    stateRef.current = {
      snake: [{ x: Math.floor(grid / 2), y: Math.floor(grid / 2) }],
      dir: { x: 1, y: 0 },
      food: doubleFood
        ? [{ x: 3, y: 3 }, { x: grid - 4, y: grid - 4 }]
        : [{ x: Math.floor(grid * 0.75), y: Math.floor(grid / 2) }],
      grow: 0, over: false,
    };
    setScore(0); setRunning(true);
  }, [grid, doubleFood]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const d = stateRef.current.dir;
      if ((k === "ArrowUp" || k === "w") && d.y !== 1) stateRef.current.dir = { x: 0, y: -1 };
      else if ((k === "ArrowDown" || k === "s") && d.y !== -1) stateRef.current.dir = { x: 0, y: 1 };
      else if ((k === "ArrowLeft" || k === "a") && d.x !== 1) stateRef.current.dir = { x: -1, y: 0 };
      else if ((k === "ArrowRight" || k === "d") && d.x !== -1) stateRef.current.dir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let id = 0;
    const tick = () => {
      const s = stateRef.current;
      if (!s.over && running) {
        const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
        if (portal) {
          head.x = (head.x + grid) % grid; head.y = (head.y + grid) % grid;
        } else if (head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid) {
          s.over = true;
        }
        if (!s.over && s.snake.some((p) => p.x === head.x && p.y === head.y)) s.over = true;
        if (!s.over) {
          s.snake.unshift(head);
          const fi = s.food.findIndex((f) => f.x === head.x && f.y === head.y);
          if (fi >= 0) {
            s.grow += 2; setScore((sc) => sc + 1);
            s.food[fi] = { x: Math.floor(Math.random() * grid), y: Math.floor(Math.random() * grid) };
          }
          if (s.grow > 0) s.grow -= 1; else s.snake.pop();
        }
      }
      // draw
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      s.food.forEach((f) => { ctx.fillStyle = "#f43f5e"; ctx.fillRect(f.x * cell + 2, f.y * cell + 2, cell - 4, cell - 4); });
      s.snake.forEach((p, i) => {
        ctx.fillStyle = theme === "rainbow" ? `hsl(${(i * 12) % 360} 80% 55%)`
          : theme === "neon" ? "#22d3ee" : "#10b981";
        ctx.fillRect(p.x * cell + 1, p.y * cell + 1, cell - 2, cell - 2);
      });
      if (s.over) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
      }
    };
    id = window.setInterval(tick, 1000 / speed);
    return () => clearInterval(id);
  }, [grid, speed, portal, running, theme]);

  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);

  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>Score: <b>{score}</b></span>
        <button onClick={reset} className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">Restart</button>
      </div>
      <canvas ref={canvasRef} width={grid * cell} height={grid * cell} className="rounded bg-black" />
      <p className="mt-2 text-center text-[10px] text-white/40">Arrow keys / WASD</p>
    </Frame>
  );
}

// ─────────────────────────────────────────────────────────── PONG ──────
export function PongEngine({ config, gameId }: EngineProps) {
  const aiSpeed = num(config, "ai", 0.7);
  const paddleH = num(config, "paddle", 80);
  const W = 480, H = 320;
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    ball: { x: W / 2, y: H / 2, vx: 4, vy: 2 },
    p1: H / 2 - paddleH / 2, p2: H / 2 - paddleH / 2,
    s1: 0, s2: 0,
  });
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const d = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);

  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      // input
      if (keys.current["w"] || keys.current["arrowup"]) s.p1 = Math.max(0, s.p1 - 6);
      if (keys.current["s"] || keys.current["arrowdown"]) s.p1 = Math.min(H - paddleH, s.p1 + 6);
      // AI
      const target = s.ball.y - paddleH / 2;
      s.p2 += (target - s.p2) * 0.15 * aiSpeed;
      s.p2 = Math.max(0, Math.min(H - paddleH, s.p2));
      // ball
      s.ball.x += s.ball.vx; s.ball.y += s.ball.vy;
      if (s.ball.y < 0 || s.ball.y > H) s.ball.vy *= -1;
      if (s.ball.x < 20 && s.ball.y > s.p1 && s.ball.y < s.p1 + paddleH) { s.ball.vx = Math.abs(s.ball.vx) * 1.05; }
      if (s.ball.x > W - 20 && s.ball.y > s.p2 && s.ball.y < s.p2 + paddleH) { s.ball.vx = -Math.abs(s.ball.vx) * 1.05; }
      if (s.ball.x < 0) { s.s2++; s.ball = { x: W / 2, y: H / 2, vx: 4, vy: 2 }; }
      if (s.ball.x > W) { s.s1++; s.ball = { x: W / 2, y: H / 2, vx: -4, vy: 2 }; }
      // draw
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, s.p1, 10, paddleH);
      ctx.fillRect(W - 20, s.p2, 10, paddleH);
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.font = "20px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${s.s1}   ${s.s2}`, W / 2, 30);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [aiSpeed, paddleH]);

  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);

  return (
    <Frame>
      <canvas ref={ref} width={W} height={H} className="rounded bg-black" />
      <p className="mt-2 text-center text-[10px] text-white/40">W / S or ↑ / ↓</p>
    </Frame>
  );
}

// ─────────────────────────────────────────────────────────── 2048 ──────
export function Game2048Engine({ config, gameId }: EngineProps) {
  const N = num(config, "size", 4);
  const goal = num(config, "goal", 2048);
  const [board, setBoard] = useState<number[][]>(() => addRandom(addRandom(empty(N))));
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  function empty(n: number): number[][] { return Array.from({ length: n }, () => Array(n).fill(0)); }
  function addRandom(b: number[][]): number[][] {
    const empties: [number, number][] = [];
    b.forEach((row, i) => row.forEach((v, j) => v === 0 && empties.push([i, j])));
    if (!empties.length) return b;
    const [i, j] = empties[Math.floor(Math.random() * empties.length)];
    const nb = b.map((r) => [...r]); nb[i][j] = Math.random() < 0.9 ? 2 : 4; return nb;
  }
  function slide(row: number[]): { row: number[]; gained: number } {
    const arr = row.filter((v) => v !== 0);
    let gained = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; gained += arr[i]; arr.splice(i + 1, 1); }
    }
    while (arr.length < row.length) arr.push(0);
    return { row: arr, gained };
  }
  function move(dir: "l" | "r" | "u" | "d") {
    const transposed = (b: number[][]) => b[0].map((_, j) => b.map((r) => r[j]));
    let b = board.map((r) => [...r]);
    let total = 0;
    if (dir === "u" || dir === "d") b = transposed(b);
    if (dir === "r" || dir === "d") b = b.map((r) => r.reverse());
    b = b.map((r) => { const { row, gained } = slide(r); total += gained; return row; });
    if (dir === "r" || dir === "d") b = b.map((r) => r.reverse());
    if (dir === "u" || dir === "d") b = transposed(b);
    if (JSON.stringify(b) !== JSON.stringify(board)) {
      const next = addRandom(b);
      setBoard(next); setScore((s) => s + total);
      if (next.flat().some((v) => v >= goal)) setWon(true);
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move("l"); else if (e.key === "ArrowRight") move("r");
      else if (e.key === "ArrowUp") move("u"); else if (e.key === "ArrowDown") move("d");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);

  const colors: Record<number, string> = {
    0: "#1f1f23", 2: "#374151", 4: "#4b5563", 8: "#f59e0b", 16: "#f97316", 32: "#ef4444",
    64: "#dc2626", 128: "#facc15", 256: "#eab308", 512: "#84cc16", 1024: "#22c55e", 2048: "#10b981",
  };
  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>Score: <b>{score}</b> · Goal: {goal}</span>
        {won && <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">You won!</span>}
        <button onClick={() => { setBoard(addRandom(addRandom(empty(N)))); setScore(0); setWon(false); }}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">New</button>
      </div>
      <div className="grid gap-1 rounded bg-black/40 p-1" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {board.flat().map((v, i) => (
          <div key={i} className="grid h-14 w-14 place-items-center rounded text-sm font-bold"
            style={{ background: colors[v] || "#10b981", color: v <= 4 ? "#cbd5e1" : "#fff" }}>
            {v || ""}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-white/40">Arrow keys</p>
    </Frame>
  );
}

// ───────────────────────────────────────────────────────── MEMORY ──────
export function MemoryEngine({ config, gameId }: EngineProps) {
  const pairs = num(config, "pairs", 8);
  const theme = str(config, "theme", "emoji");
  const symbols = useMemo(() => {
    const emoji = ["🍎","🍌","🍒","🍇","🍉","🍍","🥝","🍑","🍓","🥭","🍋","🥥","🥑","🍐","🍊","🥕","🌶️","🍅","🌽","🍆","🥒","🍔","🍕","🌮"];
    const flag = ["🇺🇸","🇬🇧","🇫🇷","🇩🇪","🇯🇵","🇨🇦","🇧🇷","🇨🇳","🇮🇳","🇰🇷","🇲🇽","🇦🇷","🇪🇸","🇮🇹","🇷🇺","🇿🇦","🇦🇺","🇪🇬","🇹🇷","🇸🇪","🇳🇴","🇫🇮","🇬🇷","🇵🇹"];
    return (theme === "flag" ? flag : emoji).slice(0, pairs);
  }, [pairs, theme]);
  const [cards, setCards] = useState<{ s: string; flipped: boolean; matched: boolean }[]>([]);
  const [picks, setPicks] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const reset = useCallback(() => {
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5)
      .map((s) => ({ s, flipped: false, matched: false }));
    setCards(deck); setPicks([]); setMoves(0);
  }, [symbols]);

  useEffect(() => { reset(); }, [reset]);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);

  const click = (i: number) => {
    if (picks.length === 2 || cards[i].flipped) return;
    const next = cards.map((c, j) => j === i ? { ...c, flipped: true } : c);
    const np = [...picks, i];
    setCards(next); setPicks(np);
    if (np.length === 2) {
      setMoves((m) => m + 1);
      setTimeout(() => {
        setCards((cs) => {
          const a = cs[np[0]], b = cs[np[1]];
          if (a.s === b.s) return cs.map((c, j) => np.includes(j) ? { ...c, matched: true } : c);
          return cs.map((c, j) => np.includes(j) ? { ...c, flipped: false } : c);
        });
        setPicks([]);
      }, 700);
    }
  };

  const cols = Math.ceil(Math.sqrt(pairs * 2));
  const allMatched = cards.length > 0 && cards.every((c) => c.matched);

  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>Moves: <b>{moves}</b></span>
        {allMatched && <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Cleared!</span>}
        <button onClick={reset} className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">New</button>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((c, i) => (
          <button key={i} onClick={() => click(i)}
            className={`grid h-12 w-12 place-items-center rounded text-2xl transition ${
              c.flipped || c.matched ? "bg-white text-black" : "bg-zinc-800 text-zinc-800 hover:bg-zinc-700"
            }`}>
            {(c.flipped || c.matched) ? c.s : "?"}
          </button>
        ))}
      </div>
    </Frame>
  );
}

// ─────────────────────────────────────────────────────── BREAKOUT ──────
export function BreakoutEngine({ config, gameId }: EngineProps) {
  const paddleW = num(config, "paddle", 80);
  const speed = num(config, "speed", 1);
  const rows = num(config, "rows", 5);
  const W = 480, H = 360;
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    paddleX: W / 2 - paddleW / 2,
    ball: { x: W / 2, y: H - 40, vx: 3 * speed, vy: -3 * speed },
    bricks: [] as { x: number; y: number; alive: boolean }[],
    score: 0, over: false,
  });
  const cols = 8;
  const reset = useCallback(() => {
    const bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      bricks.push({ x: c * 56 + 16, y: r * 22 + 30, alive: true });
    state.current = {
      paddleX: W / 2 - paddleW / 2,
      ball: { x: W / 2, y: H - 40, vx: 3 * speed, vy: -3 * speed },
      bricks, score: 0, over: false,
    };
  }, [rows, paddleW, speed]);

  useEffect(() => { reset(); }, [reset]);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);

  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      state.current.paddleX = Math.max(0, Math.min(W - paddleW, e.clientX - rect.left - paddleW / 2));
    };
    c.addEventListener("mousemove", onMove);
    let raf = 0;
    const loop = () => {
      const s = state.current;
      if (!s.over) {
        s.ball.x += s.ball.vx; s.ball.y += s.ball.vy;
        if (s.ball.x < 5 || s.ball.x > W - 5) s.ball.vx *= -1;
        if (s.ball.y < 5) s.ball.vy *= -1;
        if (s.ball.y > H - 20 && s.ball.x > s.paddleX && s.ball.x < s.paddleX + paddleW) {
          s.ball.vy = -Math.abs(s.ball.vy);
          s.ball.vx += (s.ball.x - (s.paddleX + paddleW / 2)) * 0.04;
        }
        if (s.ball.y > H) s.over = true;
        s.bricks.forEach((b) => {
          if (!b.alive) return;
          if (s.ball.x > b.x && s.ball.x < b.x + 50 && s.ball.y > b.y && s.ball.y < b.y + 18) {
            b.alive = false; s.ball.vy *= -1; s.score++;
          }
        });
      }
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      s.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = `hsl(${(b.y * 3) % 360} 65% 55%)`;
        ctx.fillRect(b.x, b.y, 50, 18);
      });
      ctx.fillStyle = "#fff"; ctx.fillRect(s.paddleX, H - 18, paddleW, 8);
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = "14px sans-serif"; ctx.fillText(`Score: ${s.score}`, 10, 18);
      if (s.over) { ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Game Over", W / 2, H / 2); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { c.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [paddleW]);

  return (
    <Frame>
      <canvas ref={ref} width={W} height={H} className="cursor-none rounded bg-black" />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] text-white/40">Move mouse to control paddle</p>
        <button onClick={reset} className="rounded bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20">Restart</button>
      </div>
    </Frame>
  );
}

// ──────────────────────────────────────────────────── TIC TAC TOE ──────
export function TicTacToeEngine({ config, gameId }: EngineProps) {
  const aiMode = str(config, "ai", "minimax");
  const [board, setBoard] = useState<("X" | "O" | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const winner = checkWin(board);
  function checkWin(b: ("X" | "O" | null)[]): "X" | "O" | "draw" | null {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b1, c] of lines) if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    return b.every(Boolean) ? "draw" : null;
  }
  function aiMove(b: ("X" | "O" | null)[]): number {
    const available = b.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
    if (aiMode === "random") return available[Math.floor(Math.random() * available.length)];
    // minimax
    const score = (b: ("X" | "O" | null)[], depth: number, isMax: boolean): number => {
      const w = checkWin(b);
      if (w === "O") return 10 - depth; if (w === "X") return depth - 10; if (w === "draw") return 0;
      let best = isMax ? -Infinity : Infinity;
      b.forEach((v, i) => {
        if (v) return;
        const nb = [...b]; nb[i] = isMax ? "O" : "X";
        const s = score(nb, depth + 1, !isMax);
        best = isMax ? Math.max(best, s) : Math.min(best, s);
      });
      return best;
    };
    let best = -Infinity, move = available[0];
    available.forEach((i) => {
      const nb = [...b]; nb[i] = "O";
      const s = score(nb, 0, false);
      if (s > best) { best = s; move = i; }
    });
    return move;
  }
  const click = (i: number) => {
    if (board[i] || winner) return;
    const nb = [...board]; nb[i] = turn;
    if (aiMode === "none") {
      setBoard(nb); setTurn(turn === "X" ? "O" : "X"); return;
    }
    setBoard(nb);
    if (!checkWin(nb)) {
      setTimeout(() => {
        const m = aiMove(nb); if (m === undefined) return;
        const nb2 = [...nb]; nb2[m] = "O"; setBoard(nb2);
      }, 250);
    }
  };
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  return (
    <Frame>
      <div className="mb-2 text-center text-xs">
        {winner ? (winner === "draw" ? "Draw!" : `${winner} wins!`) : `Turn: ${turn}`}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {board.map((v, i) => (
          <button key={i} onClick={() => click(i)}
            className="grid h-20 w-20 place-items-center rounded bg-zinc-800 text-3xl font-bold hover:bg-zinc-700">
            {v}
          </button>
        ))}
      </div>
      <button onClick={() => { setBoard(Array(9).fill(null)); setTurn("X"); }}
        className="mt-3 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">New game</button>
    </Frame>
  );
}

// ───────────────────────────────────────────────────────── FLAPPY ──────
export function FlappyEngine({ config, gameId }: EngineProps) {
  const gap = num(config, "gap", 140);
  const theme = str(config, "theme", "day");
  const W = 360, H = 480;
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ y: H / 2, vy: 0, pipes: [] as { x: number; top: number }[], score: 0, over: false, t: 0 });
  const reset = useCallback(() => { state.current = { y: H / 2, vy: 0, pipes: [], score: 0, over: false, t: 0 }; }, []);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    const flap = () => { if (state.current.over) reset(); else state.current.vy = -7; };
    c.addEventListener("click", flap);
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space") flap(); };
    window.addEventListener("keydown", onKey);
    let raf = 0;
    const loop = () => {
      const s = state.current; s.t++;
      if (!s.over) {
        s.vy += 0.4; s.y += s.vy;
        if (s.t % 90 === 0) s.pipes.push({ x: W, top: 50 + Math.random() * (H - gap - 100) });
        s.pipes.forEach((p) => p.x -= 2);
        s.pipes = s.pipes.filter((p) => p.x > -60);
        s.pipes.forEach((p) => {
          if (p.x < 60 && p.x > 50) s.score++;
          if (60 > p.x && 60 < p.x + 60 && (s.y < p.top || s.y > p.top + gap)) s.over = true;
        });
        if (s.y > H || s.y < 0) s.over = true;
      }
      ctx.fillStyle = theme === "night" ? "#0c1224" : "#0ea5e9"; ctx.fillRect(0, 0, W, H);
      s.pipes.forEach((p) => {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(p.x, 0, 60, p.top);
        ctx.fillRect(p.x, p.top + gap, 60, H - p.top - gap);
      });
      ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(60, s.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText(String(s.score), W / 2, 40);
      if (s.over) { ctx.font = "bold 26px sans-serif"; ctx.fillText("Click to retry", W / 2, H / 2); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { c.removeEventListener("click", flap); window.removeEventListener("keydown", onKey); cancelAnimationFrame(raf); };
  }, [gap, theme, reset]);
  return <Frame><canvas ref={ref} width={W} height={H} className="rounded" /><p className="mt-2 text-center text-[10px] text-white/40">Click or Space to flap</p></Frame>;
}

// ────────────────────────────────────────────────────── REACTION ──────
export function ReactionEngine({ config, gameId }: EngineProps) {
  const mode = str(config, "mode", "classic");
  const [phase, setPhase] = useState<"wait" | "go" | "done">("wait");
  const [start, setStart] = useState(0);
  const [time, setTime] = useState(0);
  const [aim, setAim] = useState({ x: 50, y: 50 });
  const [color, setColor] = useState<"red" | "blue" | "green" | "yellow">("red");
  const reset = useCallback(() => {
    setPhase("wait"); setTime(0);
    const delay = 800 + Math.random() * 2000;
    setTimeout(() => {
      if (mode === "color") setColor(["red","blue","green","yellow"][Math.floor(Math.random()*4)] as "red");
      if (mode === "aim") setAim({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
      setStart(performance.now()); setPhase("go");
    }, delay);
  }, [mode]);
  useEffect(() => { reset(); }, [reset]);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  const click = () => {
    if (phase === "go") { setTime(performance.now() - start); setPhase("done"); }
    else if (phase === "done") reset();
  };
  return (
    <Frame>
      <div onClick={click}
        className={`grid h-72 w-72 cursor-pointer place-items-center rounded-xl text-center text-lg font-bold ${
          phase === "wait" ? "bg-red-600" : phase === "go" ? "bg-emerald-500" : "bg-zinc-800"
        }`}>
        {phase === "wait" && "Wait…"}
        {phase === "go" && (mode === "aim"
          ? <button style={{ position: "absolute", left: `${aim.x}%`, top: `${aim.y}%` }}
              className="h-10 w-10 rounded-full bg-white text-black">⊕</button>
          : `Click! ${mode === "color" ? `(${color})` : ""}`)}
        {phase === "done" && `${time.toFixed(0)} ms · click to retry`}
      </div>
    </Frame>
  );
}

// ─────────────────────────────────────────────────────── TYPING ──────
export function TypingEngine({ config, gameId }: EngineProps) {
  const seconds = num(config, "seconds", 30);
  const sample = "the quick brown fox jumps over the lazy dog while a curious cat watches from a sunlit window the river ran wide and bright through fields of golden grain a small boat drifted past as the mountains rose silent in the distance".repeat(2);
  const [input, setInput] = useState("");
  const [time, setTime] = useState(seconds);
  const [done, setDone] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => {
    if (!start || done) return;
    const id = setInterval(() => setTime((t) => {
      if (t <= 1) { setDone(true); clearInterval(id); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [start, done]);
  const correct = input.split("").filter((c, i) => c === sample[i]).length;
  const wpm = start && (seconds - time) > 0 ? Math.round((correct / 5) / ((seconds - time) / 60)) : 0;
  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>Time: <b>{time}s</b></span><span>WPM: <b>{wpm}</b></span>
      </div>
      <div className="mb-2 max-h-40 w-96 overflow-hidden rounded bg-black/40 p-3 font-mono text-sm leading-relaxed">
        {sample.slice(0, 200).split("").map((ch, i) => {
          const typed = input[i];
          const cls = typed === undefined ? "text-white/40"
            : typed === ch ? "text-emerald-400" : "text-red-400 underline";
          return <span key={i} className={cls}>{ch}</span>;
        })}
      </div>
      <input value={input} disabled={done} autoFocus
        onChange={(e) => { if (!start) setStart(performance.now()); setInput(e.target.value); }}
        className="w-96 rounded bg-zinc-800 px-3 py-2 font-mono text-sm outline-none ring-1 ring-white/10" />
      {done && <button onClick={() => { setInput(""); setTime(seconds); setDone(false); setStart(null); }}
        className="mt-2 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">Restart</button>}
    </Frame>
  );
}

// ──────────────────────────────────────────────────────── SIMON ──────
export function SimonEngine({ config, gameId }: EngineProps) {
  const baseSpeed = num(config, "speed", 1);
  const startLen = num(config, "start", 1);
  const [seq, setSeq] = useState<number[]>([]);
  const [user, setUser] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [showing, setShowing] = useState(false);
  const colors = ["#ef4444","#22c55e","#3b82f6","#eab308"];
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  const start = useCallback(() => {
    const init = Array.from({ length: startLen }, () => Math.floor(Math.random() * 4));
    setSeq(init); setUser([]); setOver(false);
  }, [startLen]);
  useEffect(() => { start(); }, [start]);
  useEffect(() => {
    if (!seq.length) return;
    setShowing(true); let i = 0;
    const id = setInterval(() => {
      if (i >= seq.length) { clearInterval(id); setActive(null); setShowing(false); return; }
      setActive(seq[i]); setTimeout(() => setActive(null), 300 / baseSpeed);
      i++;
    }, 600 / baseSpeed);
    return () => clearInterval(id);
  }, [seq, baseSpeed]);
  const press = (n: number) => {
    if (showing || over) return;
    const nu = [...user, n];
    if (seq[nu.length - 1] !== n) { setOver(true); return; }
    setUser(nu);
    if (nu.length === seq.length) { setTimeout(() => { setSeq([...seq, Math.floor(Math.random() * 4)]); setUser([]); }, 600); }
  };
  return (
    <Frame>
      <div className="mb-2 text-center text-xs">Length: <b>{seq.length}</b> {over && "· Game over"}</div>
      <div className="grid grid-cols-2 gap-2">
        {colors.map((c, i) => (
          <button key={i} onClick={() => press(i)} disabled={showing || over}
            className="h-24 w-24 rounded-xl transition"
            style={{ background: c, opacity: active === i ? 1 : 0.55 }} />
        ))}
      </div>
      {over && <button onClick={start} className="mt-3 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">Restart</button>}
    </Frame>
  );
}

// ───────────────────────────────────────────────────────── WHACK ──────
export function WhackEngine({ config, gameId }: EngineProps) {
  const speed = num(config, "speed", 1);
  const size = num(config, "size", 3);
  const [active, setActive] = useState(-1);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => {
    const a = setInterval(() => setActive(Math.floor(Math.random() * size * size)), 800 / speed);
    const t = setInterval(() => setTime((tt) => Math.max(0, tt - 1)), 1000);
    return () => { clearInterval(a); clearInterval(t); };
  }, [speed, size]);
  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>Score: <b>{score}</b></span><span>Time: <b>{time}s</b></span>
        {time === 0 && <button onClick={() => { setScore(0); setTime(30); }}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">Restart</button>}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {Array.from({ length: size * size }).map((_, i) => (
          <button key={i} disabled={time === 0}
            onClick={() => { if (i === active) { setScore((s) => s + 1); setActive(-1); } }}
            className={`grid h-16 w-16 place-items-center rounded-full text-2xl ${
              i === active ? "bg-amber-500" : "bg-zinc-800"
            }`}>
            {i === active ? "🐹" : ""}
          </button>
        ))}
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────── CLICKER ──────
export function ClickerEngine({ config, gameId }: EngineProps) {
  const theme = str(config, "theme", "default");
  const [count, setCount] = useState(0);
  const [pps, setPps] = useState(0);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => { const id = setInterval(() => setCount((c) => c + pps), 1000); return () => clearInterval(id); }, [pps]);
  const icon = theme === "coin" ? "🪙" : theme === "pixel" ? "🟦" : "🍪";
  return (
    <Frame>
      <div className="text-center">
        <div className="mb-3 text-4xl font-bold">{Math.floor(count)}</div>
        <button onClick={() => setCount((c) => c + 1)}
          className="grid h-32 w-32 place-items-center rounded-full bg-amber-600 text-7xl transition hover:scale-105 active:scale-95">
          {icon}
        </button>
        <div className="mt-4 grid gap-2">
          {[
            { name: "Auto +1/s", cost: 50, gain: 1 },
            { name: "Auto +5/s", cost: 250, gain: 5 },
            { name: "Auto +25/s", cost: 1500, gain: 25 },
          ].map((u) => (
            <button key={u.name} disabled={count < u.cost}
              onClick={() => { setCount((c) => c - u.cost); setPps((p) => p + u.gain); }}
              className="rounded bg-zinc-800 px-3 py-1 text-xs disabled:opacity-40 enabled:hover:bg-zinc-700">
              {u.name} ({u.cost})
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-white/40">+{pps}/s</p>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────── GUESS ──────
export function GuessEngine({ config, gameId }: EngineProps) {
  const max = num(config, "max", 100);
  const [target, setTarget] = useState(() => Math.floor(Math.random() * max) + 1);
  const [g, setG] = useState("");
  const [hint, setHint] = useState("");
  const [tries, setTries] = useState(0);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  const guess = () => {
    const n = parseInt(g, 10); if (isNaN(n)) return;
    setTries((t) => t + 1);
    if (n === target) setHint(`Correct! ${tries + 1} tries.`);
    else setHint(n < target ? "Higher ↑" : "Lower ↓");
  };
  return (
    <Frame>
      <div className="text-center">
        <div className="mb-2 text-sm">Guess a number 1–{max}</div>
        <input value={g} onChange={(e) => setG(e.target.value)}
          className="w-40 rounded bg-zinc-800 px-3 py-2 text-center text-lg outline-none" />
        <button onClick={guess} className="ml-2 rounded bg-white px-3 py-2 text-sm text-black">Guess</button>
        <div className="mt-3 text-sm">{hint}</div>
        <div className="mt-2 text-xs text-white/40">Tries: {tries}</div>
        <button onClick={() => { setTarget(Math.floor(Math.random() * max) + 1); setG(""); setHint(""); setTries(0); }}
          className="mt-3 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">New game</button>
      </div>
    </Frame>
  );
}

// ──────────────────────────────────────────────────────── DODGER ──────
export function DodgerEngine({ config, gameId }: EngineProps) {
  const speed = num(config, "speed", 1);
  const density = num(config, "density", 1);
  const hp = num(config, "hp", 1);
  const W = 360, H = 480;
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ x: W / 2, lives: hp, score: 0, rocks: [] as { x: number; y: number; v: number }[], over: false, t: 0 });
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      state.current.x = Math.max(15, Math.min(W - 15, e.clientX - rect.left));
    };
    c.addEventListener("mousemove", onMove);
    let raf = 0;
    const loop = () => {
      const s = state.current; s.t++;
      if (!s.over) {
        if (s.t % Math.max(8, 25 / density) === 0)
          s.rocks.push({ x: Math.random() * W, y: -10, v: 2 + Math.random() * 3 * speed });
        s.rocks.forEach((r) => r.y += r.v);
        s.rocks = s.rocks.filter((r) => {
          if (r.y > H) { s.score++; return false; }
          if (Math.abs(r.x - s.x) < 18 && Math.abs(r.y - (H - 30)) < 18) {
            s.lives--; if (s.lives <= 0) s.over = true;
            return false;
          }
          return true;
        });
      }
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#10b981"; ctx.fillRect(s.x - 15, H - 40, 30, 20);
      ctx.fillStyle = "#f87171"; s.rocks.forEach((r) => { ctx.beginPath(); ctx.arc(r.x, r.y, 8, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.fillText(`Score: ${s.score} · Lives: ${s.lives}`, 10, 18);
      if (s.over) { ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Game Over", W / 2, H / 2); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { c.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [speed, density, hp]);
  return <Frame><canvas ref={ref} width={W} height={H} className="cursor-none rounded" /><p className="mt-2 text-center text-[10px] text-white/40">Mouse to move</p></Frame>;
}

// ──────────────────────────────────────────────────────── RUNNER ──────
export function RunnerEngine({ config, gameId }: EngineProps) {
  const speed = num(config, "speed", 1);
  const theme = str(config, "theme", "day");
  const W = 480, H = 200;
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ y: H - 40, vy: 0, obs: [] as number[], score: 0, over: false, t: 0 });
  const jump = () => { if (state.current.y >= H - 40) state.current.vy = -10; };
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space") { if (state.current.over) reset(); else jump(); } };
    const reset = () => { state.current = { y: H - 40, vy: 0, obs: [], score: 0, over: false, t: 0 }; };
    window.addEventListener("keydown", onKey);
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const s = state.current; s.t++;
      if (!s.over) {
        s.vy += 0.6; s.y = Math.min(H - 40, s.y + s.vy);
        if (s.t % Math.floor(80 / speed) === 0) s.obs.push(W);
        s.obs = s.obs.map((o) => o - 5 * speed).filter((o) => o > -20);
        s.obs.forEach((o) => {
          if (o < 50 && o > 20 && s.y > H - 50) s.over = true;
          if (o < 30 && o > 25) s.score++;
        });
      }
      ctx.fillStyle = theme === "night" ? "#0c1224" : "#1f2937"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, H - 20, W, 20);
      ctx.fillStyle = "#22c55e"; ctx.fillRect(20, s.y - 20, 30, 30);
      ctx.fillStyle = "#ef4444"; s.obs.forEach((o) => ctx.fillRect(o, H - 40, 10, 20));
      ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.fillText(`Score: ${s.score}`, 10, 18);
      if (s.over) { ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Press Space", W / 2, H / 2); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(raf); };
  }, [speed, theme]);
  return <Frame><canvas ref={ref} width={W} height={H} onClick={jump} className="rounded" /><p className="mt-2 text-center text-[10px] text-white/40">Space or click to jump</p></Frame>;
}

// ──────────────────────────────────────────────────── CONNECT 4 ──────
export function Connect4Engine({ config, gameId }: EngineProps) {
  const ai = str(config, "ai", "smart");
  const R = 6, C = 7;
  const [board, setBoard] = useState<(0 | 1 | 2)[][]>(Array.from({ length: R }, () => Array(C).fill(0)));
  const [turn, setTurn] = useState<1 | 2>(1);
  const win = checkWin(board);
  function checkWin(b: (0 | 1 | 2)[][]): 0 | 1 | 2 {
    for (let r = 0; r < R; r++) for (let cc = 0; cc < C; cc++) {
      const v = b[r][cc]; if (!v) continue;
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        let k = 1;
        while (k < 4 && b[r + dr * k]?.[cc + dc * k] === v) k++;
        if (k === 4) return v;
      }
    } return 0;
  }
  const drop = (col: number, who: 1 | 2): (0 | 1 | 2)[][] | null => {
    for (let r = R - 1; r >= 0; r--) {
      if (board[r][col] === 0) { const nb = board.map((row) => [...row]); nb[r][col] = who; return nb; }
    } return null;
  };
  const click = (col: number) => {
    if (win) return;
    const nb = drop(col, 1); if (!nb) return; setBoard(nb); setTurn(2);
    if (!checkWin(nb)) setTimeout(() => {
      const cols = Array.from({ length: C }, (_, i) => i).filter((i) => nb[0][i] === 0);
      if (!cols.length) return;
      const move = ai === "smart"
        ? cols.find((c) => { const test = nb.map((r) => [...r]); for (let r = R-1; r>=0; r--) if (test[r][c] === 0) { test[r][c] = 2; break; } return checkWin(test) === 2; }) ?? cols[Math.floor(Math.random() * cols.length)]
        : cols[Math.floor(Math.random() * cols.length)];
      const nb2 = (() => { const t = nb.map((r) => [...r]); for (let r = R-1; r>=0; r--) if (t[r][move] === 0) { t[r][move] = 2; break; } return t; })();
      setBoard(nb2); setTurn(1);
    }, 250);
  };
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  return (
    <Frame>
      <div className="mb-2 text-center text-xs">{win ? `${win === 1 ? "You" : "AI"} wins!` : `Turn: ${turn === 1 ? "You" : "AI"}`}</div>
      <div className="rounded bg-blue-700 p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${C}, 1fr)` }}>
          {board.flat().map((v, i) => {
            const col = i % C;
            return (
              <button key={i} onClick={() => click(col)} disabled={!!win || turn !== 1}
                className="grid h-8 w-8 place-items-center rounded-full bg-blue-900">
                {v === 1 && <span className="block h-6 w-6 rounded-full bg-red-500" />}
                {v === 2 && <span className="block h-6 w-6 rounded-full bg-yellow-400" />}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={() => { setBoard(Array.from({ length: R }, () => Array(C).fill(0))); setTurn(1); }}
        className="mt-3 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">New game</button>
    </Frame>
  );
}

// ─────────────────────────────────────────────────── MINESWEEPER ──────
export function MinesweeperEngine({ config, gameId }: EngineProps) {
  const N = num(config, "size", 9);
  const M = num(config, "mines", 10);
  const [board, setBoard] = useState<{ mine: boolean; revealed: boolean; flag: boolean; n: number }[][]>([]);
  const [over, setOver] = useState<"" | "lost" | "won">("");
  const reset = useCallback(() => {
    const b = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ mine: false, revealed: false, flag: false, n: 0 })));
    let placed = 0;
    while (placed < M) {
      const r = Math.floor(Math.random() * N), c = Math.floor(Math.random() * N);
      if (!b[r][c].mine) { b[r][c].mine = true; placed++; }
    }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (b[r][c].mine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++)
        if (b[r + dr]?.[c + dc]?.mine) n++;
      b[r][c].n = n;
    }
    setBoard(b); setOver("");
  }, [N, M]);
  useEffect(() => { reset(); }, [reset]);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  const reveal = (r: number, c: number) => {
    if (over || board[r][c].revealed || board[r][c].flag) return;
    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    const flood = (r: number, c: number) => {
      if (b[r]?.[c] === undefined || b[r][c].revealed || b[r][c].flag) return;
      b[r][c].revealed = true;
      if (b[r][c].n === 0 && !b[r][c].mine)
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) flood(r + dr, c + dc);
    };
    if (b[r][c].mine) { b.forEach((row) => row.forEach((cell) => { if (cell.mine) cell.revealed = true; })); setBoard(b); setOver("lost"); return; }
    flood(r, c);
    const safeLeft = b.flat().filter((cell) => !cell.mine && !cell.revealed).length;
    setBoard(b); if (!safeLeft) setOver("won");
  };
  const flag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault(); if (over || board[r][c].revealed) return;
    const b = board.map((row) => row.map((cell) => ({ ...cell }))); b[r][c].flag = !b[r][c].flag; setBoard(b);
  };
  const colors = ["#fff","#3b82f6","#22c55e","#ef4444","#a855f7","#f59e0b","#06b6d4","#ec4899","#94a3b8"];
  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>{N}×{N} · {M} mines</span>
        <span>{over === "lost" ? "💥" : over === "won" ? "🎉" : ""}</span>
        <button onClick={reset} className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">New</button>
      </div>
      <div className="grid gap-px bg-black/40 p-px" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {board.flat().map((cell, i) => {
          const r = Math.floor(i / N), c = i % N;
          return (
            <button key={i} onClick={() => reveal(r, c)} onContextMenu={(e) => flag(e, r, c)}
              className={`grid h-7 w-7 place-items-center text-xs font-bold ${
                cell.revealed ? "bg-zinc-700" : "bg-zinc-500 hover:bg-zinc-400"
              }`}>
              {cell.flag && !cell.revealed && "🚩"}
              {cell.revealed && cell.mine && "💣"}
              {cell.revealed && !cell.mine && cell.n > 0 && <span style={{ color: colors[cell.n] }}>{cell.n}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-white/40">Right-click to flag</p>
    </Frame>
  );
}

// ──────────────────────────────────────────────────────── TETRIS ──────
export function TetrisEngine({ config, gameId }: EngineProps) {
  const W = num(config, "width", 10);
  const H = num(config, "height", 20);
  const speed = num(config, "speed", 1);
  const cell = 22;
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    grid: Array.from({ length: H }, () => Array(W).fill(0)),
    piece: null as null | { x: number; y: number; shape: number[][]; color: string },
    score: 0, over: false, t: 0,
  });
  const PIECES: { shape: number[][]; color: string }[] = [
    { shape: [[1,1,1,1]], color: "#22d3ee" },
    { shape: [[1,1],[1,1]], color: "#facc15" },
    { shape: [[0,1,0],[1,1,1]], color: "#a855f7" },
    { shape: [[1,0,0],[1,1,1]], color: "#3b82f6" },
    { shape: [[0,0,1],[1,1,1]], color: "#f97316" },
    { shape: [[0,1,1],[1,1,0]], color: "#22c55e" },
    { shape: [[1,1,0],[0,1,1]], color: "#ef4444" },
  ];
  const spawn = () => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    state.current.piece = { x: Math.floor(W / 2) - 1, y: 0, shape: p.shape, color: p.color };
    if (collide(state.current.piece, state.current.grid)) state.current.over = true;
  };
  const collide = (p: NonNullable<typeof state.current.piece>, g: number[][]) => {
    for (let r = 0; r < p.shape.length; r++) for (let c = 0; c < p.shape[0].length; c++) {
      if (!p.shape[r][c]) continue;
      const x = p.x + c, y = p.y + r;
      if (x < 0 || x >= W || y >= H) return true;
      if (y >= 0 && g[y][x]) return true;
    } return false;
  };
  const merge = () => {
    const p = state.current.piece!; const g = state.current.grid.map((r) => [...r]);
    p.shape.forEach((row, r) => row.forEach((v, c) => { if (v) g[p.y + r][p.x + c] = 1; }));
    let cleared = 0;
    for (let r = H - 1; r >= 0; r--) {
      if (g[r].every((v) => v)) { g.splice(r, 1); g.unshift(Array(W).fill(0)); cleared++; r++; }
    }
    state.current.grid = g; state.current.score += cleared * 100;
  };
  const rotate = () => {
    const p = state.current.piece; if (!p) return;
    const ns = p.shape[0].map((_, c) => p.shape.map((r) => r[c]).reverse());
    const np = { ...p, shape: ns };
    if (!collide(np, state.current.grid)) state.current.piece = np;
  };
  useEffect(() => { spawn(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = state.current.piece; if (!p || state.current.over) return;
      if (e.key === "ArrowLeft") { const np = { ...p, x: p.x - 1 }; if (!collide(np, state.current.grid)) state.current.piece = np; }
      else if (e.key === "ArrowRight") { const np = { ...p, x: p.x + 1 }; if (!collide(np, state.current.grid)) state.current.piece = np; }
      else if (e.key === "ArrowDown") { const np = { ...p, y: p.y + 1 }; if (!collide(np, state.current.grid)) state.current.piece = np; }
      else if (e.key === "ArrowUp") rotate();
    };
    window.addEventListener("keydown", onKey);
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const s = state.current; s.t++;
      if (!s.over && s.t % Math.max(8, 30 / speed) === 0 && s.piece) {
        const np = { ...s.piece, y: s.piece.y + 1 };
        if (collide(np, s.grid)) { merge(); spawn(); } else s.piece = np;
      }
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W * cell, H * cell);
      s.grid.forEach((row, r) => row.forEach((v, c) => {
        if (v) { ctx.fillStyle = "#94a3b8"; ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2); }
      }));
      if (s.piece) {
        ctx.fillStyle = s.piece.color;
        s.piece.shape.forEach((row, r) => row.forEach((v, c) => {
          if (v) ctx.fillRect((s.piece!.x + c) * cell + 1, (s.piece!.y + r) * cell + 1, cell - 2, cell - 2);
        }));
      }
      ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.fillText(`Score: ${s.score}`, 4, 14);
      if (s.over) { ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Game Over", W * cell / 2, H * cell / 2); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(raf); };
  }, [W, H, speed]);
  return <Frame><canvas ref={ref} width={W * cell} height={H * cell} className="rounded" /><p className="mt-2 text-center text-[10px] text-white/40">← → ↓ to move · ↑ to rotate</p></Frame>;
}

// ────────────────────────────────────────────────────── MATCH3 ──────
export function Match3Engine({ config, gameId }: EngineProps) {
  const N = num(config, "size", 7);
  const timed = bool(config, "timed", false);
  const colors = ["#ef4444","#22c55e","#3b82f6","#eab308","#a855f7","#06b6d4"];
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: N }, () => Array.from({ length: N }, () => Math.floor(Math.random() * colors.length))));
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [time, setTime] = useState(60);
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  useEffect(() => { if (!timed) return; const id = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000); return () => clearInterval(id); }, [timed]);
  const findMatches = (g: number[][]) => {
    const matched = Array.from({ length: N }, () => Array(N).fill(false));
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++)
      if (g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) matched[r][c] = matched[r][c + 1] = matched[r][c + 2] = true;
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++)
      if (g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) matched[r][c] = matched[r + 1][c] = matched[r + 2][c] = true;
    return matched;
  };
  const resolve = (g: number[][]) => {
    let total = 0;
    for (let i = 0; i < 8; i++) {
      const m = findMatches(g);
      const count = m.flat().filter(Boolean).length;
      if (!count) break;
      total += count;
      for (let c = 0; c < N; c++) {
        const col = []; for (let r = 0; r < N; r++) if (!m[r][c]) col.push(g[r][c]);
        while (col.length < N) col.unshift(Math.floor(Math.random() * colors.length));
        for (let r = 0; r < N; r++) g[r][c] = col[r];
      }
    }
    return total;
  };
  const click = (r: number, c: number) => {
    if (timed && time === 0) return;
    if (!sel) { setSel({ r, c }); return; }
    if (Math.abs(sel.r - r) + Math.abs(sel.c - c) !== 1) { setSel({ r, c }); return; }
    const g = grid.map((row) => [...row]);
    [g[sel.r][sel.c], g[r][c]] = [g[r][c], g[sel.r][sel.c]];
    const gained = resolve(g);
    if (gained === 0) { setSel(null); return; }
    setScore((s) => s + gained); setGrid(g); setSel(null);
  };
  return (
    <Frame>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>Score: <b>{score}</b></span>{timed && <span>Time: <b>{time}s</b></span>}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {grid.flat().map((v, i) => {
          const r = Math.floor(i / N), c = i % N;
          const selected = sel?.r === r && sel?.c === c;
          return (
            <button key={i} onClick={() => click(r, c)}
              className={`h-9 w-9 rounded ${selected ? "ring-2 ring-white" : ""}`}
              style={{ background: colors[v] }} />
          );
        })}
      </div>
    </Frame>
  );
}

// ─────────────────────────────────────────────────── LIGHTS OUT ──────
export function LightsOutEngine({ config, gameId }: EngineProps) {
  const N = num(config, "size", 5);
  const [grid, setGrid] = useState<boolean[]>(() => Array.from({ length: N * N }, () => Math.random() < 0.5));
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  const click = (i: number) => {
    const r = Math.floor(i / N), c = i % N;
    const next = [...grid];
    [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) next[nr * N + nc] = !next[nr * N + nc];
    });
    setGrid(next);
  };
  const won = grid.every((v) => !v);
  return (
    <Frame>
      <div className="mb-2 text-center text-xs">{won ? "🎉 Solved!" : "Turn them all off"}</div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {grid.map((on, i) => (
          <button key={i} onClick={() => click(i)}
            className={`h-10 w-10 rounded transition ${on ? "bg-amber-400" : "bg-zinc-800"}`} />
        ))}
      </div>
      <button onClick={() => setGrid(Array.from({ length: N * N }, () => Math.random() < 0.5))}
        className="mt-3 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">New puzzle</button>
    </Frame>
  );
}

// ───────────────────────────────────────────────────── HANGMAN ──────
export function HangmanEngine({ config, gameId }: EngineProps) {
  const diff = str(config, "difficulty", "easy");
  const lists = {
    easy: ["apple","house","music","river","table","plant","cloud","stone","light","green"],
    medium: ["javascript","keyboard","umbrella","mountain","calendar","library","painting","weather","picture","balcony"],
    hard: ["xenophobia","quintessence","obfuscation","perspicacious","onomatopoeia","sesquipedalian","syzygy","zephyr","cryptography","mnemonic"],
  } as const;
  const pickWord = useCallback(() => lists[diff as keyof typeof lists][Math.floor(Math.random() * lists[diff as keyof typeof lists].length)], [diff]);
  const [word, setWord] = useState(pickWord());
  const [guessed, setGuessed] = useState<string[]>([]);
  const wrong = guessed.filter((g) => !word.includes(g)).length;
  const won = word.split("").every((c) => guessed.includes(c));
  const lost = wrong >= 6;
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  return (
    <Frame>
      <div className="mb-3 text-center text-xs">
        Wrong: <b>{wrong}/6</b> {won && "· You won!"} {lost && `· Word was "${word}"`}
      </div>
      <div className="mb-3 text-center font-mono text-2xl tracking-widest">
        {word.split("").map((c, i) => <span key={i}>{guessed.includes(c) || lost ? c : "_"} </span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {"abcdefghijklmnopqrstuvwxyz".split("").map((c) => (
          <button key={c} disabled={guessed.includes(c) || won || lost}
            onClick={() => setGuessed([...guessed, c])}
            className="rounded bg-zinc-800 py-1 text-xs uppercase disabled:opacity-30 enabled:hover:bg-zinc-700">
            {c}
          </button>
        ))}
      </div>
      {(won || lost) && (
        <button onClick={() => { setWord(pickWord()); setGuessed([]); }}
          className="mt-3 w-full rounded bg-white/10 py-1 text-xs hover:bg-white/20">New word</button>
      )}
    </Frame>
  );
}

// ──────────────────────────────────────────────── ROCK PAPER SCISSORS ──
export function RPSEngine({ config, gameId }: EngineProps) {
  const ext = bool(config, "extended", false);
  const moves = ext ? ["rock","paper","scissors","lizard","spock"] : ["rock","paper","scissors"];
  const beats: Record<string, string[]> = ext
    ? { rock: ["scissors","lizard"], paper: ["rock","spock"], scissors: ["paper","lizard"], lizard: ["paper","spock"], spock: ["rock","scissors"] }
    : { rock: ["scissors"], paper: ["rock"], scissors: ["paper"] };
  const [you, setYou] = useState(0); const [ai, setAi] = useState(0); const [last, setLast] = useState("");
  useEffect(() => { void logActivity("game.start", gameId); }, [gameId]);
  const play = (m: string) => {
    const a = moves[Math.floor(Math.random() * moves.length)];
    let result = "Tie";
    if (beats[m]?.includes(a)) { setYou((y) => y + 1); result = "You win"; }
    else if (beats[a]?.includes(m)) { setAi((y) => y + 1); result = "AI wins"; }
    setLast(`You: ${m} · AI: ${a} · ${result}`);
  };
  return (
    <Frame>
      <div className="mb-3 text-center text-sm">You {you} – {ai} AI</div>
      <div className="grid grid-cols-3 gap-2">
        {moves.map((m) => (
          <button key={m} onClick={() => play(m)} className="rounded bg-zinc-800 px-3 py-2 text-xs capitalize hover:bg-zinc-700">{m}</button>
        ))}
      </div>
      <div className="mt-3 text-center text-xs text-white/60">{last}</div>
    </Frame>
  );
}
