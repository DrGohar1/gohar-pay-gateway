# خارطة الطريق (Roadmap)

## ✅ Phase 1 — الأساس (مكتمل)
- Landing عربية + Auth + Schema (22 جدول)

## ✅ Phase 2 — CRUD كامل (مكتمل)
- 14 صفحة تاجر + 6 صفحات إدارة + Auto-bootstrap + Realtime

## ✅ Phase 3 — التحصيل الفعلي (مكتمل)
- `/api/public/ingest` endpoint مع device auth + idempotency
- Parser engine (regex + Arabic digits normalization)
- AI extraction fallback عبر Lovable AI Gateway
- Webhook delivery worker مع HMAC-SHA256 + exponential backoff
- Parser templates seeded للمزودين الخمسة

## 🟡 Phase 4 — Billing + Subdomains (يحتاج مفاتيح خارجية)
- Plans/Subscriptions schema جاهز
- يحتاج تفعيل Stripe من إعدادات Lovable

## ✅ Phase 5 — Plugins + WhatsApp (مكتمل)
- WooCommerce gateway (PHP plugin)
- WhatsApp Cloud API server fn (يحتاج WHATSAPP_TOKEN)

## ✅ Phase 6 — Android Collector (Scaffold)
- SmsBroadcastReceiver + IngestWorker (Kotlin)
- يحتاج فتح Android Studio لإكمال الـ UI

## 📋 Phase 7 — Future
- Mobile app للتجار (React Native)
- Shopify plugin
- Public marketing site
- API docs site (Mintlify/Docusaurus)
