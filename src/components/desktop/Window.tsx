import { X, Maximize2, Minimize2, Move } from "lucide-react";
import { useRef, useState, type ReactNode, type PointerEvent as RPE } from "react";

interface WindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  initial?: { x?: number; y?: number; w?: number; h?: number };
}

export function Window({ title, onClose, children, initial }: WindowProps) {
  const [full, setFull] = useState(false);
  const [pos, setPos] = useState(() => ({
    x: initial?.x ?? Math.max(20, (typeof window !== "undefined" ? window.innerWidth : 1200) / 2 - 480),
    y: initial?.y ?? Math.max(20, (typeof window !== "undefined" ? window.innerHeight : 800) / 2 - 320),
    w: initial?.w ?? 960,
    h: initial?.h ?? 640,
  }));
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: RPE<HTMLDivElement>) => {
    if (full) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  };
  const onPointerMove = (e: RPE<HTMLDivElement>) => {
    if (!drag.current) return;
    setPos((p) => ({ ...p, x: e.clientX - drag.current!.dx, y: e.clientY - drag.current!.dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const style = full
    ? { inset: 0, width: undefined, height: undefined }
    : { left: pos.x, top: pos.y, width: pos.w, height: pos.h };

  return (
    <div
      className={`absolute z-30 flex animate-in fade-in zoom-in-95 duration-200 ${full ? "" : ""}`}
      style={style as React.CSSProperties}
    >
      <div className="flex w-full flex-col overflow-hidden rounded-2xl glass-strong shadow-[0_30px_80px_-20px_oklch(0_0_0/0.7)]">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`flex select-none items-center justify-between border-b border-white/10 px-4 py-2.5 ${full ? "" : "cursor-move"}`}
        >
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="group h-3 w-3 rounded-full bg-destructive/80 transition hover:bg-destructive"
              aria-label="Close">
              <X className="m-auto h-2 w-2 text-destructive-foreground opacity-0 group-hover:opacity-100" strokeWidth={3} />
            </button>
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <button onClick={() => setFull((v) => !v)}
              className="group h-3 w-3 rounded-full bg-emerald-500/70 transition hover:bg-emerald-500"
              aria-label={full ? "Restore" : "Maximize"}>
              {full
                ? <Minimize2 className="m-auto h-2 w-2 text-black opacity-0 group-hover:opacity-100" strokeWidth={3} />
                : <Maximize2 className="m-auto h-2 w-2 text-black opacity-0 group-hover:opacity-100" strokeWidth={3} />}
            </button>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-foreground/70">
            <Move className="h-3 w-3 text-foreground/30" />
            {title}
          </span>
          <button onClick={() => setFull((v) => !v)}
            className="rounded p-1 text-foreground/40 hover:bg-white/5 hover:text-foreground"
            aria-label="Toggle fullscreen">
            {full ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
