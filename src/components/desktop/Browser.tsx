import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Search, Shield, Lock, Globe, Zap } from "lucide-react";
import { proxify, useCloak, PROXY_OPTIONS, PROVIDER_FALLBACK_ORDER, type ProxyProvider } from "@/lib/cloak";

const QUICK_LINKS = [
  { name: "Google", url: "https://www.google.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Wikipedia", url: "https://en.wikipedia.org" },
  { name: "Reddit", url: "https://www.reddit.com" },
  { name: "Discord", url: "https://discord.com/app" },
  { name: "GitHub", url: "https://github.com" },
  { name: "X / Twitter", url: "https://x.com" },
  { name: "TikTok", url: "https://www.tiktok.com" },
];

export function Browser() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<string>("");
  const [iframeSrc, setIframeSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [cloak] = useCloak();
  const [provider, setProvider] = useState<ProxyProvider>(cloak.proxy);

  const navigate = (url: string, prov: ProxyProvider = provider) => {
    if (!url) return;
    setInput(url);
    setTarget(url);
    setProvider(prov);
    setLoading(true);
    setIframeSrc(proxify(url, prov));
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); navigate(input); };

  const reload = () => {
    if (iframeRef.current) {
      setLoading(true);
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const tryNext = () => {
    if (!target) return;
    const i = PROVIDER_FALLBACK_ORDER.indexOf(provider);
    const next = PROVIDER_FALLBACK_ORDER[(i + 1) % PROVIDER_FALLBACK_ORDER.length];
    navigate(target, next);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background/40">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          <button onClick={() => iframeRef.current?.contentWindow?.history.back()}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"><ArrowLeft className="h-4 w-4" /></button>
          <button onClick={() => iframeRef.current?.contentWindow?.history.forward()}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"><ArrowRight className="h-4 w-4" /></button>
          <button onClick={reload}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground">
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-white/30 transition">
          <Lock className="h-3.5 w-3.5 text-foreground/60" />
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Search the web or enter a URL"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none" />
          <Search className="h-4 w-4 text-foreground/40" />
        </form>

        <select value={provider} onChange={(e) => {
            const p = e.target.value as ProxyProvider;
            setProvider(p);
            if (target) navigate(target, p);
          }}
          className="max-w-[140px] rounded-md bg-white/5 px-2 py-1.5 text-xs text-foreground/80 outline-none ring-1 ring-white/10 hover:bg-white/10">
          {PROXY_OPTIONS.map(o => <option key={o.id} value={o.id} className="bg-background">{o.label}</option>)}
        </select>

        {target && (
          <button onClick={tryNext}
            title="Try next proxy provider"
            className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1.5 text-xs text-foreground/80 ring-1 ring-white/10 hover:bg-white/10">
            <Zap className="h-3 w-3" /> Try next
          </button>
        )}

        <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-foreground ring-1 ring-white/15">
          <Shield className="h-3 w-3" /> PROXIED
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {iframeSrc ? (
          <>
            <iframe ref={iframeRef} src={iframeSrc} onLoad={() => setLoading(false)}
              className="absolute inset-0 h-full w-full bg-white"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              referrerPolicy="no-referrer"
              title="Proxied web view" />
            {loading && (
              <div className="pointer-events-none absolute left-0 top-0 h-0.5 w-1/3 animate-pulse bg-gradient-to-r from-transparent via-white to-transparent" />
            )}
          </>
        ) : (
          <StartPage onPick={(u) => navigate(u)} />
        )}
      </div>
    </div>
  );
}

function StartPage({ onPick }: { onPick: (url: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 overflow-y-auto px-6 py-12 scrollbar-thin">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black">
          <Globe className="h-8 w-8" strokeWidth={1.8} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Xeno Proxy</h1>
        <p className="max-w-md text-center text-sm text-foreground/60">
          Routed through a stack of unblocked proxy relays. Pick any provider above — if one is blocked, hit "Try next."
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-4 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <button key={link.name} onClick={() => onPick(link.url)}
            className="group flex flex-col items-center gap-2 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
              {link.name[0]}
            </div>
            <span className="text-[11px] text-foreground/80">{link.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
