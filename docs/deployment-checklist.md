# Zeus deployment checklist

This is the operational checklist for the first Vercel release. Keep real values in Vercel and the service dashboards, never in Git. The final portfolio README can be written after the release is verified.

## 1. Separate environments

- Confirm the GitHub quality-check workflow is green for the commit to deploy.
- Use separate Supabase databases/projects and Stripe **test-mode** credentials for Preview and Production. A Preview deployment must not create orders, upload images, or apply migrations in the Production data stores.
- Decide on the canonical HTTPS Production URL before checkout testing. `NEXT_PUBLIC_BASE_URL` must be that site's origin; Stripe return links and same-origin checks use it. A Preview build needs its own matching HTTPS origin if its stateful flows will be tested.
- Before any Production database change, review the migration SQL and arrange a recoverable database backup. App rollback does not undo a database migration.

## 2. Configure Vercel

Import the GitHub repository as a Next.js project. Configure these variables for each deployment environment with the matching environment's values. Vercel's [Production and Preview scopes](https://vercel.com/docs/environment-variables) are separate; changes take effect on a new deployment.

| Variable                   | Purpose                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection for Prisma and migration commands.                            |
| `SESSION_SECRET`           | Unique random session-signing secret, at least 32 characters.                       |
| `RATE_LIMIT_SECRET`        | Different random rate-limit secret, at least 32 characters.                         |
| `NEXT_PUBLIC_BASE_URL`     | Canonical HTTPS origin for this deployment environment.                             |
| `NEXT_PUBLIC_SUPABASE_URL` | HTTPS URL of the matching Supabase project.                                         |
| `SUPABASE_SECRET_KEY`      | Server-only Supabase secret for product image operations.                           |
| `STRIPE_SECRET_KEY`        | Matching Stripe test-mode server key for the initial release.                       |
| `STRIPE_WEBHOOK_SECRET`    | Signing secret for this deployment's Stripe webhook endpoint.                       |
| `DEEPSEEK_API_KEY`         | Server-only key for AI review summaries.                                            |
| `DEEPSEEK_MODEL`           | Optional model override; choose a model verified to respond within the app timeout. |

`NEXT_PUBLIC_*` values are exposed to browser code; all other keys above are server-only and must remain secret. Do not paste secrets into issues, screenshots, or committed files. The app also expects a **public** Supabase Storage bucket named `product-images` so customers can see uploaded product images. Public access is for downloads; the app performs upload/delete through its admin-only server routes. See [Supabase's public bucket guidance](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## 3. Check database and build

Run these against the **intended target environment**, not whichever `DATABASE_URL` happens to be in your local `.env`:

```powershell
npm ci
npm run validate:env:production
npm run db:migrate:status
npm run build
```

The environment check validates required key formats and Production HTTPS. Migration status only reports whether committed migrations are pending. `npm run build` generates Prisma Client before compiling Next.js.

If migrations are pending, review their SQL and the backup first. Then, from a controlled environment configured with the target database URL, run `npm run db:migrate:deploy` **once** before deploying app code that needs the new schema. Do not put migrations in every Vercel build or run `prisma migrate dev` on Production. Never run `npm run seed` or `npm run seed:reviews` on Production: seed scripts are intended for fixture data, not live orders and accounts. [Prisma's production migration guide](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production) distinguishes `migrate deploy` from development migrations.

## 4. Deploy and connect Stripe

Deploy the selected commit. In the Stripe **test-mode** dashboard, create a webhook destination pointing to:

```text
https://YOUR_PRODUCTION_ORIGIN/api/stripe/webhook
```

Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`, which the Zeus route handles. Copy that destination's `whsec_...` signing secret to Production `STRIPE_WEBHOOK_SECRET`, then redeploy so the new variable is available. A Preview destination needs its **own** URL and signing secret. The Stripe CLI forwarding secret is not interchangeable with a Dashboard endpoint secret. Payment confirmation comes from the [signed webhook](https://docs.stripe.com/checkout/fulfillment), not just the browser's return page; [Stripe's signature guide](https://docs.stripe.com/webhooks/signature?lang=node) explains the distinct secrets.

## 5. Smoke-test the release

Use a dedicated test account and test-mode payment, then verify:

1. Homepage, catalog, filtering, product details, images, reviews, and AI summaries load over HTTPS.
2. Register/login, cart, wishlist, checkout, orders, and admin authorization work. An ordinary customer cannot open admin pages or mutate admin APIs.
3. A Stripe test payment returns to Zeus; Stripe shows successful webhook delivery; the corresponding order changes from pending to the paid/processing state. Refresh orders to confirm the database state. Retrying or reloading must not create another order.
4. An admin can upload an image and its public product URL loads. Check one 320px mobile viewport, desktop viewport, keyboard focus, and reduced motion.

If the release fails, redeploy the last known-good app commit and investigate logs. Treat database rollback separately using the backup and an explicit recovery plan; do not run a destructive reset.
