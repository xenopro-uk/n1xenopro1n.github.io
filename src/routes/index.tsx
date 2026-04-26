// Pulse/Messenger removed
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Globe, Gamepad2, Sparkles, Newspaper,
  Settings as SettingsIcon, Film, Music, Calculator as CalcIcon, LogOut,
} from "lucide-react";
import { AppIcon } from "@/components/desktop/AppIcon";
import { Window } from "@/components/desktop/Window";
import { Browser } from "@/components/desktop/Browser";
import { Taskbar } from "@/components/desktop/Taskbar";
import { DotCursor } from "@/components/desktop/Cursor";
import { News } from "@/components/desktop/News";
import { Games } from "@/components/desktop/Games";
import { Cinema } from "@/components/desktop/Cinema";
import { AI } from "@/components/desktop/AI";
import { Settings } from "@/components/desktop/Settings";
import { Calculator } from "@/components/desktop/Calculator";
import { MusicApp } from "@/components/desktop/MusicApp";
import { useCloak } from "@/lib/cloak";
import { isAuthed, clearAuthed } from "@/lib/auth-gate";

export const Route = createFileRoute("/")({
  component: Desktop,
  head: () => ({
    meta: [
      { title: "XenoPro — Unblocked Proxy Desktop" },
      { name: "description", content: "XenoPro: monochrome desktop with unblocked proxy browser, free games, music, AI, news and movies." },
      { property: "og:title", content: "XenoPro — Unblocked Proxy Desktop" },
      { property: "og:description", content: "Private, unblocked web browsing inside a clean black-and-white desktop shell." },
    ],
  }),
});

type AppId = "browser" | "ai" | "games" | "news" | "settings" | "cinema" | "music" | "calc";

interface AppDef { id: AppId; label: string; icon: typeof Globe; }

const APPS: AppDef[] = [
  { id: "browser",  label: "Proxy",     icon: Globe },
  { id: "ai",       label: "Xeno AI",   icon: Sparkles },
  { id: "games",    label: "Arcade",    icon: Gamepad2 },
  { id: "cinema",   label: "Cinema",    icon: Film },
  { id: "music",    label: "Sonic",     icon: Music },
  { id: "news",     label: "Wire",      icon: Newspaper },
  { id: "calc",     label: "Calc",      icon: CalcIcon },
  { id: "settings", label: "Cloak",     icon: SettingsIcon },
];

function Desktop() {
  const navigate = useNavigate();
  const [openApp, setOpenApp] = useState<AppId | null>(null);
  const [cloak] = useCloak();
  const bgRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Auth gate (client-only — gate is a UI feature, not real security)
  useEffect(() => {
    if (!isAuthed()) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
  }, [navigate]);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const ripple = document.createElement("span");
    ripple.className = "bg-ripple";
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    bgRef.current?.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  const signOut = () => {
    clearAuthed();
    navigate({ to: "/login" });
  };

  const brand = cloak.tabTitle || "XenoPro";

  if (!ready) return null;

  return (
    <div ref={bgRef} onClick={handleBgClick}
      className="relative h-screen w-screen overflow-hidden">
      <DotCursor />

      {/* Soft mono haze */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl" />
      </div>

      {/* Brand watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[12vw] font-bold tracking-tighter text-white/[0.04] leading-none">
            {brand.toLowerCase()}
          </div>
          <div className="-mt-2 text-xs uppercase tracking-[0.4em] text-foreground/30">
            unblocked · private · fast
          </div>
        </div>
      </div>

      {/* Sign out (top-right) */}
      <button
        onClick={signOut}
        className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-foreground/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-foreground"
      >
        <LogOut className="h-3 w-3" /> Sign out
      </button>

      {/* App grid */}
      <div className="relative z-10 grid max-h-[calc(100vh-6rem)] w-fit grid-cols-2 gap-1 p-4 sm:p-6">
        {APPS.map((app) => (
          <AppIcon key={app.id} icon={app.icon} label={app.label}
            accent="oklch(0.85 0 0)"
            onClick={() => setOpenApp(app.id)} />
        ))}
      </div>

      {/* Window */}
      {openApp && (
        <Window title={APPS.find((a) => a.id === openApp)?.label ?? ""}
          onClose={() => setOpenApp(null)}>
          {openApp === "browser" && <Browser />}
          {openApp === "ai" && <AI />}
          {openApp === "games" && <Games />}
          {openApp === "cinema" && <Cinema />}
          {openApp === "news" && <News />}
          {openApp === "music" && <MusicApp />}
          {openApp === "calc" && <Calculator />}
          {openApp === "settings" && <Settings />}
        </Window>
      )}

      <Taskbar onLaunchBrowser={() => setOpenApp("browser")} />
    </div>
  );
}
