
# Random Image Pages for EdgeOne Pages (fixed login)

This project is identical to the previous version but fixes the admin login issue by using a token-based authentication:
- On successful login (`POST /api/login`), server returns `{ ok:true, token: "..." }`.
- Client stores the token in `localStorage` and sends it via `X-ADM-TOKEN` header for protected API calls.
- Server stores valid tokens in KV as `admtoken:<token>`.

Deployment notes: same as before. Bind KV to `WJ` or `wj`, set `ADMIN_PASSWORD`.
