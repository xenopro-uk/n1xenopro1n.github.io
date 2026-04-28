// Right-click menu for the desktop background.
import { useEffect, useState } from "react";
import { Image as ImageIcon, Globe, LogOut } from "lucide-react";

interface Props {
  onChangeWallpaper: () => void;
  onOpenProxy: () => void;
  onSignOut: () => void;
}

interface MenuPos { x: number; y: number }

export function DesktopContextMenu({ onChangeWallpaper, onOpenProxy, onSignOut }: Props) {
  const [pos, setPos] = useState<MenuPos | null>(null);

  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Only trigger when right-clicking on empty desktop areas, not inside windows/inputs.
      if (t.closest("[data-window]") || t.closest("input") || t.closest("textarea") || t.closest("button") || t.closest("a") || t.closest("[data-noctx]")) {
        return;
      }
      e.preventDefault();
      const w = 200, h = 130;
      setPos({
        x: Math.min(e.clientX, window.innerWidth - w - 8),
        y: Math.min(e.clientY, window.innerHeight - h - 8),
      });
    };
    const onClick = () => setPos(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPos(null); };
    window.addEventListener("contextmenu", onCtx);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!pos) return null;

  const item = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-foreground/85 hover:bg-white/10";

  return (
    <div
      data-noctx
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[100] w-[200px] rounded-lg border border-white/10 bg-background/95 p-1 shadow-2xl backdrop-blur-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button className={item} onClick={() => { setPos(null); onChangeWallpaper(); }}>
        <ImageIcon className="h-3.5 w-3.5" /> Change wallpaper
      </button>
      <button className={item} onClick={() => { setPos(null); onOpenProxy(); }}>
        <Globe className="h-3.5 w-3.5" /> Open Xeno's Proxy
      </button>
      <div className="my-1 h-px bg-white/10" />
      <button className={item + " text-red-300 hover:bg-red-500/10"} onClick={() => { setPos(null); onSignOut(); }}>
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}
