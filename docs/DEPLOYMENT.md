# Production deployment

## Docker Compose

1. Copy `.env.example` to `.env`.
2. Set `TRACKING_CNAME` and `ADMIN_HOST`.
3. Run `docker compose up -d --build`.
4. Put Caddy, Nginx, Traefik or Cloudflare in front of `127.0.0.1:8787`.
5. Open `https://ADMIN_HOST/admin` and create the first password.

The Compose service binds Waylo to loopback so the reverse proxy remains the only public entry point.

## Nginx example

```nginx
server {
    listen 443 ssl http2;
    server_name admin.example.com go.example.com;

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_pass http://127.0.0.1:8787;
    }
}
```

Every connected hostname needs a valid TLS certificate.

## Updating

```bash
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
```

Back up `storage/` before updating.
