This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy the env example, then run the development server:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_API_URL` is the Laravel origin. The default is `http://localhost:8000`.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To check that this app can reach the Laravel API, start the backend from `backend/` with `php artisan serve`, then use **Check backend** on the home page. It calls `$NEXT_PUBLIC_API_URL/api/health`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Account screens

RNT-03 routes: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/profile`, `/change-password`, `/settings/api-tokens`. `/tenant`, `/owner`, `/admin` are account navigation shells; domain features belong to their feature owners.

Use `src/lib/identity/api.ts` for credentialed browser calls and `privateKey(userId, ...)` for private TanStack queries. Initialize CSRF before guest auth forms. Do not add login PAT/localStorage authentication or automatic mutation retries. Token creation secrets stay in component memory, outside Query/Mutation caches.

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. For an environment that blocks Turbopack's internal worker port, `npm run build -- --webpack` validates the production bundle. This fallback does not change the CI/default build command.

See [backend integration contract](../backend/docs/setup/identity-access.md). Identity styles use a local copy of `design/tokens/rentos-tokens.css` because the frontend Turbopack root excludes the parent directory; synchronize `src/components/identity/brand-tokens.css` when brand tokens change.
