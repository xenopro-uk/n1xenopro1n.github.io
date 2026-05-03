// Samples the active wallpaper (image OR video) and sets CSS vars
// (--wp-tint, --wp-glass, --wp-text) so glass surfaces adapt to the background.
import { useEffect } from "react";
import { useWallpaper } from "@/lib/wallpaper";

function setVars(r: number, g: number, b: number) {
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const root = document.documentElement.style;
  root.setProperty("--wp-r", String(r));
  root.setProperty("--wp-g", String(g));
  root.setProperty("--wp-b", String(b));
  root.setProperty("--wp-luma", luma.toFixed(3));
  root.setProperty("--wp-tint", `rgba(${r}, ${g}, ${b}, 0.22)`);
  root.setProperty("--wp-glass", `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.setProperty("--wp-text", luma > 0.55 ? "#0a0a0a" : "#f5f5f5");
}

function sampleCanvas(c: HTMLCanvasElement) {
  try {
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; n++; }
    setVars(Math.round(r / n), Math.round(g / n), Math.round(b / n));
  } catch { /* tainted */ }
}

export function useAdaptiveTheme() {
  const { wallpaper } = useWallpaper();
  useEffect(() => {
    if (!wallpaper) {
      const r = document.documentElement.style;
      r.removeProperty("--wp-tint");
      r.removeProperty("--wp-glass");
      r.removeProperty("--wp-text");
      return;
    }
    if (wallpaper.kind === "image") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = wallpaper.url;
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 32; c.height = 32;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        try { ctx.drawImage(img, 0, 0, 32, 32); sampleCanvas(c); }
        catch { setVars(20, 20, 30); }
      };
      img.onerror = () => setVars(20, 20, 30);
      return;
    }
    // Video: try to grab the on-screen video frame periodically.
    const grab = () => {
      const v = document.querySelector<HTMLVideoElement>("video[data-wallpaper]");
      if (!v || v.readyState < 2) return;
      try {
        const c = document.createElement("canvas");
        c.width = 32; c.height = 32;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, 32, 32);
        sampleCanvas(c);
      } catch { setVars(20, 20, 30); }
    };
    grab();
    const id = setInterval(grab, 4000);
    return () => clearInterval(id);
  }, [wallpaper]);
}
