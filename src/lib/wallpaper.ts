// Wallpaper system: curated library + user uploads + URL paste.
// Persists to Supabase `wallpapers` table when signed in, else localStorage.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WallpaperKind = "image" | "video";
export interface Wallpaper {
  url: string;
  kind: WallpaperKind;
  loop: boolean;
}

const LS_KEY = "xenopro:wallpaper";

export interface CuratedWallpaper {
  id: string;
  label: string;
  thumb: string;
  url: string;
  kind: WallpaperKind;
  category: "anime" | "marvel" | "abstract" | "minecraft";
}

// Motionbgs direct mp4 sources (live wallpaper feed).
const mb = (id: string, slug: string, res: "3840x2160" | "960x540" = "3840x2160") =>
  `https://motionbgs.com/media/${id}/${slug}.${res}.mp4`;
const mbThumb = (id: string, slug: string) =>
  `https://motionbgs.com/i/c/640x360/media/${id}/${slug}.jpg`;

export const CURATED: CuratedWallpaper[] = [
  // Anime
  { id: "miku-star-eyes", label: "Hatsune Miku Star Eyes", category: "anime", kind: "video",
    thumb: mbThumb("9465", "hatsune-miku-star-eyes"), url: mb("9465", "hatsune-miku-star-eyes") },
  { id: "miku-nakano", label: "Miku Nakano Manga", category: "anime", kind: "video",
    thumb: mbThumb("4552", "miku-nakano-manga"), url: mb("4552", "miku-nakano-manga", "960x540") },
  { id: "girl-curtains", label: "Girl Behind Curtains", category: "anime", kind: "video",
    thumb: mbThumb("8925", "girl-behind-curtains-3"), url: mb("8925", "girl-behind-curtains-3") },
  { id: "gojo-vs-sukuna", label: "Gojo vs Sukuna", category: "anime", kind: "video",
    thumb: "/wallpapers/gojo-vs-sukuna.jpg", url: "/wallpapers/gojo-vs-sukuna.mp4" },
  { id: "wallhack-sora", label: "Sora Awakening", category: "anime", kind: "video",
    thumb: "/wallpapers/wallhack-awakening-sora.jpg", url: "/wallpapers/wallhack-awakening-sora.mp4" },

  // Marvel / Heroes
  { id: "ss-black-silence", label: "Silver Surfer · Black Silence", category: "marvel", kind: "video",
    thumb: mbThumb("9079", "silver-surfer-black-silence"), url: mb("9079", "silver-surfer-black-silence") },
  { id: "ss-cosmic-void", label: "Silver Surfer · Cosmic Void", category: "marvel", kind: "video",
    thumb: mbThumb("9078", "silver-surfer-cosmic-void"), url: mb("9078", "silver-surfer-cosmic-void") },

  // Abstract
  { id: "windows-glitch", label: "Windows Glitch Logo", category: "abstract", kind: "video",
    thumb: mbThumb("1937", "windows-glitch-logo"), url: mb("1937", "windows-glitch-logo", "960x540") },
  { id: "gravity-abyss", label: "Gravity's Dark Abyss", category: "abstract", kind: "video",
    thumb: mbThumb("7010", "gravitys-dark-abyss"), url: mb("7010", "gravitys-dark-abyss") },
  { id: "celestial-veil", label: "Celestial Veil", category: "abstract", kind: "video",
    thumb: "/wallpapers/celestial-veil.jpg", url: "/wallpapers/celestial-veil.mp4" },

  // Minecraft / nature
  { id: "mc-northern", label: "Minecraft Northern Lights", category: "minecraft", kind: "video",
    thumb: "/wallpapers/minecraft-northern-light.jpg", url: "/wallpapers/minecraft-northern-light.mp4" },
];

const DEFAULT: Wallpaper | null = null;

function readLocal(): Wallpaper | null {
  if (typeof window === "undefined") return DEFAULT;
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : DEFAULT; } catch { return DEFAULT; }
}
function writeLocal(w: Wallpaper | null) {
  if (typeof window === "undefined") return;
  if (w) localStorage.setItem(LS_KEY, JSON.stringify(w));
  else localStorage.removeItem(LS_KEY);
}

export function useWallpaper() {
  const [wp, setWp] = useState<Wallpaper | null>(() => readLocal());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("wallpapers")
        .select("url,kind,loop").eq("user_id", user.id).maybeSingle();
      if (alive && data) {
        const next: Wallpaper = { url: data.url, kind: (data.kind as WallpaperKind) ?? "image", loop: data.loop ?? true };
        setWp(next); writeLocal(next);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const save = useCallback(async (next: Wallpaper | null) => {
    setWp(next); writeLocal(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !next) return;
    await supabase.from("wallpapers").upsert({
      user_id: user.id, url: next.url, kind: next.kind, loop: next.loop,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }, []);

  return { wallpaper: wp, setWallpaper: save, loading };
}

export async function uploadWallpaperFile(file: File): Promise<{ url: string; kind: WallpaperKind }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to upload wallpapers.");
  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("wallpapers").upload(path, file, {
    cacheControl: "3600", upsert: true, contentType: file.type,
  });
  if (error) throw error;
  const { data } = await supabase.storage.from("wallpapers").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (!data?.signedUrl) throw new Error("Could not create signed URL.");
  const kind: WallpaperKind = file.type.startsWith("video/") ? "video" : "image";
  return { url: data.signedUrl, kind };
}
