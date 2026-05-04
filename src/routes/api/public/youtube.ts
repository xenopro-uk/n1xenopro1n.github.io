// Keyless YouTube scraper — parses public search/trending HTML and returns
// { videoId, title, channel, thumb }[]. No API key required.
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

async function scrape(url: string): Promise<Item[]> {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!r.ok) throw new Error(`yt ${r.status}`);
  const html = await r.text();
  const m = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
  if (!m) return [];
  let data: unknown;
  try { data = JSON.parse(m[1]); } catch { return []; }
  const items: Item[] = [];
  walk(data, items, new Set());
  return items.slice(0, 30);
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
          const url = action === "trending"
            ? "https://www.youtube.com/feed/trending?bp=4gIcGhpGRXdoYXRfdG9fd2F0Y2hfbXVzaWNfdGFi" // Music tab
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`; // videos only
          const items = await scrape(url);
          return json({ items });
        } catch (e) {
          return json({ error: (e as Error).message, items: [] }, 502);
        }
      },
    },
  },
});
