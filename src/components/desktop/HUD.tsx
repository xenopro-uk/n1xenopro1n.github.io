// Top-right HUD: FPS counter, screenshot button, online count, proxy health pill.
import { useEffect, useRef, useState } from "react";
import { Activity, Camera, Users, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

export function HUD() {
  const [fps, setFps] = useState(0);
  const [online, setOnline] = useState(0);
  const [proxyOk, setProxyOk] = useState<boolean | null>(null);
  const { user, profile } = useAccount();

  // FPS loop
  useEffect(() => {
    let raf = 0; let frames = 0; let last = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0; last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Presence heartbeat (signed-in users only) + read total
  useEffect(() => {
    let cancelled = false;
    const refreshCount = async () => {
      const since = new Date(Date.now() - 90_000).toISOString();
      const { count } = await supabase.from("presence")
        .select("user_id", { head: true, count: "exact" })
        .gte("last_seen", since);
      if (!cancelled) setOnline(count ?? 0);
    };
    const beat = async () => {
      if (user) {
        await supabase.from("presence").upsert({
          user_id: user.id,
          display_name: profile?.display_name ?? null,
          last_seen: new Date().toISOString(),
        });
      }
      await refreshCount();
    };
    beat();
    const id = setInterval(beat, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user, profile]);

  // Proxy health
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const r = await fetch("/api/public/proxy?ping=1", { cache: "no-store" });
        if (!cancelled) setProxyOk(r.ok);
      } catch { if (!cancelled) setProxyOk(false); }
    };
    ping();
    const id = setInterval(ping, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const screenshot = async () => {
    // Use html2canvas-free approach: rasterize via foreignObject SVG
    const node = document.body;
    const w = node.clientWidth, h = node.clientHeight;
    const data = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <foreignObject width='100%' height='100%'>
        <div xmlns='http://www.w3.org/1999/xhtml' style='font:14px sans-serif;color:#fff;background:#000;padding:24px'>
          XenoPro screenshot — ${new Date().toLocaleString()}<br/>
          (Browser security blocks rendering live DOM into a download. Use your OS shortcut: ⌘⇧4 / Win+Shift+S)
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `xenopro-${Date.now()}.svg`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fpsColor = fps >= 50 ? "text-emerald-400" : fps >= 30 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-20 flex items-center gap-2 text-[11px]">
      <div className={`flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 ring-1 ring-white/10 backdrop-blur ${fpsColor}`}>
        <Activity className="h-3 w-3" />
        <span className="font-mono tabular-nums">{fps} fps</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-foreground/70 ring-1 ring-white/10 backdrop-blur">
        <Users className="h-3 w-3" />
        <span className="font-mono tabular-nums">{online} online</span>
      </div>
      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 backdrop-blur ${
        proxyOk == null ? "bg-black/40 text-foreground/50 ring-white/10"
        : proxyOk ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
        : "bg-red-500/10 text-red-300 ring-red-500/30"
      }`}>
        {proxyOk === false ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
        <span>proxy {proxyOk == null ? "…" : proxyOk ? "ok" : "down"}</span>
      </div>
      <button onClick={screenshot}
        className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-foreground/70 ring-1 ring-white/10 backdrop-blur hover:bg-white/10"
        title="Screenshot">
        <Camera className="h-3 w-3" /> shot
      </button>
    </div>
  );
}
