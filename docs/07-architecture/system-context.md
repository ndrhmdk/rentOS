# System context
Users access Next.js public, tenant, owner and admin interfaces. Supabase Auth provides identity; Next.js calls Laravel with access bearer tokens. Laravel verifies project JWT claims/signature, resolves profile and applies resource Policies, then uses Eloquent/direct PostgreSQL for business data. Storage integration manages images and private contract objects. Queue workers and scheduler execute shared domain actions and dispatch durable notifications.

No service key, database password or JWT signing material is sent to browser. A public/anon key alone must not grant direct application-table access. Direct DB connection may bypass RLS depending on role: do not assume auth.uid() magically scopes Eloquent. Restrict grants/RLS and enforce Laravel authorization regardless.
