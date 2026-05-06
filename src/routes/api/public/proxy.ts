import { createFileRoute } from "@tanstack/react-router";

// Server-side fetch+rewrite proxy. Bypasses X-Frame-Options / CSP that block iframes.
// Usage: /api/public/proxy?url=<encoded url>

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function absolutize(base: string, ref: string): string {
  try {
    return new URL(ref, base).toString();
  } catch {
    return ref;
  }
}

// Block SSRF: reject non-http(s) schemes and private/loopback/link-local hosts.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) return true;
  // IPv6 loopback / link-local / unique-local
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4 literal
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast / reserved
  }
  return false;
}

function validateTarget(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, reason: "Invalid URL" }; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, reason: "Only http(s) allowed" };
  if (isBlockedHost(u.hostname)) return { ok: false, reason: "Host not allowed" };
  return { ok: true, url: u };
}

function rewriteHtml(html: string, baseUrl: string, proxyBase: string): string {
  const baseMatch = html.match(/<base[^>]+href=["']([^"']+)["'][^>]*>/i);
  const assetBase = baseMatch ? absolutize(baseUrl, baseMatch[1]) : baseUrl;
  const wrap = (u: string) => `${proxyBase}?url=${encodeURIComponent(absolutize(assetBase, u))}`;

  // Inject <base> for relative URLs and a small script to rewrite navigations
  const inject = `
<base href="${assetBase}">
<script>
(function(){
  var P = ${JSON.stringify(proxyBase)};
  function wrap(u){ try { return P + '?url=' + encodeURIComponent(new URL(u, document.baseURI).toString()); } catch(e){ return u; } }
  // Rewrite link clicks
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:')) return;
    e.preventDefault();
    window.location.href = wrap(href);
  }, true);
  // Rewrite form submissions (GET only)
  document.addEventListener('submit', function(e){
    var f = e.target;
    if (!f || f.method.toLowerCase() !== 'get') return;
    e.preventDefault();
    var fd = new FormData(f);
    var qs = new URLSearchParams(fd).toString();
    var action = f.getAttribute('action') || window.location.href;
    var sep = action.indexOf('?') === -1 ? '?' : '&';
    window.location.href = wrap(action + sep + qs);
  }, true);
})();
</script>`;

  // Rewrite href and src attributes to go through proxy
  let out = html
    // strip CSP meta tags
    .replace(/<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "")
    // remove upstream base tags, then inject a corrected one before scripts run
    .replace(/<base[^>]*>/gi, "")
    // src/href rewriting
    .replace(/(\s(?:href|src|action|poster))=["']([^"']+)["']/gi, (_m, attr, val) => {
      if (val.startsWith("data:") || val.startsWith("javascript:") || val.startsWith("#") || val.startsWith("mailto:")) return `${attr}="${val}"`;
      return `${attr}="${wrap(val)}"`;
    })
    .replace(/(\ssrcset)=["']([^"']+)["']/gi, (_m, attr, val) => {
      const rewritten = val.split(",").map((part: string) => {
        const bits = part.trim().split(/\s+/);
        const u = bits.shift() ?? "";
        if (!u || u.startsWith("data:")) return part.trim();
        return [wrap(u), ...bits].join(" ");
      }).join(", ");
      return `${attr}="${rewritten}"`;
    });

  // Inject base + script after <head>
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => m + inject);
  } else {
    out = inject + out;
  }
  return out;
}

function rewriteCss(css: string, baseUrl: string, proxyBase: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_m, q, u) => {
    if (u.startsWith("data:")) return `url(${q}${u}${q})`;
    const abs = absolutize(baseUrl, u);
    return `url(${q}${proxyBase}?url=${encodeURIComponent(abs)}${q})`;
  });
}

export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        if (reqUrl.searchParams.get("ping") === "1") {
          return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
            status: 200,
            headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" },
          });
        }
        const target = reqUrl.searchParams.get("url");
        if (!target) {
          return new Response("Missing ?url=", { status: 400, headers: CORS });
        }
        const v = validateTarget(target);
        if (!v.ok) {
          return new Response(`Blocked: ${v.reason}`, { status: 400, headers: CORS });
        }

        let upstream: Response;
        try {
          upstream = await fetch(v.url.toString(), {
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
              "Accept":
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });
        } catch (e) {
          return new Response(`Proxy fetch failed: ${(e as Error).message}`, {
            status: 502,
            headers: CORS,
          });
        }

        const finalUrl = upstream.url || target;
        const ct = upstream.headers.get("content-type") || "";
        const proxyBase = `${reqUrl.origin}/api/public/proxy`;

        // Build response headers — strip frame-blocking headers
        const respHeaders = new Headers(CORS);
        respHeaders.set("content-type", ct);
        // explicitly do NOT forward X-Frame-Options, Content-Security-Policy

        if (ct.includes("text/html")) {
          const html = await upstream.text();
          const rewritten = rewriteHtml(html, finalUrl, proxyBase);
          return new Response(rewritten, { status: upstream.status, headers: respHeaders });
        }
        if (ct.includes("text/css")) {
          const css = await upstream.text();
          const rewritten = rewriteCss(css, finalUrl, proxyBase);
          return new Response(rewritten, { status: upstream.status, headers: respHeaders });
        }
        // binary / other — passthrough
        const buf = await upstream.arrayBuffer();
        return new Response(buf, { status: upstream.status, headers: respHeaders });
      },
    },
  },
});
