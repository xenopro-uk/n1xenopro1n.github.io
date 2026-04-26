// Cloak / proxy settings persisted to localStorage
import { useEffect, useState } from "react";

export type ProxyProvider =
  | "xeno"        // our own server-side proxy (best)
  | "scramjet"    // Scramjet engine routed through our proxy
  | "webcrawler"  // WebCrawler-style search-then-proxy
  | "croxy"
  | "plainproxies"
  | "hideme"
  | "proxysite"
  | "weboas"
  | "blockaway"
  | "novpn"
  | "ferns"
  | "voidnetworks"
  | "lucide"
  | "koopbin"
  | "googletranslate"
  | "googlecache"
  | "duckduckgo"
  | "direct";

export interface ProxyOption {
  id: ProxyProvider;
  label: string;
  desc: string;
}

export const PROXY_OPTIONS: ProxyOption[] = [
  { id: "xeno",         label: "Xeno Proxy (recommended)", desc: "Our own server-side proxy. Strips X-Frame and CSP — works on most sites." },
  { id: "scramjet",     label: "Scramjet Engine",          desc: "Service-worker style rewriting routed through our backend." },
  { id: "webcrawler",   label: "WebCrawler",               desc: "Search-and-fetch — finds the page first, then proxies it." },
  { id: "ferns",        label: "Ferns",                    desc: "Ferns-style relay routed through Xeno proxy." },
  { id: "voidnetworks", label: "Void Networks",            desc: "Void-style relay routed through Xeno proxy." },
  { id: "lucide",       label: "Lucide",                   desc: "Lucide-style relay routed through Xeno proxy." },
  { id: "koopbin",      label: "Koopbin",                  desc: "Koopbin-style relay routed through Xeno proxy." },
  { id: "croxy",        label: "CroxyProxy",               desc: "Reliable general-purpose web proxy." },
  { id: "plainproxies", label: "PlainProxies",             desc: "Fast UK-based web proxy." },
  { id: "hideme",       label: "Hide.me",                  desc: "Privacy-focused web proxy." },
  { id: "proxysite",    label: "ProxySite",                desc: "Classic free proxy." },
  { id: "weboas",       label: "Weboas.is",                desc: "Lightweight EU proxy." },
  { id: "blockaway",    label: "Blockaway",                desc: "School-network friendly." },
  { id: "novpn",        label: "NoVPN",                    desc: "Simple anonymous proxy." },
  { id: "googletranslate", label: "Google Translate",      desc: "The classic bypass — works where others don't." },
  { id: "googlecache",  label: "Google Cache",             desc: "Read cached snapshots of pages." },
  { id: "duckduckgo",   label: "DuckDuckGo Search",        desc: "Route everything as a search query." },
  { id: "direct",       label: "Direct iframe",            desc: "Fastest, but most sites refuse to embed." },
];

export interface CloakSettings {
  tabTitle: string;
  faviconUrl: string;
  proxy: ProxyProvider;
}

const KEY = "xenopro:cloak";

const DEFAULTS: CloakSettings = {
  tabTitle: "XenoPro",
  faviconUrl: "",
  proxy: "xeno",
};

export function loadCloak(): CloakSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveCloak(s: CloakSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  applyCloak(s);
  window.dispatchEvent(new CustomEvent("cloak:change", { detail: s }));
}

export function applyCloak(s: CloakSettings) {
  if (typeof document === "undefined") return;
  if (s.tabTitle) document.title = s.tabTitle;
  if (s.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = s.faviconUrl;
  }
}

export function useCloak(): [CloakSettings, (s: CloakSettings) => void] {
  const [s, setS] = useState<CloakSettings>(DEFAULTS);
  useEffect(() => {
    const v = loadCloak();
    setS(v);
    applyCloak(v);
    const onChange = (e: Event) => setS((e as CustomEvent).detail);
    window.addEventListener("cloak:change", onChange);
    return () => window.removeEventListener("cloak:change", onChange);
  }, []);
  return [s, (next) => { setS(next); saveCloak(next); }];
}

// Build a proxy URL for the given provider.
export function proxify(rawUrl: string, provider: ProxyProvider = "xeno"): string {
  let url = rawUrl.trim();
  if (!url) return "";
  const isUrl = /^https?:\/\//.test(url) || /\.[a-z]{2,}/i.test(url);
  if (!isUrl) {
    // Search query — wrap as DuckDuckGo HTML search through our proxy if xeno
    if (provider === "xeno") {
      const search = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
      return `/api/public/proxy?url=${encodeURIComponent(search)}`;
    }
    return `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
  }
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;
  const enc = encodeURIComponent(url);
  const host = url.replace(/^https?:\/\//, "");
  switch (provider) {
    case "xeno":         return `/api/public/proxy?url=${enc}`;
    case "scramjet":     return `/api/public/proxy?engine=scramjet&url=${enc}`;
    case "webcrawler":   return `/api/public/proxy?engine=webcrawler&url=${enc}`;
    case "ferns":        return `/api/public/proxy?engine=ferns&url=${enc}`;
    case "voidnetworks": return `/api/public/proxy?engine=void&url=${enc}`;
    case "lucide":       return `/api/public/proxy?engine=lucide&url=${enc}`;
    case "koopbin":      return `/api/public/proxy?engine=koopbin&url=${enc}`;
    case "direct":       return url;
    case "duckduckgo":   return `https://duckduckgo.com/?q=${enc}`;
    case "plainproxies": return `https://plainproxies.com/api/v2?url=${enc}`;
    case "hideme":       return `https://hide.me/en/proxy?u=${enc}`;
    case "proxysite":    return `https://eu1.proxysite.com/process.php?d=${enc}`;
    case "weboas":       return `https://weboas.is/?q=${enc}`;
    case "blockaway":    return `https://www.blockaway.net/browse.php?u=${enc}&b=4`;
    case "novpn":        return `https://www.novpn.net/browse.php?u=${enc}`;
    case "googletranslate":
      return `https://translate.google.com/translate?sl=ja&tl=en&u=${enc}`;
    case "googlecache":
      return `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(host)}`;
    case "croxy":
    default:
      return `https://www.croxyproxy.com/_public/api?url=${enc}`;
  }
}

// Try a list of providers in order — caller can fall back if the iframe stays blank.
export const PROVIDER_FALLBACK_ORDER: ProxyProvider[] = [
  "xeno", "croxy", "plainproxies", "hideme", "blockaway", "proxysite", "googletranslate", "duckduckgo",
];
