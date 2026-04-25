import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  thumbnail?: string;
  author?: string;
}

const FEEDS = [
  { name: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { name: "Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Reuters", url: "https://feeds.reuters.com/reuters/topNews" },
];

export function News() {
  const [feed, setFeed] = useState(FEEDS[0]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async (url: string) => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      const j = await r.json();
      if (j.status !== "ok") throw new Error(j.message || "Feed failed");
      setItems(j.items.slice(0, 30));
    } catch (e: any) {
      setErr(e.message ?? "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(feed.url); }, [feed.url]);

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Newspaper className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Wire — Live News</span>
        <div className="ml-auto flex gap-1">
          {FEEDS.map((f) => (
            <button
              key={f.name}
              onClick={() => setFeed(f)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                feed.name === f.name
                  ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                  : "text-foreground/60 hover:bg-white/5"
              }`}
            >
              {f.name}
            </button>
          ))}
          <button
            onClick={() => load(feed.url)}
            className="rounded-full p-1.5 text-foreground/60 hover:bg-white/5"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {err && <div className="text-sm text-destructive">{err}</div>}
        {!err && items.length === 0 && !loading && (
          <div className="text-sm text-foreground/50">No items.</div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((it, i) => (
            <a
              key={i}
              href={it.link}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl glass p-3 transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              {it.thumbnail && (
                <img
                  src={it.thumbnail}
                  alt=""
                  className="mb-2 h-32 w-full rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex items-start gap-2">
                <h3 className="flex-1 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                  {it.title}
                </h3>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />
              </div>
              {it.description && (
                <p
                  className="mt-1 line-clamp-2 text-xs text-foreground/60"
                  dangerouslySetInnerHTML={{ __html: it.description.replace(/<[^>]+>/g, "") }}
                />
              )}
              <div className="mt-2 text-[10px] uppercase tracking-wider text-foreground/40">
                {new Date(it.pubDate).toLocaleString()}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
