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
  category: "anime" | "gaming" | "abstract" | "nature";
}

// Curated wallpapers — pexels videos and images (CORS + hotlink friendly).
const px = (id: string, w = 1920) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=${w}`;
const pxv = (id: string, file: string) => `https://videos.pexels.com/video-files/${id}/${file}`;

export const CURATED: CuratedWallpaper[] = [
  // Anime / Aesthetic vibes
  { id: "anime-night", label: "Anime Night", category: "anime", kind: "video",
    thumb: px("2693212", 400), url: pxv("2887463", "2887463-hd_1920_1080_25fps.mp4") },
  { id: "neon-rain", label: "Neon Rain", category: "anime", kind: "video",
    thumb: px("2693529", 400), url: pxv("2491284", "2491284-uhd_2560_1440_24fps.mp4") },
  { id: "tokyo-street", label: "Tokyo Street", category: "anime", kind: "video",
    thumb: px("2614818", 400), url: pxv("3015527", "3015527-hd_1920_1080_24fps.mp4") },
  { id: "sakura", label: "Sakura Drift", category: "anime", kind: "image",
    thumb: px("1408221", 400), url: px("1408221") },

  // Gaming
  { id: "god-of-war", label: "Warrior", category: "gaming", kind: "video",
    thumb: px("3617457", 400), url: pxv("3045163", "3045163-hd_1920_1080_24fps.mp4") },
  { id: "cyberpunk", label: "Cyber City", category: "gaming", kind: "video",
    thumb: px("3052361", 400), url: pxv("2887463", "2887463-hd_1920_1080_25fps.mp4") },
  { id: "neon-arena", label: "Neon Arena", category: "gaming", kind: "image",
    thumb: px("2110951", 400), url: px("2110951") },

  // Abstract
  { id: "particles", label: "Particles", category: "abstract", kind: "video",
    thumb: px("1146134", 400), url: pxv("3045163", "3045163-hd_1920_1080_24fps.mp4") },
  { id: "liquid", label: "Liquid Ink", category: "abstract", kind: "video",
    thumb: px("1342460", 400), url: pxv("3214448", "3214448-hd_1920_1080_25fps.mp4") },
  { id: "neon-grid", label: "Neon Grid", category: "abstract", kind: "image",
    thumb: px("2832382", 400), url: px("2832382") },

  // Nature
  { id: "mountain", label: "Mountain", category: "nature", kind: "image",
    thumb: px("417074", 400), url: px("417074") },
  { id: "ocean", label: "Ocean Waves", category: "nature", kind: "video",
    thumb: px("355288", 400), url: pxv("1093662", "1093662-hd_1920_1080_30fps.mp4") },
  { id: "forest", label: "Forest", category: "nature", kind: "image",
    thumb: px("38136", 400), url: px("38136") },
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

  // Hydrate from cloud on mount
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

// Upload a file to the `wallpapers` storage bucket
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
