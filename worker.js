/**
 * worker.js - Cloudflare Worker compatible single-file handler for:
 * - Directory management (create/delete)
 * - Uploading image URLs to directories
 * - Serving a random image for a directory (redirect)
 *
 * KV binding name expected: wj
 *
 * Deploy:
 * - Bind your KV namespace to the variable `wj` in your Worker/Pages settings.
 *
 * Routes:
 * - GET  /             -> admin UI (index.html) (served from static files when deployed as Pages)
 * - GET  /api/dir?dir=DIR            -> list images in DIR
 * - POST /api/dir                     -> create directory { "dir": "img/cover" }
 * - DELETE /api/dir?dir=DIR           -> delete directory
 * - POST /api/upload                  -> add image { "dir": "img/cover", "url": "https://..." }
 * - DELETE /api/image                 -> remove image { "dir": "img/cover", "url": "https://..." }
 * - GET  /r/<dir>                     -> redirect to a random image in directory
 * - GET  /random?dir=DIR              -> same as /r/<dir>
 *
 * Note: This file is intended to be deployed either as a Worker (with static files hosted separately)
 * or as a Pages Functions file. If serving static files via this worker, embed them or use a Pages static site.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // CORS helper
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Serve API under /api, random under /r or /random
  if (pathname.startsWith("/api") || pathname === "/random" || pathname.startsWith("/r/")) {
    try {
      // List directory
      if (method === "GET" && pathname.startsWith("/api/dir")) {
        const dir = url.searchParams.get("dir");
        if (!dir) {
          return jsonResponse({ ok: false, error: "missing dir param" }, 400, CORS_HEADERS);
        }
        const key = `dir:${dir}`;
        const v = await env.wj.get(key);
        const arr = v ? JSON.parse(v) : [];
        return jsonResponse({ ok: true, dir, items: arr }, 200, CORS_HEADERS);
      }

      // create dir
      if (method === "POST" && pathname === "/api/dir") {
        const body = await request.json();
        const dir = body.dir;
        if (!dir) return jsonResponse({ ok: false, error: "missing dir" }, 400, CORS_HEADERS);
        const key = `dir:${dir}`;
        const existing = await env.wj.get(key);
        if (existing) return jsonResponse({ ok: false, error: "dir exists" }, 409, CORS_HEADERS);
        await env.wj.put(key, JSON.stringify([]));
        return jsonResponse({ ok: true, dir }, 201, CORS_HEADERS);
      }

      // delete dir
      if (method === "DELETE" && pathname.startsWith("/api/dir")) {
        const dir = url.searchParams.get("dir");
        if (!dir) return jsonResponse({ ok: false, error: "missing dir" }, 400, CORS_HEADERS);
        const key = `dir:${dir}`;
        await env.wj.delete(key);
        return jsonResponse({ ok: true, dir }, 200, CORS_HEADERS);
      }

      // upload image URL to dir
      if (method === "POST" && pathname === "/api/upload") {
        const body = await request.json();
        const dir = body.dir;
        const imageUrl = body.url;
        if (!dir || !imageUrl) return jsonResponse({ ok: false, error: "missing dir or url" }, 400, CORS_HEADERS);
        const key = `dir:${dir}`;
        const existing = await env.wj.get(key);
        const arr = existing ? JSON.parse(existing) : [];
        if (!arr.includes(imageUrl)) arr.push(imageUrl);
        await env.wj.put(key, JSON.stringify(arr));
        return jsonResponse({ ok: true, dir, url: imageUrl, items: arr }, 200, CORS_HEADERS);
      }

      // delete image
      if (method === "DELETE" && pathname === "/api/image") {
        const body = await request.json();
        const dir = body.dir;
        const imageUrl = body.url;
        if (!dir || !imageUrl) return jsonResponse({ ok: false, error: "missing dir or url" }, 400, CORS_HEADERS);
        const key = `dir:${dir}`;
        const existing = await env.wj.get(key);
        const arr = existing ? JSON.parse(existing) : [];
        const filtered = arr.filter(u => u !== imageUrl);
        await env.wj.put(key, JSON.stringify(filtered));
        return jsonResponse({ ok: true, dir, url: imageUrl, items: filtered }, 200, CORS_HEADERS);
      }

      // GET random image - support /r/<dir> and /random?dir=DIR
      if (method === "GET" && (pathname.startsWith("/r/") || pathname === "/random")) {
        let dir = null;
        if (pathname.startsWith("/r/")) {
          dir = decodeURIComponent(pathname.slice(3)); // remove /r/
        } else {
          dir = url.searchParams.get("dir");
        }
        if (!dir) return jsonResponse({ ok: false, error: "missing dir" }, 400, CORS_HEADERS);
        const key = `dir:${dir}`;
        const existing = await env.wj.get(key);
        const arr = existing ? JSON.parse(existing) : [];
        if (!arr || arr.length === 0) return jsonResponse({ ok: false, error: "no images in dir" }, 404, CORS_HEADERS);
        // pick random
        const idx = Math.floor(Math.random() * arr.length);
        const imageUrl = arr[idx];
        // Redirect to the image URL
        return new Response(null, {
          status: 302,
          headers: {
            Location: imageUrl,
            ...CORS_HEADERS,
          },
        });
      }

      return jsonResponse({ ok: false, error: "unknown api route" }, 404, CORS_HEADERS);
    } catch (e) {
      return jsonResponse({ ok: false, error: e.message }, 500, CORS_HEADERS);
    }
  }

  // If not API, serve admin UI static files (simple fallback)
  // In a Pages deployment you'd serve static files; here we return a small HTML that calls the API.
  const html = `<!doctype html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Random Image Manager</title></head>
  <body>
    <h2>Random Image Manager</h2>
    <p>This endpoint provides APIs under <code>/api/*</code> and random redirects at <code>/r/&lt;dir&gt;</code> or <code>/random?dir=...</code>.</p>
    <p>Open <a href="/admin">/admin</a> for a simple management UI (if deployed with static files).</p>
  </body>
  </html>`;
  return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
}

function jsonResponse(obj, status=200, extraHeaders={}) {
  const headers = Object.assign({ "content-type": "application/json;charset=UTF-8" }, extraHeaders);
  return new Response(JSON.stringify(obj), { status, headers });
}