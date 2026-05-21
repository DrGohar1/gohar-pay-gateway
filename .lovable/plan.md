# Gohar Pay — Phase 1 Plan

Building the foundation of an Arabic-first (RTL) fintech merchant payment confirmation platform. This phase delivers the visual and architectural skeleton. No real payment ingestion yet — that comes in phase 2 with the Android collector contract and parser engine.

## Scope (Phase 1 only)

1. **Arabic RTL marketing landing page** — hero, channels, use cases, benefits, "how it works" (Android collector + line + merchant account), pricing, FAQ, future-services teaser, compliance-safe copy.
2. **Auth flow** — Supabase email/password + Google. Login, signup, password reset, `/_authenticated` route guard, role-aware routing (merchant vs admin).
3. **Merchant dashboard shell** — sidebar nav, all sections present as routes with realistic demo data:
   Overview, Transactions, Incoming confirmations, Orders, Payment sources/lines, Balance snapshots, Integrations, API keys, Webhooks, Alerts, Risk flags, Team, Settings, **Transfers (coming soon)**.
4. **Admin dashboard shell** at `/admin` — Merchants, Devices, Lines, System transactions, Parser health, Webhook monitor, Fraud queue, AI quality, Plans, Feature flags, Settings.
5. **Supabase schema (phase 1 subset)** — multi-tenant foundation with RLS:
   `merchants`, `merchant_members` (with role enum), `user_roles` (separate table, `has_role` SECURITY DEFINER fn), `payment_sources`, `devices`, `raw_messages`, `parsed_transactions`, `orders`, `webhooks`, `api_keys`, `alerts`, `risk_reviews`, `audit_logs`, `plans`, `subscriptions`. Tables for `ai_extractions`, `parser_templates/rules`, `source_balances`, `webhook_deliveries`, `transaction_events` are created as stubs ready for phase 2.
6. **Demo seed data** — 1 demo merchant, 3 lines, ~50 transactions across statuses, a few orders, sample alerts/risk items, so dashboards look real.
7. **Design system** — premium fintech, dark + light, Arabic typography (Cairo + IBM Plex Sans Arabic), semantic tokens in `src/styles.css`, all RTL-aware. Light 3D/gradient only on landing hero.

## Architecture

- **Stack**: TanStack Start (current template) + React + TS + Tailwind v4 + Supabase (Lovable Cloud). Vercel deployment is not the template's default — TanStack Start ships to Cloudflare Workers via the existing `wrangler.jsonc`. I'll note this in the README rather than reconfigure now.
- **Multi-tenancy**: `merchant_id` on every tenant-scoped table. RLS via `merchant_members` membership check using a SECURITY DEFINER helper. Subdomain-based tenant resolution is left as a hook (`getCurrentMerchant`) for phase 2.
- **RBAC roles**: `super_admin`, `internal_admin`, `merchant_owner`, `merchant_admin`, `operator`, `finance_viewer`, `support_agent` — stored in `user_roles` (NEVER on profiles).
- **Server functions** via `createServerFn` for all reads/writes; admin operations gated by `has_role(auth.uid(), 'internal_admin')`.
- **Ingestion endpoint stub**: `/api/public/ingest` route file created with signature-verification skeleton + idempotency key handling, returning 501 until phase 2.
- **Realtime**: Supabase Realtime channel subscriptions wired on Incoming Confirmations and Admin live monitor (subscribe to `parsed_transactions` inserts).
- **Transfers module**: route exists at `/app/transfers` rendering a "قريباً" (coming soon) screen; schema placeholder table `transfers` created (empty, RLS on).

## File structure (high-level)

```
src/routes/
  index.tsx                      # landing
  login.tsx, signup.tsx, reset-password.tsx
  _authenticated.tsx             # auth guard
  _authenticated/app/
    index.tsx                    # merchant overview
    transactions.tsx
    confirmations.tsx
    orders.tsx
    sources.tsx
    balances.tsx
    integrations.tsx
    api-keys.tsx
    webhooks.tsx
    alerts.tsx
    risk.tsx
    team.tsx
    settings.tsx
    transfers.tsx                # coming soon
  _authenticated/admin/
    index.tsx, merchants.tsx, devices.tsx, lines.tsx,
    transactions.tsx, parser.tsx, webhooks.tsx,
    fraud.tsx, ai-quality.tsx, plans.tsx, flags.tsx, settings.tsx
  api/public/ingest.ts           # stub
src/components/
  landing/*  layout/*  dashboard/*  ui/*
src/lib/
  *.functions.ts                 # server fns
  rtl.ts, format.ts, demo-data.ts
src/integrations/supabase/*      # generated
```

## Out of scope this phase (explicit)

- Actual SMS/notification parsing engine
- Real AI extraction calls
- WooCommerce plugin code
- Android app
- Real webhook delivery worker
- Stripe/Paddle billing
- Subdomain routing infrastructure

## Deliverable

A reviewable, demo-data-populated Arabic RTL fintech SaaS skeleton: landing → signup → merchant dashboard with all sections navigable and visually complete, plus admin dashboard, plus a real Supabase schema with RLS that phase 2 can build on without rework.

I'll stop after this for your review before phase 2.
