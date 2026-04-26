import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import mascot from "@/assets/xeno-mascot.jpeg";
import { isAuthed } from "@/lib/auth-gate";

export const Route = createFileRoute("/loading")({
  component: LoadingPage,
  head: () => ({
    meta: [{ title: "Loading XenoPro…" }],
  }),
});

const PHRASES = [
  "Booting xeno core…",
  "Spinning up proxy relays…",
  "Decrypting arcade vault…",
  "Indexing cinema catalog…",
  "Sharpening the dot cursor…",
  "Almost there…",
];

function LoadingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [phrase, setPhrase] = useState(PHRASES[0]);

  useEffect(() => {
    if (!isAuthed()) {
      navigate({ to: "/login" });
      return;
    }
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 9 + 4);
      setProgress(p);
      setPhrase(PHRASES[Math.min(PHRASES.length - 1, Math.floor((p / 100) * PHRASES.length))]);
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => navigate({ to: "/" }), 450);
      }
    }, 220);
    return () => clearInterval(tick);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* faint grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-white/5 blur-2xl" />
          <img
            src={mascot}
            alt="XenoPro"
            className="relative h-56 w-auto rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
          />
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">XENOPRO</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.5em] text-white/40">
            unblocked · private · fast
          </p>
        </div>

        <div className="w-72">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-white/40">
            <span>{phrase}</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
