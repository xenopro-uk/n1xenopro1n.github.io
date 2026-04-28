// Renders the active wallpaper as a fixed background behind the desktop.
import { useWallpaper } from "@/lib/wallpaper";

export function WallpaperLayer() {
  const { wallpaper } = useWallpaper();
  if (!wallpaper) return null;

  if (wallpaper.kind === "video") {
    return (
      <video
        key={wallpaper.url}
        src={wallpaper.url}
        autoPlay muted playsInline
        loop={wallpaper.loop}
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-70"
      />
    );
  }
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-80"
      style={{ backgroundImage: `url(${wallpaper.url})` }}
    />
  );
}
