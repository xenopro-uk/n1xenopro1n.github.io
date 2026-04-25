// Cloak / proxy settings persisted to localStorage
import { useEffect, useState } from "react";

export type ProxyProvider = "croxy" | "direct" | "duckduckgo";

export interface CloakSettings {
  tabTitle: string;
  faviconUrl: string;
  proxy: ProxyProvider;
}

const KEY = "xenopro:cloak";

const DEFAULTS: CloakSettings = {
  tabTitle: "XenoPro",
  faviconUrl: "",
  proxy: "croxy",
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

export function proxify(rawUrl: string, provider: ProxyProvider = "croxy"): string {
  let url = rawUrl.trim();
  if (!url) return "";
  const isUrl = /^https?:\/\//.test(url) || /\.[a-z]{2,}/i.test(url);
  if (!isUrl) {
    return `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
  }
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;
  switch (provider) {
    case "direct":
      return url;
    case "duckduckgo":
      return `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
    case "croxy":
    default:
      return `https://www.croxyproxy.com/_public/api?url=${encodeURIComponent(url)}`;
  }
}
