# Development seeders

`BaselineSeeder` creates a deterministic development baseline:

- 10 users: 1 admin, 5 owners, 4 tenants
- 100 properties assigned across the owners, each with a unit and a published listing
- coordinates run from Ha Noi and Hai Phong through Hue, Da Nang, Hoi An, the central coast, and Ho Chi Minh City to Can Tho
- cover and unit media metadata for published properties

It does not seed audit logs, idempotency records, or the notification outbox, and it does not delete unrelated rows. It refuses to run in production.

```bash
php artisan db:seed --class='Database\Seeders\BaselineSeeder' --no-interaction
```

Development-only accounts use the password `password`:

- Admin: Mai Anh Tran, `admin@rentos.test`
- Owners: Quoc Huy Le `owner1@rentos.test`, Thu Ha Nguyen `owner2@rentos.test`, Minh Khoa Pham `owner3@rentos.test`, Bao Ngoc Vo `owner4@rentos.test`, Duc Thinh Hoang `owner5@rentos.test`
- Tenants: Lan Chi Dang `tenant1@example.com`, Hoang Nam Bui `tenant2@example.com`, Thanh Tam Ly `tenant3@example.com`, Gia Han Truong `tenant4@example.com`

The same two fixture images are reused for every published property. Seeding writes database paths only. Follow the [media fixture setup](../../docs/setup/media-fixtures.md) if you want the files in storage.
