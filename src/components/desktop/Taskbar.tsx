import { useEffect, useState } from "react";
import { Wifi, Signal, Battery, Globe } from "lucide-react";

export function Taskbar({ onLaunchBrowser }: { onLaunchBrowser: () => void }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const d = time.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full glass-strong px-3 py-2 shadow-[0_20px_50px_-20px_oklch(0_0_0/0.6)]">
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground transition hover:scale-105">
          <span className="text-sm font-bold">O</span>
        </button>
        <div className="h-6 w-px bg-white/10" />
        <button
          onClick={onLaunchBrowser}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-foreground/80 transition hover:bg-white/10 hover:text-primary"
          aria-label="Open Browser"
        >
          <Globe className="h-4 w-4" />
        </button>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-2 px-2 text-[11px] text-foreground/70">
          <Signal className="h-3.5 w-3.5" />
          <Wifi className="h-3.5 w-3.5" />
          <Battery className="h-4 w-4" />
        </div>
        <div className="h-6 w-px bg-white/10" />
        <div className="px-2 text-right">
          <div className="text-xs font-medium leading-tight text-foreground">{t}</div>
          <div className="text-[10px] leading-tight text-foreground/50">{d}</div>
        </div>
      </div>
    </div>
  );
}
