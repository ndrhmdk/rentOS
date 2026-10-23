# Development seeders

`BaselineSeeder` creates a deterministic development baseline:

- 10 users: 1 admin, 5 owners, 4 tenants
- 20 properties assigned across the owners
- one unit and one listing per property
- 16 published listings and 4 draft listings
- cover and unit media metadata for published properties

It does not seed audit logs, idempotency records, or the notification outbox, and it does not delete unrelated rows. It refuses to run in production.

```bash
php artisan db:seed --class='Database\Seeders\BaselineSeeder' --no-interaction
```

Development-only accounts use the password `password`:

- Admin: `admin@rentos.test`
- Owners: `owner1@rentos.test` through `owner5@rentos.test`
- Tenants: `tenant1@example.com` through `tenant4@example.com`

The same two fixture images are reused for every published property. Seeding writes database paths only. Follow the [media fixture setup](../../docs/setup/media-fixtures.md) if you want the files in storage.
