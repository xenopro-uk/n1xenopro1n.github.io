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

// Curated public looping wallpapers (mp4 + image hotlink-friendly hosts).
export const CURATED: CuratedWallpaper[] = [
  // Anime
  { id: "gojo-floating", label: "Gojo Floating", category: "anime",
    kind: "video",
    thumb: "https://i.imgur.com/M3mZjK7.jpg",
    url: "https://cdn.pixabay.com/video/2023/10/26/186314-877723657_large.mp4" },
  { id: "yuji-domain", label: "Yuji Domain", category: "anime",
    kind: "video",
    thumb: "https://i.imgur.com/h2YkZBb.jpg",
    url: "https://cdn.pixabay.com/video/2024/05/10/210619_large.mp4" },
  { id: "kaneki-mask", label: "Kaneki Mask", category: "anime",
    kind: "video",
    thumb: "https://i.imgur.com/5G2XJBx.jpg",
    url: "https://cdn.pixabay.com/video/2022/03/30/112861-695121375_large.mp4" },
  { id: "anime-city", label: "Anime City", category: "anime",
    kind: "video",
    thumb: "https://images.pexels.com/photos/2693212/pexels-photo-2693212.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2023/06/21/167540-839357815_large.mp4" },

  // Gaming
  { id: "god-of-war", label: "God of War — Kratos", category: "gaming",
    kind: "video",
    thumb: "https://images.pexels.com/photos/3617457/pexels-photo-3617457.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2022/12/19/142692-781239580_large.mp4" },
  { id: "cyberpunk", label: "Cyberpunk Night", category: "gaming",
    kind: "video",
    thumb: "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2022/12/05/141103-777964519_large.mp4" },
  { id: "valorant", label: "Neon Arena", category: "gaming",
    kind: "video",
    thumb: "https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2024/02/29/202375-919535172_large.mp4" },

  // Abstract
  { id: "particles", label: "Particles", category: "abstract",
    kind: "video",
    thumb: "https://images.pexels.com/photos/1146134/pexels-photo-1146134.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2020/09/18/50113-460274441_large.mp4" },
  { id: "liquid", label: "Liquid Ink", category: "abstract",
    kind: "video",
    thumb: "https://images.pexels.com/photos/1342460/pexels-photo-1342460.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2021/10/12/91744-633332836_large.mp4" },
  { id: "neon-grid", label: "Neon Grid", category: "abstract",
    kind: "video",
    thumb: "https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg?w=400",
    url: "https://cdn.pixabay.com/video/2022/10/22/136011-762486551_large.mp4" },

  // Nature stills
  { id: "mountain", label: "Mountain", category: "nature",
    kind: "image",
    thumb: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?w=400",
    url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?w=1920" },
  { id: "ocean", label: "Ocean", category: "nature",
    kind: "image",
    thumb: "https://images.pexels.com/photos/355288/pexels-photo-355288.jpeg?w=400",
    url: "https://images.pexels.com/photos/355288/pexels-photo-355288.jpeg?w=1920" },
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
