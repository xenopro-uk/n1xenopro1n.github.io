import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe, Gamepad2, Sparkles, Newspaper,
  Settings as SettingsIcon, Film, Music, Calculator as CalcIcon,
  LogOut, Shield, School, type LucideIcon,
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
import { District } from "@/components/desktop/District";
import { FolderTile, FolderModal } from "@/components/desktop/FolderTile";
import { useCloak } from "@/lib/cloak";
import { isAuthed, clearAuthed } from "@/lib/auth-gate";
import { useAccount } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/surveillance";
import { usePresenceHeartbeat } from "@/lib/presence";
import { useAdaptiveTheme } from "@/lib/adaptive-theme";
import { useAppPositions } from "@/lib/app-positions";
import { useFolders } from "@/lib/folders";

export const Route = createFileRoute("/")({
  component: Desktop,
  head: () => ({
    meta: [{ title: "XenoPro" }, { name: "description", content: "XenoPro desktop." }],
  }),
});

type AppId = "browser" | "ai" | "games" | "news" | "settings" | "cinema" | "music" | "calc" | "admin" | "district";
interface AppDef { id: AppId; label: string; icon: LucideIcon; adminOnly?: boolean }

const APPS: AppDef[] = [
  { id: "browser",  label: "Xeno's Proxy",    icon: Globe },
  { id: "ai",       label: "Xeno's AI",       icon: Sparkles },
  { id: "games",    label: "Games",           icon: Gamepad2 },
  { id: "cinema",   label: "Xeno's Cinema",   icon: Film },
  { id: "music",    label: "Xeno's Sonic",    icon: Music },
  { id: "news",     label: "Xeno's Wire",     icon: Newspaper },
  { id: "calc",     label: "Xeno's Calc",     icon: CalcIcon },
  { id: "district", label: "District",        icon: School },
  { id: "settings", label: "Xeno's Cloak",    icon: SettingsIcon },
  { id: "admin",    label: "Xeno's Dev",      icon: Shield, adminOnly: true },
];

// Grid (iPhone-style snap)
const CELL_W = 96;
const CELL_H = 104;
const GRID_LEFT = 32;
const GRID_TOP = 80;
const COLS = 8;

function cellToXY(c: number, r: number) {
  return { x: GRID_LEFT + c * CELL_W, y: GRID_TOP + r * CELL_H };
}
function xyToCell(x: number, y: number) {
  const c = Math.max(0, Math.min(COLS - 1, Math.round((x - GRID_LEFT) / CELL_W)));
  const r = Math.max(0, Math.round((y - GRID_TOP) / CELL_H));
  return { c, r };
}
function cellKey(c: number, r: number) { return `${c},${r}`; }

function defaultLayout(ids: string[]): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  ids.forEach((id, i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    out[id] = cellToXY(c, r);
  });
  return out;
}

function Desktop() {
  const navigate = useNavigate();
  const [openApp, setOpenApp] = useState<AppId | null>(null);
  const [settingsTab, setSettingsTab] = useState<"cloak" | "proxy" | "wallpaper">("cloak");
  const [cloak] = useCloak();
  const bgRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const { user, isAdmin } = useAccount();
  const [banned, setBanned] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  // dragPos = transient (during drag); committed via positions on drop
  const [dragPos, setDragPos] = useState<Record<string, { x: number; y: number }>>({});

  usePresenceHeartbeat();
  useAdaptiveTheme();
  const { positions, setPosition } = useAppPositions();
  const { folders, createFolder, renameFolder, moveFolder, addToFolder, removeFromFolder, deleteFolder } = useFolders();

  useEffect(() => {
    if (!isAuthed()) { navigate({ to: "/login" }); return; }
    setReady(true);
    void logActivity("session.start", "desktop", {});
  }, [navigate]);

  useEffect(() => {
    if (!user) { setBanned(null); return; }
    supabase.from("bans").select("reason").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setBanned(data.reason || "You have been banned."); });
  }, [user]);

  const visibleApps = useMemo(
    () => APPS.filter((a) => !a.adminOnly || isAdmin),
    [isAdmin],
  );

  // App ids that are inside a folder — they don't render on the desktop
  const inFolderIds = useMemo(() =>
    new Set(folders.flatMap((f) => f.appIds)),
    [folders],
  );

  const desktopApps = useMemo(
    () => visibleApps.filter((a) => !inFolderIds.has(a.id)),
    [visibleApps, inFolderIds],
  );

  const layout = useMemo(() => {
    const def = defaultLayout(desktopApps.map((a) => a.id));
    return Object.fromEntries(
      desktopApps.map((a) => [a.id, positions[a.id] ?? def[a.id]]),
    );
  }, [desktopApps, positions]);

  // Map every cell -> what's in it (app id or folder id)
  const occupancy = useMemo(() => {
    const m = new Map<string, { kind: "app" | "folder"; id: string }>();
    for (const a of desktopApps) {
      const p = layout[a.id];
      const { c, r } = xyToCell(p.x, p.y);
      m.set(cellKey(c, r), { kind: "app", id: a.id });
    }
    for (const f of folders) {
      const { c, r } = xyToCell(f.x, f.y);
      m.set(cellKey(c, r), { kind: "folder", id: f.id });
    }
    return m;
  }, [desktopApps, folders, layout]);

  const findEmptyCell = (preferC: number, preferR: number, exclude: string) => {
    const occ = new Map(occupancy);
    occ.delete(cellKey(preferC, preferR));
    // Remove the moving piece so it doesn't block itself
    for (const [k, v] of occ) if (v.id === exclude) occ.delete(k);
    if (!occ.has(cellKey(preferC, preferR))) return { c: preferC, r: preferR };
    // Spiral search
    for (let radius = 1; radius < 12; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nc = preferC + dc, nr = preferR + dr;
          if (nc < 0 || nc >= COLS || nr < 0) continue;
          if (!occ.has(cellKey(nc, nr))) return { c: nc, r: nr };
        }
      }
    }
    return { c: preferC, r: preferR };
  };

  const handleAppDrop = (appId: string, x: number, y: number) => {
    setDragPos((p) => { const n = { ...p }; delete n[appId]; return n; });
    const { c, r } = xyToCell(x, y);
    const target = occupancy.get(cellKey(c, r));
    // Same cell → no-op
    if (target?.kind === "app" && target.id === appId) return;
    // Drop onto folder → add to folder
    if (target?.kind === "folder") {
      addToFolder(target.id, appId);
      return;
    }
    // Drop onto another app → create folder containing both
    if (target?.kind === "app" && target.id !== appId) {
      const pos = cellToXY(c, r);
      createFolder([target.id, appId], pos.x, pos.y);
      return;
    }
    // Empty cell — snap (with collision search)
    const slot = findEmptyCell(c, r, appId);
    const snap = cellToXY(slot.c, slot.r);
    setPosition(appId, snap);
  };

  const handleFolderDrop = (folderId: string, x: number, y: number) => {
    const { c, r } = xyToCell(x, y);
    const slot = findEmptyCell(c, r, folderId);
    const snap = cellToXY(slot.c, slot.r);
    moveFolder(folderId, snap.x, snap.y);
  };

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

  const resolveApp = (id: string) => {
    const a = APPS.find((x) => x.id === id);
    return a ? { label: a.label, icon: a.icon } : null;
  };
  const folder = folders.find((f) => f.id === openFolder);

  return (
    <div ref={bgRef} onClick={handleBgClick}
      className="relative h-screen w-screen overflow-hidden">
      <DotCursor />
      <WallpaperLayer />
      <BroadcastBanner />
      <HUD />
      <DesktopContextMenu
        onChangeWallpaper={() => { setSettingsTab("wallpaper"); setOpenApp("settings"); }}
        onOpenProxy={() => setOpenApp("browser")}
        onSignOut={signOut}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl" />
      </div>

      {/* Top-right utilities */}
      <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
        <AccountMenu />
        <button onClick={signOut}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-foreground/70 ring-1 ring-white/10 hover:bg-white/10">
          <LogOut className="h-3 w-3" /> Sign out
        </button>
      </div>

      {/* Grid: snap-positioned apps + folders */}
      <div className="relative z-10 h-full w-full">
        {desktopApps.map((app) => {
          const pos = dragPos[app.id] ?? layout[app.id];
          return (
            <AppIcon key={app.id} icon={app.icon} label={app.label}
              accent="oklch(0.85 0 0)"
              x={pos.x} y={pos.y}
              onMove={(x, y) => setDragPos((p) => ({ ...p, [app.id]: { x, y } }))}
              onDrop={(x, y) => handleAppDrop(app.id, x, y)}
              onClick={() => { void logActivity("app.open", app.id, { label: app.label }); setOpenApp(app.id); }} />
          );
        })}
        {folders.map((f) => (
          <FolderTile key={f.id} id={f.id} name={f.name} x={f.x} y={f.y}
            count={f.appIds.length}
            onMove={(x, y) => moveFolder(f.id, x, y)}
            onDrop={(x, y) => handleFolderDrop(f.id, x, y)}
            onOpen={() => setOpenFolder(f.id)} />
        ))}
      </div>

      {openFolder && folder && (
        <FolderModal
          name={folder.name}
          appIds={folder.appIds}
          resolveApp={resolveApp}
          onRename={(n) => renameFolder(folder.id, n)}
          onOpenApp={(id) => { setOpenFolder(null); setOpenApp(id as AppId); }}
          onRemoveApp={(id) => {
            removeFromFolder(folder.id, id);
            // If the folder is now empty, close & delete it
            if (folder.appIds.length <= 1) { deleteFolder(folder.id); setOpenFolder(null); }
          }}
          onClose={() => setOpenFolder(null)}
        />
      )}

      {openApp && (
        <Window title={APPS.find((a) => a.id === openApp)?.label ?? ""}
          onClose={() => { void logActivity("app.close", openApp); setOpenApp(null); }}>
          {openApp === "browser" && <Browser />}
          {openApp === "ai" && <AI />}
          {openApp === "games" && <Games />}
          {openApp === "cinema" && <Cinema />}
          {openApp === "news" && <News />}
          {openApp === "music" && <MusicApp />}
          {openApp === "calc" && <Calculator />}
          {openApp === "district" && <District />}
          {openApp === "settings" && <Settings initialTab={settingsTab} />}
          {openApp === "admin" && <AdminPanel />}
        </Window>
      )}

      <Taskbar onLaunchBrowser={() => setOpenApp("browser")} />
    </div>
  );
}
