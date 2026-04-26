import { X } from "lucide-react";
import { useBroadcasts } from "@/lib/broadcasts";

export function BroadcastBanner() {
  const { banners, dismiss } = useBroadcasts();
  if (banners.length === 0) return null;
  const top = banners[0];
  return (
    <div className="absolute left-1/2 top-2 z-30 w-[min(680px,90vw)] -translate-x-1/2 rounded-xl border border-white/15 bg-black/80 px-4 py-2.5 text-sm shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-white" />
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">{top.title}</div>
          <div className="text-xs text-foreground/70">{top.body}</div>
        </div>
        <button onClick={() => dismiss(top.id)} className="rounded p-1 text-foreground/50 hover:bg-white/10">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
