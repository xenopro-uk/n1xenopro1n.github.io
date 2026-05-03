// A folder icon on the desktop. Click opens a tray; left-click on title renames.
import { useEffect, useRef, useState } from "react";
import { Folder as FolderIcon, X } from "lucide-react";

interface FolderIconProps {
  id: string;
  name: string;
  x: number;
  y: number;
  count: number;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onOpen: () => void;
}

export function FolderTile({ name, x, y, count, onMove, onDrop, onOpen }: FolderIconProps) {
  const drag = useRef<{ dx: number; dy: number; moved: boolean; lastX: number; lastY: number } | null>(null);

  useEffect(() => {
    const onMoveEv = (ev: PointerEvent) => {
      if (!drag.current) return;
      const nx = ev.clientX - drag.current.dx;
      const ny = ev.clientY - drag.current.dy;
      if (Math.abs(nx - x) > 3 || Math.abs(ny - y) > 3) drag.current.moved = true;
      const cx = Math.max(8, Math.min(window.innerWidth - 80, nx));
      const cy = Math.max(60, Math.min(window.innerHeight - 100, ny));
      drag.current.lastX = cx; drag.current.lastY = cy;
      onMove(cx, cy);
    };
    const onUp = () => {
      if (drag.current?.moved) onDrop(drag.current.lastX, drag.current.lastY);
      drag.current = null;
    };
    window.addEventListener("pointermove", onMoveEv);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMoveEv);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onMove, onDrop, x, y]);

  return (
    <div
      onPointerDown={(e) => { drag.current = { dx: e.clientX - x, dy: e.clientY - y, moved: false, lastX: x, lastY: y }; }}
      style={{ position: "absolute", left: x, top: y, touchAction: "none", zIndex: 10 }}
    >
      <button
        onClick={() => { if (!drag.current?.moved) onOpen(); }}
        className="group flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 focus:outline-none"
      >
        <div className="relative grid h-14 w-14 grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl adaptive-glass p-1.5 transition-all duration-300 group-hover:-translate-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded bg-white/15" />
          ))}
        </div>
        <span className="line-clamp-1 max-w-[5rem] text-[11px] font-medium leading-tight"
          style={{ color: "var(--wp-text, currentColor)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {name} <span className="opacity-60">({count})</span>
        </span>
      </button>
    </div>
  );
}

interface FolderModalProps {
  name: string;
  appIds: string[];
  resolveApp: (id: string) => { label: string; icon: React.ComponentType<{ className?: string }> } | null;
  onRename: (name: string) => void;
  onOpenApp: (id: string) => void;
  onRemoveApp: (id: string) => void;
  onClose: () => void;
}

export function FolderModal({ name, appIds, resolveApp, onRename, onOpenApp, onRemoveApp, onClose }: FolderModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-[min(420px,90vw)] rounded-2xl border border-white/10 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <FolderIcon className="h-4 w-4 text-foreground/60" />
          {editing ? (
            <input autoFocus value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { onRename(draft.trim() || "Folder"); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="flex-1 rounded bg-white/5 px-2 py-1 text-sm outline-none ring-1 ring-white/15" />
          ) : (
            <button onClick={() => setEditing(true)} className="flex-1 text-left text-sm font-medium hover:underline">
              {name}
            </button>
          )}
          <button onClick={onClose} className="rounded p-1 text-foreground/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-[10px] uppercase tracking-wider text-foreground/40">
          Click name to rename · drag an app out to remove
        </p>
        <div className="grid grid-cols-3 gap-2">
          {appIds.map((id) => {
            const a = resolveApp(id);
            if (!a) return null;
            const Ico = a.icon;
            return (
              <div key={id} className="group relative">
                <button onClick={() => onOpenApp(id)}
                  className="flex w-full flex-col items-center gap-1 rounded-lg p-2 hover:bg-white/5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <Ico className="h-5 w-5" />
                  </div>
                  <span className="line-clamp-1 text-[10px]">{a.label}</span>
                </button>
                <button onClick={() => onRemoveApp(id)}
                  className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white/70 hover:bg-black group-hover:block"
                  title="Remove from folder">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
