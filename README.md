
# EdgeOne Pages compatible Random Image Pages

This version uses EdgeOne Pages function signatures:
- export async function onRequestGet({ request, env, params })
- export async function onRequestPost({ request, env, params })
- export async function onRequestDelete({ request, env, params })

KV binding:
- EdgeOne example used `wj` (lowercase). Bind your KV namespace to variable name `wj` (or `WJ`).
- The code tries env.wj, env.WJ, and a global `wj` if present.

Deployment notes:
1. Put `edgeone_worker.js` (rename to `worker.js` if your Pages expects that) into your Pages Functions folder.
2. Place `index.html`, `admin.html`, `admin.js`, `styles.css` into your static assets folder (root).
3. Set environment variable `ADMIN_PASSWORD`.
4. Bind KV Namespace to `wj` or `WJ`.
5. Deploy and visit /admin to login.

If you still get "invalid json response", open browser devtools -> Network -> find the failing `/api/*` request -> copy the Response body and paste it here. I'll diagnose immediately.
