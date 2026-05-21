<div align="center">

# 🌟 Gohar Pay Gateway

### منصة تأكيد المدفوعات الذكية للسوق المصري

*Real-time payment confirmation platform for Egyptian mobile wallets & InstaPay*

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](./CHANGELOG.md)
[![Phase](https://img.shields.io/badge/phase-2%20complete-success.svg)](./FINAL_REPORT.md)
[![Stack](https://img.shields.io/badge/stack-TanStack%20Start%20%2B%20React%2019-61DAFB.svg)](https://tanstack.com/start)
[![Backend](https://img.shields.io/badge/backend-Lovable%20Cloud-7C3AED.svg)](https://lovable.dev)
[![Language](https://img.shields.io/badge/UI-Arabic%20RTL-green.svg)](#)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#)

[الميزات](#-الميزات-الرئيسية) • [التشغيل السريع](#-التشغيل-السريع) • [البنية](#️-البنية-المعمارية) • [API](#-التكامل-api) • [المستندات](#-المستندات)

</div>

---

## 🎯 ما هذا المشروع؟

**Gohar Pay Gateway** منصة SaaS متكاملة تحل المشكلة الأكبر للتجار المصريين في تحصيل المدفوعات عبر المحافظ الإلكترونية: **التأكيد اليدوي من إشعارات SMS**.

```
┌─────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│ Vodafone Cash   │───▶│  📱 Android  │───▶│ ⚡ Realtime  │───▶│ 🛒 Merchant│
│ InstaPay, etc.  │SMS │  Collector   │HTTP│   Pipeline   │WH  │   Store    │
└─────────────────┘    └──────────────┘    └──────────────┘    └────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ 🤖 AI Parser │
                                          │   + Risk     │
                                          └──────────────┘
```

## ✨ الميزات الرئيسية

| الفئة | الميزة |
|---|---|
| 💰 **التحصيل** | فودافون كاش • اتصالات كاش • أورنج كاش • WE Pay • InstaPay • SMS البنوك |
| 🤖 **الذكاء** | تحليل تلقائي + AI Extraction للحالات الصعبة + رصد الاحتيال |
| ⚡ **Realtime** | تأكيدات فورية عبر Supabase Realtime Channels |
| 🔐 **الأمان** | RLS كامل + tenant isolation + API key hashing (SHA-256) |
| 📊 **اللوحات** | 14 صفحة تاجر + 6 صفحات إدارة، عربية 100% RTL |
| 🔌 **التكاملات** | Webhooks + REST API + WooCommerce + Shopify (قريباً) |
| 📱 **الإشعارات** | Telegram ✅ • WhatsApp (قريباً) • Email |
| 💳 **الاشتراكات** | 3 باقات (Starter / Growth / Enterprise) |

## 🚀 التشغيل السريع

```bash
git clone <your-repo-url> gohar-pay
cd gohar-pay
bun install
bun dev
```

افتح **`http://localhost:8080`** ثم سجّل دخول بأي حساب من [USERS.md](./USERS.md):

```
البريد:        owner@goharpay.test
كلمة المرور:  Owner@2026
```

ستجد فوراً 50 حوالة، 14 طلب، 3 مصادر دفع، 4 تنبيهات — كله محضّر للاختبار.

## 🏗️ البنية المعمارية

### Frontend Stack
```
┌──────────────────────────────────────────────────────────┐
│  TanStack Start v1   ← Router + SSR + Server Functions   │
│  React 19            ← UI Components                     │
│  Vite 7              ← Build tool                        │
│  Tailwind CSS v4     ← Styling (semantic tokens)         │
│  shadcn/ui           ← Component library                 │
│  recharts            ← Charts & analytics                │
│  framer-motion       ← Animations                        │
│  lucide-react        ← Icons                             │
│  sonner              ← Toast notifications               │
└──────────────────────────────────────────────────────────┘
```

### Backend Stack
```
┌──────────────────────────────────────────────────────────┐
│  Lovable Cloud (Supabase)                                │
│  ├─ PostgreSQL 15      ← 22 tables + 8 enums            │
│  ├─ Row Level Security ← Multi-tenant isolation         │
│  ├─ Realtime           ← parsed_transactions channel    │
│  ├─ Auth               ← Email/Password + Google OAuth  │
│  └─ Storage            ← (planned for receipts)         │
│                                                          │
│  TanStack Server Functions ← createServerFn RPC layer    │
│  Cloudflare Workers        ← Edge deployment             │
└──────────────────────────────────────────────────────────┘
```

### مخطط قاعدة البيانات (مختصر)
```
auth.users
    │
    ├──▶ profiles (1:1)
    ├──▶ user_roles (1:N)  ← super_admin | internal_admin | owner | admin | operator | viewer
    └──▶ merchant_members (N:M)
              │
              ▼
          merchants ────▶ plans
              │       └─▶ subscriptions
              │
              ├──▶ devices ──▶ payment_sources ──▶ source_balances
              │                       │
              │                       ▼
              │                  raw_messages ──▶ ai_extractions
              │                       │
              │                       ▼
              │                  parsed_transactions ──▶ transaction_events
              │                       │
              │                       ▼
              │                  order_matches ◀── orders
              │
              ├──▶ webhooks ──▶ webhook_deliveries
              ├──▶ api_keys
              ├──▶ alerts
              ├──▶ risk_reviews
              ├──▶ transfers
              └──▶ audit_logs
```

تفاصيل كاملة في [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

## 🔌 التكامل API

### Webhook Payload (Outbound)
```json
POST https://your-store.com/webhooks/gohar
X-Gohar-Signature: sha256=...

{
  "event": "payment.confirmed",
  "data": {
    "transaction_id": "uuid",
    "amount": 1250.00,
    "currency": "EGP",
    "reference": "REF847291",
    "provider": "vodafone_cash",
    "matched_order": "WC-20015",
    "confidence": 0.98,
    "risk": "low"
  },
  "timestamp": "2026-05-21T15:32:11Z"
}
```

### REST API
```bash
curl -X POST https://api.goharpay.com/v1/orders \
  -H "Authorization: Bearer gp_live_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "external_ref": "WC-20025",
    "amount": 750,
    "customer_label": "أحمد محمد",
    "expires_in_minutes": 30
  }'
```

## 📚 المستندات

| ملف | المحتوى |
|---|---|
| [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) | السياق الكامل للمشروع (للـ AI والمطورين الجدد) |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | الـ 22 جدول + RLS + Helper functions |
| [USERS.md](./USERS.md) | بيانات الدخول الجاهزة لكل الأدوار |
| [CHANGELOG.md](./CHANGELOG.md) | سجل التغييرات لكل phase |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | دليل المساهمة وأسلوب الكود |
| [FINAL_REPORT.md](./FINAL_REPORT.md) | تقرير Phase 2 الكامل |

## 🗺️ خارطة الطريق

- [x] **Phase 1** — Auth + Schema + Landing
- [x] **Phase 2** — 14 merchant pages + 6 admin pages + Demo seed
- [ ] **Phase 3** — Android Collector App (Kotlin) + Parser Engine + AI Extraction
- [ ] **Phase 4** — Webhook delivery engine + Billing (Paddle/Stripe) + Subdomains
- [ ] **Phase 5** — WhatsApp notifications + WooCommerce/Shopify plugins
- [ ] **Phase 6** — Mobile app for merchants (React Native)

## 🤝 المساهمة

اقرأ [CONTRIBUTING.md](./CONTRIBUTING.md) قبل فتح PR.

## 📄 الترخيص

Proprietary — جميع الحقوق محفوظة © 2026 Gohar Pay.

---

<div align="center">

**صُنع بـ ❤️ في مصر** • Built with [Lovable](https://lovable.dev)

</div>
