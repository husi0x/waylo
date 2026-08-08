# Domains and DNS

## Connection flow

1. Enter a hostname without `https://` or a path.
2. Waylo creates a pending domain and unique ownership token.
3. Publish the displayed TXT record.
4. For a subdomain, publish the CNAME pointing to `TRACKING_CNAME`.
5. For an apex domain, use the ALIAS/ANAME or A/AAAA values supplied by the hosting provider.
6. Click **Verify DNS**. Waylo activates the domain only when the TXT token matches.
7. Configure TLS at the CDN or reverse proxy.

DNS propagation can take from seconds to several hours. Verification is safe to repeat.

## Admin separation

One hostname can serve `https://example.com/campaign` and `https://example.com/<admin path>`. The recommended arrangement uses `admin.example.com` with `ADMIN_HOST=admin.example.com` and separate public tracking domains. When `ADMIN_HOST` is set, admin pages and APIs return 404 on public domains. The admin path itself is either the `ADMIN_PATH` env value or a random path generated on first boot (never `/admin`).

Waylo refuses to delete a domain assigned to a smart link. Reassign or delete those links first.
