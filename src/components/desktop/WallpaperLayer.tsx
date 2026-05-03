// Renders the active wallpaper as a fixed background behind the desktop.
import { useEffect } from "react";
import { useWallpaper } from "@/lib/wallpaper";

export function WallpaperLayer() {
  const { wallpaper } = useWallpaper();

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
        crossOrigin="anonymous"
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
