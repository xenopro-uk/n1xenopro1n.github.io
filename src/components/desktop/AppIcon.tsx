import { type LucideIcon } from "lucide-react";

interface AppIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: string;
}

export function AppIcon({ icon: Icon, label, onClick, accent }: AppIconProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/60"
    >
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl glass transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-10px_oklch(0.78_0.18_200/0.5)]"
        style={accent ? { boxShadow: `inset 0 0 0 1px ${accent}33, 0 8px 24px -12px ${accent}66` } : undefined}
      >
        <Icon className="h-6 w-6 text-foreground/90" strokeWidth={1.6} />
      </div>
      <span className="text-[11px] font-medium leading-tight text-foreground/80 text-center">
        {label}
      </span>
    </button>
  );
}
