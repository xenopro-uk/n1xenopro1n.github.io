// Samples the active wallpaper and sets CSS vars (--wp-tint, --wp-text)
// so glass surfaces can adapt to the background color.
import { useEffect } from "react";
import { useWallpaper } from "@/lib/wallpaper";

function setVars(r: number, g: number, b: number) {
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  document.documentElement.style.setProperty("--wp-r", String(r));
  document.documentElement.style.setProperty("--wp-g", String(g));
  document.documentElement.style.setProperty("--wp-b", String(b));
  document.documentElement.style.setProperty("--wp-luma", luma.toFixed(3));
  document.documentElement.style.setProperty("--wp-tint", `rgba(${r}, ${g}, ${b}, 0.18)`);
  document.documentElement.style.setProperty("--wp-glass", `rgba(${r}, ${g}, ${b}, 0.10)`);
  document.documentElement.style.setProperty("--wp-text", luma > 0.55 ? "#0a0a0a" : "#f5f5f5");
}

export function useAdaptiveTheme() {
  const { wallpaper } = useWallpaper();
  useEffect(() => {
    if (!wallpaper) {
      document.documentElement.style.removeProperty("--wp-tint");
      document.documentElement.style.removeProperty("--wp-glass");
      document.documentElement.style.removeProperty("--wp-text");
      return;
    }
    if (wallpaper.kind !== "image") {
      // For videos, default to a neutral dark tint (sampling video frames cross-origin is unreliable)
      setVars(20, 20, 30);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = wallpaper.url;
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 32; c.height = 32;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; n++; }
        setVars(Math.round(r / n), Math.round(g / n), Math.round(b / n));
      } catch {
        // Cross-origin taint — fall back
        setVars(20, 20, 30);
      }
    };
    img.onerror = () => setVars(20, 20, 30);
  }, [wallpaper]);
}
