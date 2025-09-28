
# Random Image Pages for EdgeOne Pages

This project implements a small EdgeOne Pages (Cloudflare Pages-like) site that:
- Lets you create named directories and upload (store) image URLs to each directory (admin UI).
- Visiting `https://yourdomain/<directory>` will redirect the visitor to a random image URL from that directory.

## Setup

1. Bind a KV Namespace to your Pages Functions and name the binding `WJ` (or `wj`).
2. Set an environment variable `ADMIN_PASSWORD` to a password for the admin UI.
3. Deploy the site. The provided `worker.js` contains the server logic.

KV schema:
- `dirs` — JSON array of directory names.
- `dir:<name>` — JSON array of image URL strings for the directory.

## Endpoints

- `GET /api/dirs` — list directories
- `POST /api/dirs` — create directory `{ "name": "mydir" }`
- `DELETE /api/dirs/:name` — delete directory (admin)
- `GET /api/dirs/:name` — list images in directory
- `POST /api/dirs/:name/images` — add image `{ "url": "https://..." }` (admin)
- `DELETE /api/dirs/:name/images` — remove image `{ "url": "https://..." }` (admin)
- `POST /api/login` — `{ "password": "..." }` returns a cookie for admin actions
- `GET /:dir` — redirect to a random image in dir

## Files in this ZIP

- `worker.js` — server logic (Pages Functions)
- `index.html` — basic home page
- `admin.html`  — admin interface
- `admin.js`    — admin UI logic
- `styles.css`  — basic styles
- `README.md`   — this file

## Notes & Security

- This implementation uses a simple password + cookie strategy. For production, consider stronger session handling, CSRF protection and HTTPS configuration provided by Pages.
- Make sure to choose a strong `ADMIN_PASSWORD`.
