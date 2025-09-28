EdgeOne Random Image Pages - final_allroutes package (Chinese)
This package attempts to be compatible with different Pages / EdgeOne routing expectations by providing:
- functions/api/*.js (for /api/* routing)
- functions/*.js (alternate placement some systems use)
- functions/worker.js (onRequestGet) to handle directory redirects like /<dir>
- public/* static files for admin UI (Chinese)
KV: bind your KV namespace to variable name "wj" (env.wj) or ensure global wj is injected.
Admin password is hardcoded to: Dd112211 (for testing)
Deployment:
1. Upload functions/ to your Pages Functions area (keep both api and root files).
2. Put public/* into your static site root.
3. Bind KV to "wj".
4. Visit /admin.html and login with Dd112211
If you still see XML MethodNotAllowed, copy the full Response body from DevTools (Network) and paste it to me.