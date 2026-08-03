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
