# Configuration

Waylo reads environment variables. Node does not load `.env` automatically, so use Docker Compose, a systemd `EnvironmentFile`, or export variables before `npm start`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP listen port |
| `DATA_DIR` | project directory | Persistent configuration and SQLite directory |
| `TRACKING_CNAME` | placeholder | DNS target shown during domain onboarding |
| `ADMIN_HOST` | empty | Restricts the admin panel and `/api` to one hostname |
| `ADMIN_PATH` | generated on first boot | Secret admin panel path. If unset, a random path (`rk_…`) is generated, persisted in `DATA_DIR/data.json`, and never defaults to `/admin` |
| `TLS_MANAGED` | empty | Indicates that the platform provisions TLS |
| `ADMIN_PASSWORD` | empty | Optional password bootstrap; UI setup is preferred |
| `NODE_ENV` | empty | Set to `production` behind HTTPS |

`DATA_DIR` must be writable and survive container replacement. In production, configure `TRACKING_CNAME`, use a dedicated `ADMIN_HOST`, and do not expose port 8787 directly.

## GEO headers

Waylo recognizes Cloudflare/Vercel-style country, region and city headers. Strip client-supplied copies at the proxy and only inject values produced by the trusted edge. Missing data is recorded as `Unknown`.

## Routing rules

Links accept a `routes` array evaluated top to bottom; the first rule matching the visitor wins. Each rule:

```json
{
  "id": "uuid",
  "countries": ["US", "DE", "GB"],
  "device": "Any | Mobile | Tablet | Desktop",
  "os": "Any | iOS | Android | Windows | macOS",
  "destination": "https://public-https-destination"
}
```

`countries` accepts any number of ISO 3166-1 alpha-2 codes; `["ANY"]` (or an empty list) matches every country. Legacy rules stored as a single `country` string are normalized into `countries` on save. When a rule matches, the redirect event is recorded with its `route_id`; the analytics API exposes per-rule click counts (and the admin UI shows them next to each rule). Rules are edited, reordered and deleted from the link editor.

## Smart exit page

Each link can enable a smart exit page (`landing`, `landingMode`, `landingScheme`, `landingHeading`, `landingSubtext`, `landingButton`, `landingCopy`, `landingDirect`, `landingCountdown` fields on the link object). When enabled, visitors inside in-app browsers (Instagram, Threads, TikTok, Facebook, Messenger, X, LinkedIn, Snapchat, Pinterest, Reddit) receive a branded interstitial instead of a direct redirect:

- iOS Instagram/Threads use `instagram://extbrowser/?url=…` — the Instagram app itself hands off to the external browser.
- iOS Facebook/Messenger use `x-safari-https://…`.
- iOS TikTok/X/LinkedIn/Snap/Pinterest/Reddit show a button (their webviews require a user gesture; no auto-redirect).
- Android uses `intent://…` with `S.browser_fallback_url` — opens the default browser, no hardcoded package.

`landingMode: "app"` turns the exit page into a deep link into a native app: `landingScheme` (e.g. `onlyfans://username`) is fired on iOS, wrapped into an `intent://` on Android, and falls back to the destination if the app is not installed. All custom text fields are HTML-escaped on render; invalid schemes are rejected. Normal (non in-app) browsers are redirected instantly with a 302.

Every tap on the exit page button (manual, auto-redirect or the optional custom action) sends a `sendBeacon` to the public `POST /track` endpoint. These are stored as `event_type: "exit_click"` events with the same geo/device dimensions, counted separately as `exit_clicks` in the analytics summary, and labelled "exit page click" in the visit log and CSV export. Redirect events use `event_type: "redirect"`.
