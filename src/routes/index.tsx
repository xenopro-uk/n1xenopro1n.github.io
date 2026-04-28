import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Globe, Gamepad2, Sparkles, Newspaper,
  Settings as SettingsIcon, Film, Music, Calculator as CalcIcon,
  LogOut, Shield,
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
import { AdminPanel } from "@/components/desktop/AdminPanel";
import { AccountMenu } from "@/components/desktop/AccountMenu";
import { BroadcastBanner } from "@/components/desktop/BroadcastBanner";
import { HUD } from "@/components/desktop/HUD";
import { WallpaperLayer } from "@/components/desktop/WallpaperLayer";
import { DesktopContextMenu } from "@/components/desktop/DesktopContextMenu";
import { useCloak } from "@/lib/cloak";
import { isAuthed, isDevGate, clearAuthed } from "@/lib/auth-gate";
import { useAccount } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Desktop,
  head: () => ({
    meta: [
      { title: "XenoPro" },
      { name: "description", content: "XenoPro desktop." },
    ],
  }),
});

type AppId = "browser" | "ai" | "games" | "news" | "settings" | "cinema" | "music" | "calc" | "admin";
interface AppDef { id: AppId; label: string; icon: typeof Globe; devOnly?: boolean }

const APPS: AppDef[] = [
  { id: "browser",  label: "Xeno's Proxy",    icon: Globe },
  { id: "ai",       label: "Xeno's AI",       icon: Sparkles },
  { id: "games",    label: "Xeno's Arcade",   icon: Gamepad2 },
  { id: "cinema",   label: "Xeno's Cinema",   icon: Film },
  { id: "music",    label: "Xeno's Sonic",    icon: Music },
  { id: "news",     label: "Xeno's Wire",     icon: Newspaper },
  { id: "calc",     label: "Xeno's Calc",     icon: CalcIcon },
  { id: "settings", label: "Xeno's Cloak",    icon: SettingsIcon },
  { id: "admin",    label: "Xeno's Dev",      icon: Shield, devOnly: true },
];

function Desktop() {
  const navigate = useNavigate();
  const [openApp, setOpenApp] = useState<AppId | null>(null);
  const [settingsTab, setSettingsTab] = useState<"cloak" | "proxy" | "wallpaper">("cloak");
  const [cloak] = useCloak();
  const bgRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [dev, setDev] = useState(false);
  const { user, isAdmin } = useAccount();
  const [banned, setBanned] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed()) { navigate({ to: "/login" }); return; }
    setDev(isDevGate());
    setReady(true);
  }, [navigate]);

  useEffect(() => {
    if (!user) { setBanned(null); return; }
    supabase.from("bans").select("reason").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setBanned(data.reason || "You have been banned."); });
  }, [user]);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const ripple = document.createElement("span");
    ripple.className = "bg-ripple";
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    bgRef.current?.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  const signOut = () => { clearAuthed(); navigate({ to: "/login" }); };
  const brand = cloak.tabTitle || "XenoPro";
  const showDev = dev || isAdmin;
  const visibleApps = APPS.filter((a) => !a.devOnly || showDev);

  if (!ready) return null;

  if (banned) {
    return (
      <div className="grid h-screen place-items-center bg-background text-center">
        <DotCursor />
        <div className="max-w-md p-8">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="text-2xl font-bold">Account suspended</h1>
          <p className="mt-2 text-sm text-foreground/60">{banned}</p>
          <button onClick={signOut}
            className="mt-6 rounded-lg bg-white/10 px-4 py-2 text-xs hover:bg-white/15">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={bgRef} onClick={handleBgClick}
      className="relative h-screen w-screen overflow-hidden">
      <DotCursor />
      <WallpaperLayer />
      <BroadcastBanner />
      <HUD />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[12vw] font-bold tracking-tighter text-white/[0.04] leading-none">
            {brand.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Top-right utilities */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <AccountMenu />
        <button onClick={signOut}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-foreground/70 ring-1 ring-white/10 hover:bg-white/10">
          <LogOut className="h-3 w-3" /> Sign out
        </button>
      </div>

      <div className="relative z-10 grid max-h-[calc(100vh-6rem)] w-fit grid-cols-2 gap-1 p-4 pt-16 sm:p-6 sm:pt-16">
        {visibleApps.map((app) => (
          <AppIcon key={app.id} icon={app.icon} label={app.label}
            accent="oklch(0.85 0 0)"
            onClick={() => setOpenApp(app.id)} />
        ))}
      </div>

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
          {openApp === "admin" && <AdminPanel />}
        </Window>
      )}

      <Taskbar onLaunchBrowser={() => setOpenApp("browser")} />
    </div>
  );
}
