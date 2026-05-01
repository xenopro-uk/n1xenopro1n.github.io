import { type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AppIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: string;
  /** Absolute positioning when provided (iPhone-style draggable layout). */
  x?: number;
  y?: number;
  onMove?: (x: number, y: number) => void;
}

export function AppIcon({ icon: Icon, label, onClick, accent, x, y, onMove }: AppIconProps) {
  const draggable = typeof x === "number" && typeof y === "number" && !!onMove;
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!draggable) return;
    const onMoveEv = (ev: PointerEvent) => {
      if (!drag.current) return;
      const nx = ev.clientX - drag.current.dx;
      const ny = ev.clientY - drag.current.dy;
      if (Math.abs(nx - (x ?? 0)) > 3 || Math.abs(ny - (y ?? 0)) > 3) drag.current.moved = true;
      onMove?.(Math.max(8, Math.min(window.innerWidth - 80, nx)), Math.max(60, Math.min(window.innerHeight - 100, ny)));
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener("pointermove", onMoveEv);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMoveEv);
      window.removeEventListener("pointerup", onUp);
    };
  }, [draggable, onMove, x, y]);

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    drag.current = { dx: e.clientX - (x ?? 0), dy: e.clientY - (y ?? 0), moved: false };
  };
  const handleClick = () => {
    if (drag.current?.moved) return;
    onClick?.();
  };

  const inner = (
    <button
      onClick={handleClick}
      className="group flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-300 focus:outline-none"
    >
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl adaptive-glass transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-10px_oklch(0.78_0.18_200/0.5)]"
        style={accent ? { boxShadow: `inset 0 0 0 1px ${accent}33, 0 8px 24px -12px ${accent}66` } : undefined}
      >
        <Icon className="h-6 w-6" style={{ color: "var(--wp-text, currentColor)" }} strokeWidth={1.6} />
      </div>
      <span className="text-[11px] font-medium leading-tight text-center" style={{ color: "var(--wp-text, currentColor)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
        {label}
      </span>
    </button>
  );

  if (!draggable) return inner;

  return (
    <div
      ref={ref}
      onPointerDown={start}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{ position: "absolute", left: x, top: y, touchAction: "none", cursor: hover ? "grab" : undefined }}
    >
      {inner}
    </div>
  );
}
