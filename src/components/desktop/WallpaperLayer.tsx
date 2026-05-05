// Renders the active wallpaper as a fixed background behind the desktop.
import { useEffect } from "react";
import { CURATED, useWallpaper } from "@/lib/wallpaper";

export function WallpaperLayer() {
  const { wallpaper, setWallpaper } = useWallpaper();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (wallpaper) {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "#000";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    }
  }, [wallpaper]);

  useEffect(() => {
    if (CURATED.length === 0) return;
    let index = Math.max(0, CURATED.findIndex((w) => w.url === wallpaper?.url));
    const id = window.setInterval(() => {
      index = (index + 1) % CURATED.length;
      const next = CURATED[index];
      void setWallpaper({ url: next.url, kind: next.kind, loop: true });
    }, 90_000);
    return () => window.clearInterval(id);
  }, [setWallpaper, wallpaper?.url]);

  if (!wallpaper) return null;

  if (wallpaper.kind === "video") {
    return (
      <video
        key={wallpaper.url}
        src={wallpaper.url}
        autoPlay
        muted
        playsInline
        loop={wallpaper.loop}
        data-wallpaper
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
      style={{ backgroundImage: `url(${wallpaper.url})` }}
    />
  );
}
