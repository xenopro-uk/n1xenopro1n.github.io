import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Globe, Gamepad2, Sparkles, MessageCircle, Newspaper,
  Settings, Film, Music, Mail, Calculator, Image as ImageIcon, Terminal,
} from "lucide-react";
import { AppIcon } from "@/components/desktop/AppIcon";
import { Window } from "@/components/desktop/Window";
import { Browser } from "@/components/desktop/Browser";
import { Taskbar } from "@/components/desktop/Taskbar";

export const Route = createFileRoute("/")({
  component: Desktop,
  head: () => ({
    meta: [
      { title: "OrbitOS — Unblocked Proxy Desktop" },
      {
        name: "description",
        content: "A glassmorphic desktop with a built-in unblocked proxy browser. Search the web freely.",
      },
      { property: "og:title", content: "OrbitOS — Unblocked Proxy Desktop" },
      {
        property: "og:description",
        content: "Private, unblocked web browsing inside a beautiful desktop shell.",
      },
    ],
  }),
});

type AppId = "browser" | "ai" | "games" | "social" | "news" | "settings" | "cinema" | "music" | "mail" | "calc" | "gallery" | "term";

interface AppDef {
  id: AppId;
  label: string;
  icon: typeof Globe;
  accent: string;
  primary?: boolean;
}

const APPS: AppDef[] = [
  { id: "browser", label: "Proxy Browser", icon: Globe, accent: "oklch(0.78 0.18 200)", primary: true },
  { id: "ai", label: "Orbit AI", icon: Sparkles, accent: "oklch(0.7 0.22 320)" },
  { id: "games", label: "Arcade", icon: Gamepad2, accent: "oklch(0.75 0.2 30)" },
  { id: "social", label: "Pulse", icon: MessageCircle, accent: "oklch(0.7 0.2 150)" },
  { id: "news", label: "Wire", icon: Newspaper, accent: "oklch(0.7 0.18 60)" },
  { id: "cinema", label: "Cinema", icon: Film, accent: "oklch(0.65 0.22 0)" },
  { id: "music", label: "Sonic", icon: Music, accent: "oklch(0.7 0.2 280)" },
  { id: "mail", label: "Mail", icon: Mail, accent: "oklch(0.75 0.18 220)" },
  { id: "calc", label: "Calc", icon: Calculator, accent: "oklch(0.7 0.05 270)" },
  { id: "gallery", label: "Gallery", icon: ImageIcon, accent: "oklch(0.75 0.18 100)" },
  { id: "term", label: "Terminal", icon: Terminal, accent: "oklch(0.7 0.05 270)" },
  { id: "settings", label: "Settings", icon: Settings, accent: "oklch(0.7 0.04 270)" },
];

function Desktop() {
  const [openApp, setOpenApp] = useState<AppId | null>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Aurora orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl animate-float-slow" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float-slow" style={{ animationDelay: "-12s" }} />
      </div>

      {/* Logo / brand */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[12vw] font-bold tracking-tighter text-white/[0.04] leading-none">orbit</div>
          <div className="-mt-2 text-xs uppercase tracking-[0.4em] text-foreground/30">unblocked · private · fast</div>
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
          {openApp === "browser" ? <Browser /> : <ComingSoon name={APPS.find((a) => a.id === openApp)?.label ?? ""} />}
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
        This module is coming soon. The Proxy Browser is fully live — open it from the desktop or taskbar.
      </p>
    </div>
  );
}
