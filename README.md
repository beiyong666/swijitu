# EdgeOne / Cloudflare Pages - Random Image Directory (KV-backed)

This project provides:
- An admin UI (`/admin`) to create directories and upload image URLs to directories.
- A KV-backed storage (binding name expected: `wj`) that stores arrays of image URLs under keys `dir:<directory>`.
- A random image endpoint: `/r/<dir>` or `/random?dir=<dir>` which redirects (302) to a randomly selected image URL from the directory.

## Files
- `worker.js` - the main Cloudflare Worker/Pages function handler (routes and API).
- `static/admin.html`, `static/app.js`, `static/style.css` - simple admin UI that calls the API.
- `wrangler.toml` - example for deploying with Wrangler (you need to adjust account and KV bindings).

## KV binding
Create a Workers KV namespace in Cloudflare and bind it to the variable name `wj` in your Worker. The code expects `env.wj` to exist.

## Example usage
1. Create a directory:
   ```
   POST /api/dir
   { "dir": "img/cover" }
   ```
2. Add an image URL:
   ```
   POST /api/upload
   { "dir": "img/cover", "url": "https://example.com/a.jpg" }
   ```
3. Get random image:
   Open `/r/img/cover` and you will be redirected to a random image URL from that directory.

## Notes & deployment ideas
- This is a minimal implementation. In production you may want authentication for the admin UI.
- If deploying as Cloudflare Pages, put `static` folder contents into the Pages site and deploy `worker.js` as a Pages Function or Worker with a route that proxies `/api/*` and `/r/*`.
- The Worker uses simple KV keys `dir:<dir>` whose value is a JSON array of URLs.