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

export function Settings({ initialTab = "cloak" }: { initialTab?: Tab } = {}) {
  const [cloak, setCloak] = useCloak();
  const [draft, setDraft] = useState(cloak);
  const [tab, setTab] = useState<Tab>(initialTab);
  const { wallpaper, setWallpaper } = useWallpaper();
  const [wpDraft, setWpDraft] = useState<{ url: string; kind: WallpaperKind; loop: boolean } | null>(wallpaper);
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
      setWpDraft({ url, kind, loop: true });
      toast.success("Uploaded — press Apply to set it.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  };

  const stageUrl = () => {
    if (!urlDraft.trim()) return;
    setWpDraft({ url: urlDraft.trim(), kind: urlKind, loop: true });
    setUrlDraft("");
  };

  const applyWallpaper = async () => {
    await setWallpaper(wpDraft);
    toast.success(wpDraft ? "Wallpaper applied." : "Wallpaper cleared.");
  };

  const TABS: { id: Tab; label: string; icon: typeof SettingsIcon }[] = [
    { id: "cloak", label: "Cloak", icon: SettingsIcon },
    { id: "proxy", label: "Proxy", icon: RotateCcw },
    { id: "wallpaper", label: "Wallpaper", icon: ImageIcon },
  ];

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <SettingsIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Xeno's Cloak</span>
        <div className="ml-auto flex items-center gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ring-1 transition ${
                tab === t.id ? "bg-white/15 ring-white/30" : "ring-white/10 hover:bg-white/5"
              }`}>
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="mx-auto flex max-w-xl flex-col gap-6">

          {tab === "cloak" && (
            <section className="rounded-xl glass p-4">
              <h3 className="text-sm font-semibold">Tab Cloak</h3>
              <p className="mt-1 text-xs text-foreground/60">
                Disguise the tab title and favicon so this site looks like something else.
              </p>
              <div className="mt-4 grid gap-3">
                <label className="text-xs text-foreground/70">
                  Tab title
                  <input value={draft.tabTitle} onChange={(e) => setDraft({ ...draft, tabTitle: e.target.value })}
                    className="mt-1 w-full rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/50"
                    placeholder="XenoPro" />
                </label>
                <label className="text-xs text-foreground/70">
                  Favicon URL
                  <input value={draft.faviconUrl} onChange={(e) => setDraft({ ...draft, faviconUrl: e.target.value })}
                    className="mt-1 w-full rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/50"
                    placeholder="https://example.com/favicon.ico" />
                </label>
                <div>
                  <div className="mb-2 text-xs text-foreground/70">Quick presets</div>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button key={p.title}
                        onClick={() => setDraft({ ...draft, tabTitle: p.title, faviconUrl: p.favicon })}
                        className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10 hover:bg-white/10">
                        <img src={p.favicon} alt="" className="h-4 w-4" />
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={apply}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  <Save className="h-4 w-4" /> Apply
                </button>
                <button onClick={reset}
                  className="flex items-center justify-center gap-2 rounded-md bg-white/5 px-4 py-2 text-sm text-foreground/80 hover:bg-white/10">
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
              </div>
            </section>
          )}

          {tab === "proxy" && (
            <section className="rounded-xl glass p-4">
              <h3 className="text-sm font-semibold">Proxy Provider</h3>
              <p className="mt-1 text-xs text-foreground/60">Used by Xeno's Proxy browser.</p>
              <div className="mt-3 grid gap-2">
                {PROXIES.map((p) => (
                  <label key={p.id} className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition ${draft.proxy === p.id ? "bg-primary/10 ring-primary/40" : "ring-white/10 hover:bg-white/5"}`}>
                    <input type="radio" name="proxy"
                      checked={draft.proxy === p.id}
                      onChange={() => setDraft({ ...draft, proxy: p.id })}
                      className="mt-1 accent-primary" />
                    <div>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-foreground/50">{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={apply}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <Save className="h-4 w-4" /> Save proxy
              </button>
            </section>
          )}

          {tab === "wallpaper" && (
            <section className="rounded-xl glass p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Wallpaper</h3>
                {wpDraft && (
                  <button onClick={() => setWpDraft(null)}
                    className="flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1 text-xs text-foreground/70 hover:bg-white/10">
                    <Trash2 className="h-3 w-3" /> Clear selection
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-foreground/60">
                Pick one, paste a URL, or upload — then press <b>Apply</b> at the bottom.
              </p>

              {wpDraft && (
                <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-white/10">
                  {wpDraft.kind === "video" ? (
                    <video src={wpDraft.url} autoPlay muted loop={wpDraft.loop} playsInline
                      className="h-32 w-full object-cover" />
                  ) : (
                    <img src={wpDraft.url} alt="" className="h-32 w-full object-cover" />
                  )}
                  <div className="flex items-center gap-2 bg-white/[0.03] p-2">
                    <span className="text-[10px] uppercase tracking-wider text-foreground/40">{wpDraft.kind}</span>
                    <span className="line-clamp-1 flex-1 font-mono text-[10px] text-foreground/60">{wpDraft.url}</span>
                    {wpDraft.kind === "video" && (
                      <button onClick={() => setWpDraft({ ...wpDraft, loop: !wpDraft.loop })}
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] ring-1 ${wpDraft.loop ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "ring-white/10 text-foreground/60"}`}>
                        <Repeat className="h-3 w-3" /> {wpDraft.loop ? "Loop on" : "Loop off"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {CURATED.map((c) => (
                  <button key={c.id} onClick={() => setWpDraft({ url: c.url, kind: c.kind, loop: true })}
                    className={`group relative aspect-video overflow-hidden rounded-lg ring-1 transition ${
                      wpDraft?.url === c.url ? "ring-primary/60 ring-2" : "ring-white/10 hover:ring-white/30"
                    }`}>
                    <img src={c.thumb} alt={c.label} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <div className="text-[10px] font-medium leading-tight">{c.label}</div>
                      <div className="text-[9px] uppercase tracking-wider text-foreground/50">{c.kind}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 border-t border-white/10 pt-4">
                <div className="text-xs font-medium text-foreground/70">Use any URL</div>
                <div className="flex gap-2">
                  <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="https://… (image or .mp4)"
                    className="flex-1 rounded-md bg-white/5 px-3 py-2 text-xs outline-none ring-1 ring-white/10 focus:ring-primary/50" />
                  <select value={urlKind} onChange={(e) => setUrlKind(e.target.value as WallpaperKind)}
                    className="rounded-md bg-white/5 px-2 py-2 text-xs outline-none ring-1 ring-white/10">
                    <option value="image">image</option>
                    <option value="video">video</option>
                  </select>
                  <button onClick={stageUrl}
                    className="rounded-md bg-white/10 px-3 py-2 text-xs hover:bg-white/15">Stage</button>
                </div>

                <div className="text-xs font-medium text-foreground/70">Upload your own</div>
                <input ref={fileRef} type="file" accept="image/*,video/*" hidden
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.currentTarget.value = ""; }} />
                <button disabled={busy} onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-md bg-white/5 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50">
                  <Upload className="h-3 w-3" /> {busy ? "Uploading…" : "Choose file"}
                </button>
                <p className="text-[10px] text-foreground/40">Sign-in required to upload. Files are stored privately.</p>
              </div>

              <div className="sticky bottom-0 -mx-4 -mb-4 mt-5 flex gap-2 border-t border-white/10 bg-background/80 p-3 backdrop-blur">
                <button onClick={applyWallpaper}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  <Save className="h-4 w-4" /> Apply wallpaper
                </button>
                <button onClick={() => setWpDraft(wallpaper)}
                  className="rounded-md bg-white/5 px-4 py-2 text-sm text-foreground/70 hover:bg-white/10">
                  Revert
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

