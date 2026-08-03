# Configuration

Waylo reads environment variables. Node does not load `.env` automatically, so use Docker Compose, a systemd `EnvironmentFile`, or export variables before `npm start`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP listen port |
| `DATA_DIR` | project directory | Persistent configuration and SQLite directory |
| `TRACKING_CNAME` | placeholder | DNS target shown during domain onboarding |
| `ADMIN_HOST` | empty | Restricts `/admin` and `/api` to one hostname |
| `TLS_MANAGED` | empty | Indicates that the platform provisions TLS |
| `ADMIN_PASSWORD` | empty | Optional password bootstrap; UI setup is preferred |
| `NODE_ENV` | empty | Set to `production` behind HTTPS |

`DATA_DIR` must be writable and survive container replacement. In production, configure `TRACKING_CNAME`, use a dedicated `ADMIN_HOST`, and do not expose port 8787 directly.

## GEO headers

Waylo recognizes Cloudflare/Vercel-style country, region and city headers. Strip client-supplied copies at the proxy and only inject values produced by the trusted edge. Missing data is recorded as `Unknown`.

## Smart exit page

Each link can enable a smart exit page (`landing`, `landingMode`, `landingScheme`, `landingHeading`, `landingSubtext`, `landingButton`, `landingCopy`, `landingDirect`, `landingCountdown` fields on the link object). When enabled, visitors inside in-app browsers (Instagram, Threads, TikTok, Facebook, Messenger, X, LinkedIn, Snapchat, Pinterest, Reddit) receive a branded interstitial instead of a direct redirect:

- iOS Instagram/Threads use `instagram://extbrowser/?url=…` — the Instagram app itself hands off to the external browser.
- iOS Facebook/Messenger use `x-safari-https://…`.
- iOS TikTok/X/LinkedIn/Snap/Pinterest/Reddit show a button (their webviews require a user gesture; no auto-redirect).
- Android uses `intent://…` with `S.browser_fallback_url` — opens the default browser, no hardcoded package.

`landingMode: "app"` turns the exit page into a deep link into a native app: `landingScheme` (e.g. `onlyfans://username`) is fired on iOS, wrapped into an `intent://` on Android, and falls back to the destination if the app is not installed. All custom text fields are HTML-escaped on render; invalid schemes are rejected. Normal (non in-app) browsers are redirected instantly with a 302.
