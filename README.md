<p align="center">
  <img src="assets/waylo-logo.svg" width="360" alt="Waylo">
</p>


Waylo is a self-hosted smart-link, first-party click analytics and link-in-bio platform. It routes visitors through domains you control, records real redirect events and supports rules by country, device and operating system.

## Features

- Branded links on root domains and subdomains
- Password-protected administration panel
- GEO, source, referrer, device, model, OS and browser analytics
- Anonymous first-party unique visitor counting; full IP addresses are not stored
- Rule-based destinations by GEO, device and OS
- Domain ownership verification through unique DNS TXT records
- Link-in-bio profile editor
- SQLite/WAL persistence, CSV export, Docker deployment and health check

Waylo does not implement cloaking, fingerprinting or mechanisms that bypass advertising-platform protections.

## Quick start

Requirements: Node.js 20+ and npm 9+.

```bash
cp .env.example .env
npm ci
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `http://localhost:5173`. On the first visit, create the administrator password.

## Production

```bash
npm ci
npm run check
npm run build
npm start
```

The production admin panel is served at `/admin`. Public links use `https://connected-domain/slug`.

Docker:

```bash
docker compose up -d --build
```

Persist `/app/storage`. It contains the database, domain configuration, password hash and session secret.

## Documentation

- [Configuration](docs/CONFIGURATION.md)
- [Domain and DNS setup](docs/DOMAINS.md)
- [Production deployment](docs/DEPLOYMENT.md)
- [Operations and backups](docs/OPERATIONS.md)
- [Security model](SECURITY.md)

## Architecture

Express provides the authenticated admin API, public redirects and hosted profile pages. React provides the admin UI. Click events are stored in indexed SQLite tables using WAL mode. A CDN or reverse proxy terminates TLS and supplies trusted GEO headers.

```text
Visitor -> CDN / reverse proxy -> Waylo redirect -> destination
                                  |-> SQLite analytics

Administrator -> /admin -> authenticated API -> configuration
```

## Commands

```bash
npm run dev       # API watch mode and Vite UI
npm run check     # TypeScript validation
npm run build     # production frontend
npm start         # production server
```

Health check: `GET /api/health`.

## License

No license has been granted yet. Add one before accepting external contributions or distributing the project.
