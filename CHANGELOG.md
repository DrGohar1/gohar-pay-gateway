# Changelog

## [0.6.0] — 2026-05-21 — Phases 3, 5, 6
### Added
- **Phase 3 — Ingest pipeline**
  - `src/routes/api/public/ingest.ts` — public endpoint with device-token auth, idempotency, and inline parser execution
  - `src/lib/parser/engine.ts` — regex engine with Arabic digit normalization and risk classifier
  - `src/lib/parser/ai-extract.functions.ts` — Lovable AI Gateway fallback for low-confidence messages
  - `src/lib/webhooks/deliver.functions.ts` — HMAC-SHA256 webhook delivery worker with exponential backoff
  - DB: seeded parser_templates + parser_rules for 5 providers
  - DB: `enqueue_webhook_delivery()` SECURITY DEFINER RPC
  - DB: unique indexes for idempotency on `raw_messages`
- **Phase 5 — Integrations**
  - `src/lib/whatsapp.functions.ts` — WhatsApp Cloud API client
  - `integrations/woocommerce/gohar-pay-gateway.php` — full WooCommerce gateway with webhook receiver
- **Phase 6 — Android Collector scaffold**
  - `android-collector/` directory with Kotlin SMS receiver + WorkManager-based uploader

## [0.2.0] — 2026-05-21 — Phase 2
### Added
- 14 صفحة تاجر + 6 صفحات إدارة
- Auto-bootstrap للتجار التجريبيين (50 transactions, 14 orders)
- 6 حسابات تجريبية (USERS.md)
- Realtime channel على parsed_transactions
- Telegram integration
- Security hardening migration
- Arabic PDF documentation

## [0.1.0] — 2026-05-20 — Phase 1
### Added
- Landing عربية RTL
- Auth (email/password)
- 22 جدول DB + RLS + helper functions
- Layouts للوحة التاجر والإدارة
