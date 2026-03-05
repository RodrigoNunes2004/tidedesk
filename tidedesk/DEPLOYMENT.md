# TideDesk – Stripe & Vercel Deployment Guide

---

## 0. Vercel Deployment (Step-by-step)

### Before you start

- [ ] Code pushed to GitHub (or GitLab/Bitbucket)
- [ ] Neon PostgreSQL database created
- [ ] Stripe product & price created (69 NZD/month)

### Deploy to Vercel

1. **Import project**
   - Go to [vercel.com](https://vercel.com) → Add New Project
   - Import your Git repository

2. **Set Root Directory**
   - In "Configure Project", expand **Root Directory**
   - Set to `tidedesk` (the app lives in this subfolder)
   - Or if you deploy from a repo that has tidedesk at root, leave blank

3. **Environment variables**
   - Add all variables from **Section 3** below
   - Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL **after** first deploy (e.g. `https://tidedesk-xxx.vercel.app`)
   - For the first deploy you can use a placeholder; update after you get the URL

4. **Deploy**
   - Click Deploy
   - Wait for build to complete

5. **After first deploy**
   - Copy your deployment URL (e.g. `https://tidedesk-xxx.vercel.app`)
   - Update Vercel env vars: `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` with this URL
   - Redeploy (Deployments → ⋮ → Redeploy) so the new env vars apply

6. **Database migrations**
   - Run against your production DB:
     ```bash
     DATABASE_URL="your-production-neon-url" npx prisma migrate deploy
     ```
   - Or use Neon's SQL editor to run migrations manually

7. **Seed (optional)**
   - To create a demo owner: `DATABASE_URL="your-production-url" npm run db:seed`
   - Or let users sign up via the Stripe trial flow

---

## 1. Stripe Setup

### Create Stripe account & product

1. **Sign up** at [dashboard.stripe.com](https://dashboard.stripe.com) (use Test mode for development).

2. **Create a Product** (Dashboard → Products → Add product):
   - Name: `TideDesk` (or `Starter Plan`)
   - Pricing: **Recurring**, **Monthly**
   - Amount: **69 NZD**
   - Copy the **Price ID** (e.g. `price_xxxxx`).

3. **Get API keys** (Developers → API keys):
   - **Publishable key**: `pk_test_xxx` (dev) or `pk_live_xxx` (prod)
   - **Secret key**: `sk_test_xxx` (dev) or `sk_live_xxx` (prod)

### Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_xxxxx` |
| `STRIPE_PRICE_ID` | Price ID from step 2 | `price_xxxxx` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key | `pk_test_xxxxx` |
| `NEXT_PUBLIC_APP_URL` | App URL (must match deployment) | `https://your-app.vercel.app` |

### Stripe Checkout / Billing Portal

- Checkout session uses a 30‑day trial (configured in code).
- No webhook is required for basic flow.
- Optional: configure a [webhook](https://stripe.com/docs/webhooks) for subscription events (`customer.subscription.updated`, `customer.subscription.deleted`) to sync trial/status to your app.

---

## 2. Auth (NextAuth) for Production

### Required changes for Vercel

No code changes are needed. Ensure these env vars are set in Vercel.

| Variable | Description | Production value |
|----------|-------------|------------------|
| `NEXTAUTH_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` or [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
| `NEXTAUTH_URL` | Full URL of the app | `https://your-app.vercel.app` (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` for Stripe redirects | `https://your-app.vercel.app` |

### Why `NEXTAUTH_URL` matters

- In serverless environments, NextAuth cannot reliably infer the public URL.
- Without `NEXTAUTH_URL`, callback URLs can be wrong and sign-in redirects may 404.
- Must be set for Production in Vercel Environment Variables.

### Credentials + JWT

- Your setup (CredentialsProvider + JWT) works on Vercel.
- `runtime = "nodejs"` on the auth route is appropriate for Prisma with Neon.

---

## 3. Vercel Environment Variables

Configure these in **Vercel → Project → Settings → Environment Variables** for **Production** (and optionally Preview):

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate-strong-secret>
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Use **live** Stripe keys for production; keep test keys for preview/dev.

---

## 4. Deployment checklist

- [ ] Neon database created; migrations run
- [ ] Stripe product and price created; price ID copied
- [ ] All env vars set in Vercel (Production scope)
- [ ] `NEXTAUTH_URL` matches your Vercel deployment URL
- [ ] `NEXT_PUBLIC_APP_URL` matches your Vercel deployment URL
- [ ] Database seeded (or first user created via onboarding)
- [ ] Stripe Checkout success URL: `{NEXT_PUBLIC_APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`
