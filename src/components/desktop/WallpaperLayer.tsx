// Renders the active wallpaper as a fixed background behind the desktop.
// Sits above the body gradient (which we hide while active) and below all UI.
import { useEffect } from "react";
import { useWallpaper } from "@/lib/wallpaper";

export function WallpaperLayer() {
  const { wallpaper } = useWallpaper();

  // Hide the body's aurora gradient while a wallpaper is active so it shows through.
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

  // Negative z so it sits behind every desktop UI element but above the body itself.
  if (wallpaper.kind === "video") {
    return (
      <video
        key={wallpaper.url}
        src={wallpaper.url}
        autoPlay
        muted
        playsInline
        loop={wallpaper.loop}
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
