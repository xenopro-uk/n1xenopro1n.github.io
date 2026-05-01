// YouTube Data API v3 proxy (server-side, hides API key).
// GET /api/public/youtube?action=search&q=foo
// GET /api/public/youtube?action=trending
import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

interface YTSearchItem {
  id: { videoId?: string };
  snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; high?: { url: string } } };
}
interface YTVideoItem {
  id: string;
  snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; high?: { url: string } } };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=300" },
  });

export const Route = createFileRoute("/api/public/youtube")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const key = process.env.YOUTUBE_API_KEY;
        if (!key) return json({ error: "YOUTUBE_API_KEY not configured" }, 500);

        const u = new URL(request.url);
        const action = u.searchParams.get("action") ?? "search";
        const q = u.searchParams.get("q") ?? "music";

        try {
          if (action === "trending") {
            const r = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=10&maxResults=24&regionCode=US&key=${key}`,
            );
            if (!r.ok) return json({ error: `YT ${r.status}` }, 502);
            const j = await r.json() as { items: YTVideoItem[] };
            return json({
              items: j.items.map((it) => ({
                videoId: it.id,
                title: it.snippet.title,
                channel: it.snippet.channelTitle,
                thumb: it.snippet.thumbnails.high?.url || it.snippet.thumbnails.medium?.url || "",
              })),
            });
          }
          // default: search
          const r = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=24&q=${encodeURIComponent(q)}&key=${key}`,
          );
          if (!r.ok) return json({ error: `YT ${r.status}` }, 502);
          const j = await r.json() as { items: YTSearchItem[] };
          return json({
            items: j.items
              .filter((it) => it.id.videoId)
              .map((it) => ({
                videoId: it.id.videoId!,
                title: it.snippet.title,
                channel: it.snippet.channelTitle,
                thumb: it.snippet.thumbnails.high?.url || it.snippet.thumbnails.medium?.url || "",
              })),
          });
        } catch (e) {
          return json({ error: (e as Error).message }, 502);
        }
      },
    },
  },
});
