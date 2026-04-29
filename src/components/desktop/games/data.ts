// In-site game registry. Every game is rendered by an internal React component
// — no external URLs, no iframes pointing off-site. This means games can never
// be "stolen" by inspecting the link.
//
// 100+ entries. Many share an engine (e.g. snake variants, memory variants)
// but each gets its own card so the arcade feels full and each game has a
// unique identity / difficulty knob.

export type EngineId =
  | "snake"
  | "pong"
  | "tetris"
  | "2048"
  | "memory"
  | "breakout"
  | "minesweeper"
  | "tictactoe"
  | "flappy"
  | "reaction"
  | "typing"
  | "simon"
  | "whack"
  | "clicker"
  | "guess"
  | "dodger"
  | "runner"
  | "match3"
  | "connect4"
  | "lightsout"
  | "hangman"
  | "rps";

export interface GameDef {
  id: string;
  name: string;
  category: string;
  engine: EngineId;
  /** Tunable difficulty / theme passed to the engine. */
  config?: Record<string, number | string | boolean>;
  /** Short hint shown on the card. */
  blurb?: string;
}

const c = (
  id: string, name: string, category: string, engine: EngineId,
  config: Record<string, number | string | boolean> = {}, blurb = "",
): GameDef => ({ id, name, category, engine, config, blurb });

export const GAMES: GameDef[] = [
  // ── Snake variants (8) ────────────────────────────────────────────────
  c("snake-classic", "Snake Classic", "Arcade", "snake", { speed: 8 }, "Eat. Grow. Don't bite yourself."),
  c("snake-fast", "Speed Snake", "Arcade", "snake", { speed: 14 }, "Faster reflexes required."),
  c("snake-mega", "Mega Snake", "Arcade", "snake", { speed: 8, grid: 30 }, "Bigger arena, longer runs."),
  c("snake-mini", "Pocket Snake", "Arcade", "snake", { speed: 10, grid: 12 }, "Tight quarters."),
  c("snake-walls", "Walled Snake", "Arcade", "snake", { speed: 9, walls: true }, "Hit a wall, you die."),
  c("snake-portal", "Portal Snake", "Arcade", "snake", { speed: 10, portal: true }, "Edges wrap around."),
  c("snake-double", "Double Apple", "Arcade", "snake", { speed: 9, double: true }, "Two foods at once."),
  c("snake-night", "Midnight Snake", "Arcade", "snake", { speed: 8, theme: "neon" }, "Glow-in-the-dark."),

  // ── Pong variants (5) ─────────────────────────────────────────────────
  c("pong-classic", "Pong", "Sports", "pong", { ai: 0.7 }, "First to 7 wins."),
  c("pong-easy", "Pong Lite", "Sports", "pong", { ai: 0.45 }, "Friendlier opponent."),
  c("pong-hard", "Pong Pro", "Sports", "pong", { ai: 0.95 }, "Ruthless AI."),
  c("pong-tall", "Tall Pong", "Sports", "pong", { ai: 0.7, paddle: 140 }, "Generous paddles."),
  c("pong-tiny", "Micro Pong", "Sports", "pong", { ai: 0.7, paddle: 50 }, "Tiny paddles, big problems."),

  // ── Tetris variants (5) ───────────────────────────────────────────────
  c("tetris-classic", "Blocks", "Puzzle", "tetris", {}, "The classic. No copyright headaches."),
  c("tetris-fast", "Speed Blocks", "Puzzle", "tetris", { speed: 2 }, "Pieces fall faster."),
  c("tetris-tall", "Tall Blocks", "Puzzle", "tetris", { height: 24 }, "Taller well."),
  c("tetris-wide", "Wide Blocks", "Puzzle", "tetris", { width: 14 }, "Extra room."),
  c("tetris-extreme", "Extreme Blocks", "Puzzle", "tetris", { speed: 3 }, "Blink and you're dead."),

  // ── 2048 variants (5) ─────────────────────────────────────────────────
  c("2048-classic", "2048", "Puzzle", "2048", {}, "Combine to reach 2048."),
  c("2048-mini", "1024", "Puzzle", "2048", { goal: 1024 }, "Smaller goal, smaller grid feel."),
  c("2048-mega", "4096", "Puzzle", "2048", { goal: 4096 }, "Push further."),
  c("2048-big", "Big Board 2048", "Puzzle", "2048", { size: 5 }, "5x5 board."),
  c("2048-huge", "Huge 2048", "Puzzle", "2048", { size: 6 }, "6x6 board."),

  // ── Memory match (6) ──────────────────────────────────────────────────
  c("memory-easy", "Memory · Easy", "Brain", "memory", { pairs: 6 }, "Match the pairs."),
  c("memory-medium", "Memory · Medium", "Brain", "memory", { pairs: 10 }, "10 pairs."),
  c("memory-hard", "Memory · Hard", "Brain", "memory", { pairs: 15 }, "15 pairs."),
  c("memory-mega", "Memory · Mega", "Brain", "memory", { pairs: 21 }, "Push your brain."),
  c("memory-emoji", "Emoji Memory", "Brain", "memory", { pairs: 12, theme: "emoji" }, "Emoji edition."),
  c("memory-flag", "Flag Memory", "Brain", "memory", { pairs: 12, theme: "flag" }, "Flag edition."),

  // ── Breakout variants (5) ─────────────────────────────────────────────
  c("breakout-classic", "Bricks", "Arcade", "breakout", {}, "Smash all the bricks."),
  c("breakout-fast", "Speed Bricks", "Arcade", "breakout", { speed: 1.4 }, "Faster ball."),
  c("breakout-wide", "Wide Bricks", "Arcade", "breakout", { paddle: 140 }, "Wider paddle."),
  c("breakout-thin", "Thin Bricks", "Arcade", "breakout", { paddle: 50 }, "Sliver paddle."),
  c("breakout-rows", "Tall Bricks", "Arcade", "breakout", { rows: 9 }, "More rows of bricks."),

  // ── Minesweeper variants (4) ──────────────────────────────────────────
  c("mines-easy", "Minesweeper · Easy", "Puzzle", "minesweeper", { size: 9, mines: 10 }, "9x9, 10 mines."),
  c("mines-medium", "Minesweeper · Medium", "Puzzle", "minesweeper", { size: 12, mines: 25 }, "12x12, 25 mines."),
  c("mines-hard", "Minesweeper · Hard", "Puzzle", "minesweeper", { size: 16, mines: 50 }, "16x16, 50 mines."),
  c("mines-extreme", "Minesweeper · Extreme", "Puzzle", "minesweeper", { size: 18, mines: 80 }, "Hold your breath."),

  // ── Tic Tac Toe variants (3) ──────────────────────────────────────────
  c("ttt-easy", "Tic Tac Toe · Easy", "Classic", "tictactoe", { ai: "random" }, "AI plays random."),
  c("ttt-hard", "Tic Tac Toe · Hard", "Classic", "tictactoe", { ai: "minimax" }, "AI plays perfect."),
  c("ttt-pvp", "Tic Tac Toe · 2P", "Classic", "tictactoe", { ai: "none" }, "Two players, one device."),

  // ── Flappy variants (4) ───────────────────────────────────────────────
  c("flappy-classic", "Flappy", "Arcade", "flappy", {}, "Tap to flap."),
  c("flappy-easy", "Flappy · Easy", "Arcade", "flappy", { gap: 180 }, "Bigger gaps."),
  c("flappy-hard", "Flappy · Hard", "Arcade", "flappy", { gap: 110 }, "Tiny gaps."),
  c("flappy-night", "Flappy Night", "Arcade", "flappy", { theme: "night" }, "Nocturnal edition."),

  // ── Reaction time (3) ─────────────────────────────────────────────────
  c("reaction-classic", "Reaction Test", "Brain", "reaction", {}, "Click when it turns green."),
  c("reaction-aim", "Aim Trainer", "Brain", "reaction", { mode: "aim" }, "Click the targets."),
  c("reaction-color", "Color Match", "Brain", "reaction", { mode: "color" }, "Match the color."),

  // ── Typing (3) ────────────────────────────────────────────────────────
  c("typing-classic", "Typing Test", "Brain", "typing", { seconds: 30 }, "30s sprint."),
  c("typing-long", "Typing Marathon", "Brain", "typing", { seconds: 60 }, "60s endurance."),
  c("typing-quick", "Typing Sprint", "Brain", "typing", { seconds: 15 }, "15s burst."),

  // ── Simon (3) ─────────────────────────────────────────────────────────
  c("simon-classic", "Simon", "Brain", "simon", {}, "Repeat the pattern."),
  c("simon-fast", "Simon Fast", "Brain", "simon", { speed: 1.6 }, "Faster sequence."),
  c("simon-long", "Simon Long", "Brain", "simon", { start: 4 }, "Starts at 4 steps."),

  // ── Whack-a-mole (3) ──────────────────────────────────────────────────
  c("whack-classic", "Whack-a-Mole", "Arcade", "whack", {}, "Whack the moles."),
  c("whack-fast", "Whack · Fast", "Arcade", "whack", { speed: 1.6 }, "Moles vanish quickly."),
  c("whack-grid", "Whack · Big Grid", "Arcade", "whack", { size: 5 }, "5x5 board."),

  // ── Cookie clicker (3) ────────────────────────────────────────────────
  c("clicker-classic", "Clicker", "Idle", "clicker", {}, "Click for points."),
  c("clicker-coin", "Coin Clicker", "Idle", "clicker", { theme: "coin" }, "Money money money."),
  c("clicker-pixel", "Pixel Clicker", "Idle", "clicker", { theme: "pixel" }, "Retro pixel art."),

  // ── Number guess (3) ──────────────────────────────────────────────────
  c("guess-100", "Guess 1–100", "Brain", "guess", { max: 100 }, "Binary search practice."),
  c("guess-1000", "Guess 1–1000", "Brain", "guess", { max: 1000 }, "Bigger range."),
  c("guess-10000", "Guess 1–10,000", "Brain", "guess", { max: 10000 }, "Pro level."),

  // ── Dodger (3) ────────────────────────────────────────────────────────
  c("dodger-classic", "Dodger", "Arcade", "dodger", {}, "Avoid the falling rocks."),
  c("dodger-fast", "Speed Dodger", "Arcade", "dodger", { speed: 1.6 }, "They're faster."),
  c("dodger-rain", "Rain Dodger", "Arcade", "dodger", { density: 1.5 }, "More to dodge."),

  // ── Runner (3) ────────────────────────────────────────────────────────
  c("runner-classic", "Runner", "Arcade", "runner", {}, "Jump over obstacles."),
  c("runner-night", "Night Runner", "Arcade", "runner", { theme: "night" }, "Dark mode run."),
  c("runner-marathon", "Marathon Runner", "Arcade", "runner", { speed: 0.6 }, "Slower, longer."),

  // ── Match-3 (3) ───────────────────────────────────────────────────────
  c("match3-classic", "Gem Match", "Puzzle", "match3", {}, "Swap to match 3."),
  c("match3-big", "Gem Match · Big", "Puzzle", "match3", { size: 9 }, "9x9 board."),
  c("match3-time", "Gem Match · Timed", "Puzzle", "match3", { timed: true }, "60 seconds."),

  // ── Connect 4 (2) ─────────────────────────────────────────────────────
  c("connect4-easy", "Connect 4 · Easy", "Classic", "connect4", { ai: "random" }, "AI is forgetful."),
  c("connect4-hard", "Connect 4 · Hard", "Classic", "connect4", { ai: "smart" }, "AI thinks ahead."),

  // ── Lights Out (2) ────────────────────────────────────────────────────
  c("lights-5", "Lights Out 5x5", "Puzzle", "lightsout", { size: 5 }, "Turn them all off."),
  c("lights-7", "Lights Out 7x7", "Puzzle", "lightsout", { size: 7 }, "Bigger headache."),

  // ── Hangman (3) ───────────────────────────────────────────────────────
  c("hangman-easy", "Hangman · Easy", "Word", "hangman", { difficulty: "easy" }, "Common words."),
  c("hangman-medium", "Hangman · Medium", "Word", "hangman", { difficulty: "medium" }, "Trickier."),
  c("hangman-hard", "Hangman · Hard", "Word", "hangman", { difficulty: "hard" }, "Rare words."),

  // ── Rock paper scissors (2) ───────────────────────────────────────────
  c("rps-classic", "Rock Paper Scissors", "Classic", "rps", {}, "Best of 5."),
  c("rps-extended", "RPS Lizard Spock", "Classic", "rps", { extended: true }, "Sheldon's version."),

  // ── Filler variants to clear 100 ──────────────────────────────────────
  c("snake-veryfast", "Hyper Snake", "Arcade", "snake", { speed: 18 }, "Insanely fast."),
  c("snake-rainbow", "Rainbow Snake", "Arcade", "snake", { speed: 9, theme: "rainbow" }, "Pretty colors."),
  c("breakout-mega", "Mega Bricks", "Arcade", "breakout", { rows: 11, speed: 1.2 }, "Tons of bricks."),
  c("dodger-tank", "Tank Dodger", "Arcade", "dodger", { hp: 3 }, "You have 3 lives."),
];

export const CATEGORIES = ["All", ...Array.from(new Set(GAMES.map((g) => g.category)))];
