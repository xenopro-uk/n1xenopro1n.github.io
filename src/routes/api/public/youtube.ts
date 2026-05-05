// YouTube Data API proxy — keeps the API key server-side and returns
// { videoId, title, channel, thumb }[].
// GET /api/public/youtube?action=search&q=foo
// GET /api/public/youtube?action=trending
import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=300" },
  });

interface YTRenderer {
  videoId?: string;
  title?: { runs?: { text: string }[]; simpleText?: string };
  longBylineText?: { runs?: { text: string }[] };
  ownerText?: { runs?: { text: string }[] };
  shortBylineText?: { runs?: { text: string }[] };
  thumbnail?: { thumbnails?: { url: string }[] };
}
interface Item { videoId: string; title: string; channel: string; thumb: string }

function walk(node: unknown, out: Item[], seen: Set<string>) {
  if (!node || typeof node !== "object") return;
  const r = (node as { videoRenderer?: YTRenderer; gridVideoRenderer?: YTRenderer; compactVideoRenderer?: YTRenderer });
  const v = r.videoRenderer ?? r.gridVideoRenderer ?? r.compactVideoRenderer;
  if (v && v.videoId && !seen.has(v.videoId)) {
    const title = v.title?.runs?.map((x) => x.text).join("") ?? v.title?.simpleText ?? "";
    const channel =
      v.longBylineText?.runs?.[0]?.text ??
      v.ownerText?.runs?.[0]?.text ??
      v.shortBylineText?.runs?.[0]?.text ??
      "";
    const thumb = v.thumbnail?.thumbnails?.slice(-1)[0]?.url ?? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
    if (title) {
      seen.add(v.videoId);
      out.push({ videoId: v.videoId, title, channel, thumb });
    }
  }
  if (Array.isArray(node)) {
    for (const c of node) walk(c, out, seen);
  } else {
    for (const k of Object.keys(node)) walk((node as Record<string, unknown>)[k], out, seen);
  }
}

async function searchApi(action: string, q: string): Promise<Item[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube key missing");
  const query = action === "trending" ? "today top music official audio" : q;
  const r = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=30&q=${encodeURIComponent(query)}&key=${key}`,
  );
  if (!r.ok) throw new Error(`yt ${r.status}`);
  const j = await r.json() as { items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; thumbnails?: Record<string, { url: string }> } }[] };
  return (j.items ?? []).flatMap((it) => {
    const videoId = it.id?.videoId;
    const s = it.snippet;
    if (!videoId || !s?.title) return [];
    return [{ videoId, title: s.title, channel: s.channelTitle ?? "YouTube", thumb: s.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }];
  });
}

export const Route = createFileRoute("/api/public/youtube")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const action = u.searchParams.get("action") ?? "search";
        const q = u.searchParams.get("q") ?? "music";
        try {
          const items = await searchApi(action, q);
          return json({ items });
        } catch (e) {
          return json({ error: (e as Error).message, items: [] }, 502);
        }
      },
    },
  },
});
