import { useRef, useState } from "react";
import { Settings as SettingsIcon, Save, RotateCcw, Image as ImageIcon, Upload, Trash2, Repeat } from "lucide-react";
import { useCloak, type ProxyProvider, PROXY_OPTIONS } from "@/lib/cloak";
import { useWallpaper, uploadWallpaperFile, CURATED, type WallpaperKind } from "@/lib/wallpaper";
import { toast } from "sonner";

const PRESETS = [
  { title: "Google", favicon: "https://www.google.com/favicon.ico" },
  { title: "Google Classroom", favicon: "https://ssl.gstatic.com/classroom/favicon.png" },
  { title: "Google Docs", favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4.ico" },
  { title: "Khan Academy", favicon: "https://cdn.kastatic.org/images/favicon.ico" },
  { title: "Wikipedia", favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico" },
  { title: "Canvas", favicon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
];

const PROXIES = PROXY_OPTIONS;

type Tab = "cloak" | "proxy" | "wallpaper";

export function Settings() {
  const [cloak, setCloak] = useCloak();
  const [draft, setDraft] = useState(cloak);
  const [tab, setTab] = useState<Tab>("cloak");
  const { wallpaper, setWallpaper } = useWallpaper();
  const [urlDraft, setUrlDraft] = useState("");
  const [urlKind, setUrlKind] = useState<WallpaperKind>("image");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = () => setCloak(draft);
  const reset = () => {
    const fresh = { tabTitle: "XenoPro", faviconUrl: "", proxy: "croxy" as ProxyProvider };
    setDraft(fresh); setCloak(fresh);
  };

  const onUpload = async (f: File) => {
    setBusy(true);
    try {
      const { url, kind } = await uploadWallpaperFile(f);
      await setWallpaper({ url, kind, loop: true });
      toast.success("Wallpaper updated.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  };

  const applyUrl = async () => {
    if (!urlDraft.trim()) return;
    await setWallpaper({ url: urlDraft.trim(), kind: urlKind, loop: true });
    setUrlDraft("");
    toast.success("Wallpaper applied.");
  };

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <SettingsIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Cloak & Proxy Settings</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <section className="rounded-xl glass p-4">
            <h3 className="text-sm font-semibold">Tab Cloak</h3>
            <p className="mt-1 text-xs text-foreground/60">
              Disguise the tab title and favicon so this site looks like something else.
            </p>
            <div className="mt-4 grid gap-3">
              <label className="text-xs text-foreground/70">
                Tab title
                <input
                  value={draft.tabTitle}
                  onChange={(e) => setDraft({ ...draft, tabTitle: e.target.value })}
                  className="mt-1 w-full rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/50"
                  placeholder="XenoPro"
                />
              </label>
              <label className="text-xs text-foreground/70">
                Favicon URL
                <input
                  value={draft.faviconUrl}
                  onChange={(e) => setDraft({ ...draft, faviconUrl: e.target.value })}
                  className="mt-1 w-full rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/50"
                  placeholder="https://example.com/favicon.ico"
                />
              </label>
              <div>
                <div className="mb-2 text-xs text-foreground/70">Quick presets</div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.title}
                      onClick={() => setDraft({ ...draft, tabTitle: p.title, faviconUrl: p.favicon })}
                      className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10 hover:bg-white/10"
                    >
                      <img src={p.favicon} alt="" className="h-4 w-4" />
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl glass p-4">
            <h3 className="text-sm font-semibold">Proxy Provider</h3>
            <p className="mt-1 text-xs text-foreground/60">Used by the Proxy Browser.</p>
            <div className="mt-3 grid gap-2">
              {PROXIES.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition ${draft.proxy === p.id ? "bg-primary/10 ring-primary/40" : "ring-white/10 hover:bg-white/5"}`}>
                  <input
                    type="radio"
                    name="proxy"
                    checked={draft.proxy === p.id}
                    onChange={() => setDraft({ ...draft, proxy: p.id })}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-foreground/50">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="flex gap-2">
            <button
              onClick={apply}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Save className="h-4 w-4" /> Apply
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-md bg-white/5 px-4 py-2 text-sm text-foreground/80 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
