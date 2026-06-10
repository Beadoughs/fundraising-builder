# Fundraising Builder

Product-based fundraising campaigns for schools, sports clubs, and community organisations. Create a campaign in under 10 minutes, share a link, and start collecting orders and payments.

**Jotform simplicity meets a focused fundraising store.**

## Features

- **Email magic-link login** for organisers (no passwords)
- **Campaign builder** — name, organisation, description, logo, goal, products
- **Public campaign page** — mobile-first store with cart and Stripe checkout
- **Instant order confirmation** + email receipt
- **Admin dashboard** — total raised, orders list, CSV export

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (see [Neon](#database-on-vercel) below) |
| `AUTH_SECRET` | Yes | Random string (`openssl rand -base64 32`) |
| `AUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | For payments | Webhook signing secret (`whsec_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Not required for Stripe Checkout redirect |
| `POSTMARK_SERVER_TOKEN` | Optional | Postmark server token (dev mode logs links to console) |
| `EMAIL_FROM` | With Postmark | Verified sender address in Postmark (e.g. `Beadoughs <noreply@yourdomain.com>`) |

### 3. Set up the database

```bash
npm run db:push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Stripe webhooks (local dev)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`.

## Usage flow

1. **Sign in** with your email (magic link — check terminal in dev mode)
2. **Create a campaign** — add products with names, prices, and optional images
3. **Publish** — get a shareable link like `/c/your-campaign-slug`
4. **Share** with supporters — they order and pay via Stripe
5. **Track** orders and export CSV from your dashboard

## Tech stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Prisma + PostgreSQL ([Neon](https://neon.tech))
- NextAuth.js (email magic links)
- Stripe Checkout
- Postmark (optional, for emails)

## Project structure

```
src/
  app/
    dashboard/          # Organiser dashboard & campaign builder
    c/[slug]/           # Public campaign store
    api/                # REST API (campaigns, checkout, webhooks)
  components/           # UI components
  lib/                  # Auth, DB, Stripe, email helpers
```

## Production notes

### Database on Vercel

Use **[Neon](https://neon.tech)** (serverless PostgreSQL, free tier):

1. Create a project at [console.neon.tech](https://console.neon.tech).
2. Copy the **connection string** (include `?sslmode=require`).
3. In the [Vercel project](https://vercel.com) → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |

Apply to **Production**, **Preview**, and **Development** as needed, then **redeploy**.

Apply the schema once (locally or in CI):

```bash
npm run db:push
```

### Preview branches on pull requests

The [Neon branch workflow](.github/workflows/neon-branch.yml) creates a temporary Neon database branch for each PR and runs `npm run db:push` against it. Configure these in the GitHub repo (**Settings → Secrets and variables → Actions**):

| Type | Name | Description |
|------|------|-------------|
| Variable | `NEON_PROJECT_ID` | Neon project ID (Project Settings in the Neon console) |
| Secret | `NEON_API_KEY` | Neon API key (Account → API Keys) |

### Other production setup

Set these in Vercel → **Settings** → **Environment Variables** (Production), then redeploy:

| Variable | Example |
|----------|---------|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://fundraising-builder.vercel.app` |
| `STRIPE_SECRET_KEY` | `sk_live_…` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from webhook endpoint (below) |
| `POSTMARK_SERVER_TOKEN` | Postmark server token |
| `EMAIL_FROM` | Verified sender in Postmark (e.g. `Beadoughs <noreply@yourdomain.com>`) |

#### Stripe Connect (required for organiser payouts)

Organisers can publish fundraisers without Connect; checkout collects payments on the platform account until payout setup is complete. For direct organiser payouts, complete Connect onboarding. In [Stripe Dashboard → Connect](https://dashboard.stripe.com/connect):

1. Click **Get started** and choose a **Platform or marketplace** integration.
2. Complete your **platform profile** (business details, branding).
3. Under **Settings → Connect**, confirm Express accounts are allowed.
4. Use your **live** secret key (`sk_live_…`) in Vercel `STRIPE_SECRET_KEY` for production.

Optional: set `STRIPE_CONNECT_DEFAULT_COUNTRY=AU` (defaults to `AU`) if connected accounts should be created in a specific country.

Set `CONNECT_DEBUG=1` in Vercel temporarily to surface Stripe error details in the payout UI while troubleshooting.

#### Stripe webhook (required for paid orders)

Orders stay `pending` until Stripe calls your webhook. In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

1. **Add endpoint** → `https://fundraising-builder.vercel.app/api/webhooks/stripe`
2. Select event **`checkout.session.completed`**
3. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy

Test a purchase with card `4242 4242 4242 4242`, any future expiry, any CVC.

- Configure file storage (S3/Cloudinary) instead of local `public/uploads/`
