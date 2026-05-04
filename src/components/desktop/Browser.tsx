import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Search, Shield, Lock, Globe, Zap, Plus, X } from "lucide-react";
import { proxify, useCloak, PROXY_OPTIONS, PROVIDER_FALLBACK_ORDER, type ProxyProvider } from "@/lib/cloak";

const QUICK_LINKS = [
  { name: "YouTube",  url: "https://www.youtube.com",         icon: "https://www.youtube.com/s/desktop/22617fde/img/logos/favicon_144x144.png" },
  { name: "Discord",  url: "https://discord.com/app",         icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" },
  { name: "GitHub",   url: "https://github.com",              icon: "https://github.githubassets.com/favicons/favicon-dark.png" },
  { name: "TikTok",   url: "https://www.tiktok.com",          icon: "https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png" },
  { name: "GeForce NOW",     url: "https://play.geforcenow.com", icon: "https://play.geforcenow.com/favicon.ico" },
  { name: "Xbox Cloud Gaming", url: "https://www.xbox.com/play", icon: "https://www.xbox.com/favicon.ico" },
  { name: "Spotify",  url: "https://open.spotify.com",        icon: "https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png" },
  { name: "Netflix",  url: "https://www.netflix.com",         icon: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2023.ico" },
];

interface Tab {
  id: string;
  title: string;
  input: string;
  target: string;
  iframeSrc: string;
  provider: ProxyProvider;
  loading: boolean;
}

let nextId = 1;
const newTab = (provider: ProxyProvider): Tab => ({
  id: `t${nextId++}`,
  title: "New tab",
  input: "",
  target: "",
  iframeSrc: "",
  provider,
  loading: false,
});

export function Browser() {
  const [cloak] = useCloak();
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab(cloak.proxy)]);
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const iframes = useRef<Record<string, HTMLIFrameElement | null>>({});
  const active = tabs.find((t) => t.id === activeId)!;

  const update = (id: string, patch: Partial<Tab>) =>
    setTabs((arr) => arr.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const navigate = (id: string, url: string, prov?: ProxyProvider) => {
    if (!url) return;
    const t = tabs.find((x) => x.id === id);
    if (!t) return;
    const provider = prov ?? t.provider;
    update(id, {
      input: url, target: url, provider, loading: true,
      iframeSrc: proxify(url, provider),
      title: url.replace(/^https?:\/\//, "").split("/")[0] || "Loading…",
    });
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); navigate(active.id, active.input); };

  const reload = () => {
    const f = iframes.current[active.id];
    if (!f) return;
    update(active.id, { loading: true });
    // eslint-disable-next-line no-self-assign
    f.src = f.src;
  };

  const tryNext = () => {
    if (!active.target) return;
    const i = PROVIDER_FALLBACK_ORDER.indexOf(active.provider);
    const next = PROVIDER_FALLBACK_ORDER[(i + 1) % PROVIDER_FALLBACK_ORDER.length];
    navigate(active.id, active.target, next);
  };

  const addTab = () => {
    const t = newTab(cloak.proxy);
    setTabs((arr) => [...arr, t]);
    setActiveId(t.id);
  };
  const closeTab = (id: string) => {
    setTabs((arr) => {
      const next = arr.filter((t) => t.id !== id);
      if (next.length === 0) {
        const t = newTab(cloak.proxy);
        setActiveId(t.id);
        return [t];
      }
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background/40">
      {/* Tab strip */}
      <div className="flex items-end gap-1 border-b border-white/10 bg-black/30 px-2 pt-2">
        {tabs.map((t) => (
          <div key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`group flex max-w-[180px] cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1.5 text-[11px] transition ${
              t.id === activeId ? "bg-background/60 text-foreground" : "bg-white/5 text-foreground/55 hover:bg-white/10"
            }`}>
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">{t.title}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              className="opacity-50 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="rounded p-1 text-foreground/60 hover:bg-white/10 hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          <button onClick={() => iframes.current[active.id]?.contentWindow?.history.back()}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"><ArrowLeft className="h-4 w-4" /></button>
          <button onClick={() => iframes.current[active.id]?.contentWindow?.history.forward()}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground"><ArrowRight className="h-4 w-4" /></button>
          <button onClick={reload}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-white/10 hover:text-foreground">
            <RotateCw className={`h-4 w-4 ${active.loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-white/30 transition">
          <Lock className="h-3.5 w-3.5 text-foreground/60" />
          <input value={active.input} onChange={(e) => update(active.id, { input: e.target.value })}
            placeholder="Search the web or enter a URL"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none" />
          <Search className="h-4 w-4 text-foreground/40" />
        </form>

        <select value={active.provider} onChange={(e) => {
            const p = e.target.value as ProxyProvider;
            if (active.target) navigate(active.id, active.target, p);
            else update(active.id, { provider: p });
          }}
          className="max-w-[140px] rounded-md bg-white/5 px-2 py-1.5 text-xs text-foreground/80 outline-none ring-1 ring-white/10 hover:bg-white/10">
          {PROXY_OPTIONS.map(o => <option key={o.id} value={o.id} className="bg-background">{o.label}</option>)}
        </select>

        {active.target && (
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
        {tabs.map((t) => (
          <div key={t.id} className="absolute inset-0" style={{ visibility: t.id === activeId ? "visible" : "hidden" }}>
            {t.iframeSrc ? (
              <iframe ref={(el) => { iframes.current[t.id] = el; }}
                src={t.iframeSrc}
                onLoad={() => update(t.id, { loading: false })}
                className="absolute inset-0 h-full w-full bg-white"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                referrerPolicy="no-referrer"
                title="Proxied web view" />
            ) : (
              <StartPage onPick={(u) => navigate(t.id, u)} />
            )}
            {t.loading && t.id === activeId && (
              <div className="pointer-events-none absolute left-0 top-0 h-0.5 w-1/3 animate-pulse bg-gradient-to-r from-transparent via-white to-transparent" />
            )}
          </div>
        ))}
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
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/10">
              <img src={link.icon} alt="" className="h-7 w-7 object-contain"
                onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display = "none"; }} />
            </div>
            <span className="text-[11px] text-foreground/80">{link.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
