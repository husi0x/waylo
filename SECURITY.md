# Security

Waylo includes scrypt password hashing, signed HTTP-only sessions, optional admin-host isolation, DNS TXT domain verification, public HTTPS destination validation and private-network destination blocking. It does not store full visitor IP addresses.

Production operators must terminate TLS at a trusted proxy, restrict direct access to the application port, set `ADMIN_HOST`, strip untrusted forwarded/GEO headers, protect and back up `DATA_DIR`, keep dependencies patched, and configure suitable rate limits and retention policies.

Never commit `.env`, `data.json`, SQLite files, password hashes, signing secrets or backups. Do not open a public issue containing credentials, domains or visitor data.
