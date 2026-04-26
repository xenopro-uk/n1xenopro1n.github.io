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

function rewriteHtml(html: string, baseUrl: string, proxyBase: string): string {
  const wrap = (u: string) => `${proxyBase}?url=${encodeURIComponent(absolutize(baseUrl, u))}`;

  // Inject <base> for relative URLs and a small script to rewrite navigations
  const inject = `
<base href="${baseUrl}">
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
    // src/href rewriting
    .replace(/(\s(?:href|src|action))=["']([^"']+)["']/gi, (_m, attr, val) => {
      if (val.startsWith("data:") || val.startsWith("javascript:") || val.startsWith("#") || val.startsWith("mailto:")) return `${attr}="${val}"`;
      return `${attr}="${wrap(val)}"`;
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
        const target = reqUrl.searchParams.get("url");
        if (!target) {
          return new Response("Missing ?url=", { status: 400, headers: CORS });
        }

        let upstream: Response;
        try {
          upstream = await fetch(target, {
            redirect: "follow",
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
