// First-visit "About me" popup for the desktop owner.
import { useEffect, useState } from "react";
import { X, Music2, MessageCircle } from "lucide-react";

const KEY = "xenopro:about-shown";

export function AboutMe() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem(KEY)) {
      setOpen(true);
      sessionStorage.setItem(KEY, "1");
    }
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-[min(440px,92vw)] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-6 shadow-2xl">
        <button onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-full bg-white/5 p-1.5 text-white/60 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 text-3xl font-black shadow-lg">
            X
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to XenoPro</h2>
            <p className="mt-1 text-xs text-white/60">Built by xeno.pro_ — say hi!</p>
          </div>
          <div className="grid w-full gap-2">
            <a href="https://www.tiktok.com/@xeno.pro_" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/10">
              <Music2 className="h-5 w-5 text-pink-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">TikTok</div>
                <div className="text-[11px] text-white/50">@xeno.pro_</div>
              </div>
              <span className="text-xs text-white/40">↗</span>
            </a>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 opacity-70">
              <MessageCircle className="h-5 w-5 text-indigo-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">Discord</div>
                <div className="text-[11px] text-white/50">coming soon</div>
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-black hover:bg-white/90">
            Enter desktop
          </button>
        </div>
      </div>
    </div>
  );
}
