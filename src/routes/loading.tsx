import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAuthed } from "@/lib/auth-gate";
import { useWallpaper } from "@/lib/wallpaper";

export const Route = createFileRoute("/loading")({
  component: LoadingPage,
  head: () => ({ meta: [{ title: "Loading XenoPro…" }] }),
});

const PHRASES = [
  "Booting xeno core…",
  "Spinning up proxy relays…",
  "Decrypting arcade vault…",
  "Indexing cinema catalog…",
  "Sharpening the dot cursor…",
  "Press ENTER to launch.",
];

function LoadingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [done, setDone] = useState(false);
  const { wallpaper } = useWallpaper();

  useEffect(() => {
    if (!isAuthed()) { navigate({ to: "/login" }); return; }
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 9 + 4);
      setProgress(p);
      setPhrase(PHRASES[Math.min(PHRASES.length - 1, Math.floor((p / 100) * PHRASES.length))]);
      if (p >= 100) { clearInterval(tick); setDone(true); }
    }, 220);
    return () => clearInterval(tick);
  }, [navigate]);

  useEffect(() => {
    if (!done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); navigate({ to: "/" }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      {wallpaper && (wallpaper.kind === "video"
        ? <video src={wallpaper.url} autoPlay muted playsInline loop={wallpaper.loop}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />
        : <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${wallpaper.url})` }} />)}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-black/70 to-black/95" />

      {/* Animated rings */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}
            className="absolute rounded-full border border-white/10"
            style={{
              width: `${(i + 1) * 220}px`, height: `${(i + 1) * 220}px`,
              animation: `xenoSpin ${20 + i * 8}s linear infinite ${i % 2 ? "" : "reverse"}`,
            }} />
        ))}
      </div>

      <style>{`
        @keyframes xenoSpin { to { transform: rotate(360deg); } }
        @keyframes xenoPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-10 px-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.6em] text-white/40">XENO//OS</div>
          <h1 className="bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-7xl font-black tracking-tighter text-transparent sm:text-8xl">
            XENOPRO
          </h1>
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">
            unblocked · private · fast
          </div>
        </div>

        <div className="w-full max-w-md font-mono">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/50">
            <span>{phrase}</span>
            <span>{Math.floor(progress).toString().padStart(3, "0")}%</span>
          </div>
          <div className="mt-2 flex h-2 gap-[2px]">
            {Array.from({ length: 40 }).map((_, i) => {
              const filled = (i / 40) * 100 < progress;
              return <div key={i} className={`flex-1 rounded-[1px] ${filled ? "bg-white" : "bg-white/10"}`} />;
            })}
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3" style={{ animation: "xenoPulse 1.6s ease-in-out infinite" }}>
            <kbd className="rounded-lg border border-white/30 bg-white/5 px-6 py-3 font-mono text-base tracking-widest shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)]">
              PRESS ENTER
            </kbd>
            <span className="text-[10px] uppercase tracking-widest text-white/40">to launch desktop</span>
          </div>
        ) : (
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">awaiting boot sequence…</div>
        )}
      </div>
    </div>
  );
}
