
# Random Image Pages for EdgeOne Pages (API JSON response fix)

This patch ensures API endpoints under /api/ always respond with JSON (including errors),
which fixes "invalid json response" on the admin UI.

Common causes for "invalid json response":
- KV not bound (server previously returned plain text). Now returns JSON error.
- ADMIN_PASSWORD not set (server previously returned plain text). Now returns JSON error.
- Unexpected server error that returned non-JSON; now many errors are returned as JSON.

Deployment checklist:
1. Bind KV Namespace to the Pages function variable `WJ` (or `wj`).
2. Set `ADMIN_PASSWORD` environment variable.
3. Deploy. If you still see "invalid json response", open browser devtools -> Network -> inspect the response body of `/api/login` or `/api/dirs` and paste it here and I will diagnose.

