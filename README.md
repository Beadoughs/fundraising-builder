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
| `STRIPE_SECRET_KEY` | For payments | Stripe test secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe test publishable key |
| `STRIPE_WEBHOOK_SECRET` | For payments | From Stripe CLI or dashboard |
| `RESEND_API_KEY` | Optional | Email provider (dev mode logs links to console) |

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
- Resend (optional, for emails)

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

- Set real `AUTH_SECRET`, Stripe keys, and `RESEND_API_KEY`
- Configure file storage (S3/Cloudinary) instead of local `public/uploads/`
- Deploy to Vercel, Railway, or similar
