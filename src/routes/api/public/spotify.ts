import { createFileRoute } from "@tanstack/react-router";

// Spotify Web API proxy using Client Credentials flow.
// Keeps CLIENT_ID/SECRET server-side. Returns normalized track shape.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let cachedToken: { token: string; exp: number } | null = null;

async function getToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify credentials not configured");

  if (cachedToken && cachedToken.exp > Date.now() + 30_000) return cachedToken.token;

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`Token failed: ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cachedToken.token;
}

interface SpotifyImage { url: string; width: number; height: number }
interface SpotifyTrack {
  id: string; name: string; preview_url: string | null;
  artists: { name: string }[];
  album: { name: string; images: SpotifyImage[] };
}

function normalize(t: SpotifyTrack) {
  const img = t.album?.images?.[0]?.url ?? "";
  return {
    trackId: t.id,
    trackName: t.name,
    artistName: (t.artists ?? []).map((a) => a.name).join(", "),
    collectionName: t.album?.name ?? "",
    artworkUrl: img,
    previewUrl: t.preview_url ?? "",
  };
}

export const Route = createFileRoute("/api/public/spotify")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const action = url.searchParams.get("action") ?? "search";
          const token = await getToken();
          const headers = { Authorization: `Bearer ${token}` };

          if (action === "search") {
            const q = url.searchParams.get("q") ?? "top hits";
            const r = await fetch(
              `https://api.spotify.com/v1/search?type=track&limit=40&q=${encodeURIComponent(q)}`,
              { headers },
            );
            const j = (await r.json()) as { tracks?: { items: SpotifyTrack[] } };
            const items = (j.tracks?.items ?? []).map(normalize);
            return new Response(JSON.stringify({ items }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          if (action === "featured") {
            // Use a curated multi-genre search instead of deprecated featured-playlists endpoint
            const seeds = ["top hits 2026", "new music friday", "viral hits", "today's top"];
            const q = seeds[Math.floor(Math.random() * seeds.length)];
            const r = await fetch(
              `https://api.spotify.com/v1/search?type=track&limit=40&q=${encodeURIComponent(q)}`,
              { headers },
            );
            const j = (await r.json()) as { tracks?: { items: SpotifyTrack[] } };
            const items = (j.tracks?.items ?? []).map(normalize);
            return new Response(JSON.stringify({ items }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          return new Response(JSON.stringify({ error: "unknown action" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return new Response(JSON.stringify({ error: msg, items: [] }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
