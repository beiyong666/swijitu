Quick Pages deployment notes:

- If you set Pages root to `static`, preview will serve files from `static/`. If Pages shows 404, set root to `.` and ensure `index.html` exists at repository root.
- For this ZIP we created `index.html` at project root (copied from static/admin.html) so Pages preview will show the admin UI.
- Bind your KV namespace to `wj` in your Pages Functions/Environment for dynamic endpoints.
- If you use Cloudflare Pages Functions, place `worker.js` contents into `functions/` or use a separate Worker. This example keeps `worker.js` at project root for Wrangler deployment.
