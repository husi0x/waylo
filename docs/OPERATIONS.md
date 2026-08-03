# Operations

`DATA_DIR` contains `data.json` with configuration and authentication metadata plus `analytics.db` and its SQLite WAL files.

## Backup

For a simple consistent backup, stop the service briefly and archive the whole storage directory:

```bash
docker compose stop waylo
tar -czf waylo-backup-$(date +%F).tar.gz storage/
docker compose start waylo
```

Store backups away from the server and test restoration.

## Monitoring

- Health: `/api/health`
- State: `docker compose ps`
- Logs: `docker compose logs --tail=200 waylo`
- Disk: monitor the filesystem containing `analytics.db`

SQLite is intended for one Waylo instance. Before multiple replicas or sustained high-volume ingestion, migrate events to Postgres or ClickHouse.

Waylo retains click events until removed. Define an appropriate legal retention policy before accepting production traffic.
