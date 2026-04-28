// Renders the active wallpaper as a fixed background behind the desktop.
// Uses z-0 (not -z-10) so it sits above the body's gradient but below content.
import { useWallpaper } from "@/lib/wallpaper";

export function WallpaperLayer() {
  const { wallpaper } = useWallpaper();
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
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${wallpaper.url})` }}
    />
  );
}
