import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Search, Shield, Lock, Globe } from "lucide-react";
import { proxify, useCloak } from "@/lib/cloak";

const QUICK_LINKS = [
  { name: "Google", url: "https://www.google.com", color: "#4285F4" },
  { name: "YouTube", url: "https://www.youtube.com", color: "#FF0000" },
  { name: "Wikipedia", url: "https://en.wikipedia.org", color: "#ffffff" },
  { name: "Reddit", url: "https://www.reddit.com", color: "#FF4500" },
  { name: "Discord", url: "https://discord.com/app", color: "#5865F2" },
  { name: "GitHub", url: "https://github.com", color: "#ffffff" },
  { name: "Twitter / X", url: "https://x.com", color: "#1DA1F2" },
  { name: "TikTok", url: "https://www.tiktok.com", color: "#69C9D0" },
];

export function Browser() {
  const [input, setInput] = useState("");
  const [iframeSrc, setIframeSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [cloak] = useCloak();

  const navigate = (url: string) => {
    if (!url) return;
    setInput(url);
    setLoading(true);
    setIframeSrc(proxify(url, cloak.proxy));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(input);
  };

  const reload = () => {
    if (iframeRef.current) {
      setLoading(true);
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background/40">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => iframeRef.current?.contentWindow?.history.back()}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => iframeRef.current?.contentWindow?.history.forward()}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={reload}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-primary/60 transition">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search the web or enter a URL"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
          />
          <Search className="h-4 w-4 text-foreground/40" />
        </form>

        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <Shield className="h-3 w-3" />
          PROXIED
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {iframeSrc ? (
          <>
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              onLoad={() => setLoading(false)}
              className="absolute inset-0 h-full w-full bg-white"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              title="Proxied web view"
            />
            {loading && (
              <div className="pointer-events-none absolute left-0 top-0 h-0.5 w-1/3 animate-pulse bg-gradient-to-r from-transparent via-primary to-transparent" />
            )}
          </>
        ) : (
          <StartPage onPick={navigate} />
        )}
      </div>
    </div>
  );
}

function StartPage({ onPick }: { onPick: (url: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 overflow-y-auto px-6 py-12 scrollbar-thin">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow">
          <Globe className="h-8 w-8 text-primary-foreground" strokeWidth={1.8} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-gradient">Orbit</span> Proxy
        </h1>
        <p className="max-w-md text-center text-sm text-foreground/60">
          A private window into the open web. Routed through an unblocked relay — your IP stays yours.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-4 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.name}
            onClick={() => onPick(link.url)}
            className="group flex flex-col items-center gap-2 rounded-xl glass p-3 transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold"
              style={{ background: `${link.color}22`, color: link.color, boxShadow: `inset 0 0 0 1px ${link.color}33` }}
            >
              {link.name[0]}
            </div>
            <span className="text-[11px] text-foreground/80">{link.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
