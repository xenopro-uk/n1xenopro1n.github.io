import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Globe, Gamepad2, Sparkles, MessageCircle, Newspaper,
  Settings as SettingsIcon, Film, Music, Calculator, Terminal,
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
import { useCloak } from "@/lib/cloak";

export const Route = createFileRoute("/")({
  component: Desktop,
  head: () => ({
    meta: [
      { title: "XenoPro — Unblocked Proxy Desktop" },
      { name: "description", content: "XenoPro: glassmorphic desktop with unblocked proxy browser, free games, AI, news and movies." },
      { property: "og:title", content: "XenoPro — Unblocked Proxy Desktop" },
      { property: "og:description", content: "Private, unblocked web browsing inside a beautiful desktop shell." },
    ],
  }),
});

type AppId = "browser" | "ai" | "games" | "social" | "news" | "settings" | "cinema" | "music" | "calc" | "term";

interface AppDef {
  id: AppId;
  label: string;
  icon: typeof Globe;
  accent: string;
}

const APPS: AppDef[] = [
  { id: "browser",  label: "Proxy Browser", icon: Globe,        accent: "oklch(0.78 0.18 200)" },
  { id: "ai",       label: "Xeno AI",       icon: Sparkles,     accent: "oklch(0.7 0.22 320)" },
  { id: "games",    label: "Arcade",        icon: Gamepad2,     accent: "oklch(0.75 0.2 30)" },
  { id: "cinema",   label: "Cinema",        icon: Film,         accent: "oklch(0.65 0.22 0)" },
  { id: "news",     label: "Wire",          icon: Newspaper,    accent: "oklch(0.7 0.18 60)" },
  { id: "social",   label: "Pulse",         icon: MessageCircle,accent: "oklch(0.7 0.2 150)" },
  { id: "music",    label: "Sonic",         icon: Music,        accent: "oklch(0.7 0.2 280)" },
  { id: "calc",     label: "Calc",          icon: Calculator,   accent: "oklch(0.7 0.05 270)" },
  { id: "term",     label: "Terminal",      icon: Terminal,     accent: "oklch(0.7 0.05 270)" },
  { id: "settings", label: "Cloak",         icon: SettingsIcon, accent: "oklch(0.7 0.04 270)" },
];

function Desktop() {
  const [openApp, setOpenApp] = useState<AppId | null>(null);
  const [cloak] = useCloak();
  const bgRef = useRef<HTMLDivElement>(null);

  // Background ripple on click
  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const ripple = document.createElement("span");
    ripple.className = "bg-ripple";
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    bgRef.current?.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  };

  // Keep brand label in sync with cloak
  const brand = cloak.tabTitle || "XenoPro";

  // Pulse: open the cloaked tab title in browser when clicked
  useEffect(() => { /* noop: cloak applied in hook */ }, [cloak]);

  return (
    <div
      ref={bgRef}
      onClick={handleBgClick}
      className="relative h-screen w-screen overflow-hidden"
    >
      <DotCursor />

      {/* Aurora orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl animate-float-slow" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float-slow" style={{ animationDelay: "-12s" }} />
      </div>

      {/* Brand watermark — click to ripple too */}
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

      {/* App grid */}
      <div className="relative z-10 grid max-h-[calc(100vh-6rem)] w-fit grid-cols-2 gap-1 p-4 sm:p-6">
        {APPS.map((app) => (
          <AppIcon
            key={app.id}
            icon={app.icon}
            label={app.label}
            accent={app.accent}
            onClick={() => setOpenApp(app.id)}
          />
        ))}
      </div>

      {/* Window */}
      {openApp && (
        <Window
          title={APPS.find((a) => a.id === openApp)?.label ?? ""}
          onClose={() => setOpenApp(null)}
        >
          {openApp === "browser" && <Browser />}
          {openApp === "ai" && <AI />}
          {openApp === "games" && <Games />}
          {openApp === "cinema" && <Cinema />}
          {openApp === "news" && <News />}
          {openApp === "settings" && <Settings />}
          {(openApp === "social" || openApp === "music" || openApp === "calc" || openApp === "term") && (
            <ComingSoon name={APPS.find((a) => a.id === openApp)?.label ?? ""} />
          )}
        </Window>
      )}

      <Taskbar onLaunchBrowser={() => setOpenApp("browser")} />
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 ring-1 ring-white/10">
        <Sparkles className="h-6 w-6 text-foreground/70" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{name}</h2>
      <p className="max-w-sm text-sm text-foreground/50">
        This module is coming soon. Try Proxy Browser, Arcade, Cinema, Wire, Xeno AI, or Cloak settings.
      </p>
    </div>
  );
}
