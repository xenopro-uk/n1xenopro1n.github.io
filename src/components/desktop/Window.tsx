import { X, Minus, Square } from "lucide-react";
import { type ReactNode } from "react";

interface WindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Window({ title, onClose, children }: WindowProps) {
  return (
    <div className="absolute inset-4 md:inset-10 z-30 flex animate-in fade-in zoom-in-95 duration-300">
      <div className="flex w-full flex-col overflow-hidden rounded-2xl glass-strong shadow-[0_30px_80px_-20px_oklch(0_0_0/0.7)]">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="group h-3 w-3 rounded-full bg-destructive/80 transition hover:bg-destructive"
              aria-label="Close"
            >
              <X className="m-auto h-2 w-2 text-destructive-foreground opacity-0 group-hover:opacity-100" strokeWidth={3} />
            </button>
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs font-medium tracking-wide text-foreground/70">{title}</span>
          <div className="flex items-center gap-1 text-foreground/40">
            <Minus className="h-3.5 w-3.5" />
            <Square className="h-3 w-3" />
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
