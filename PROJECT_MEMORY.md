# جوهر باي — Project Memory (AI Context)

> اقرأ هذا الملف قبل العمل على Gohar Pay Gateway.

## ما هو هذا المشروع؟

منصة تأكيد مدفوعات للتجار في السوق المصري. تستقبل إشعارات SMS من محافظ موبايل (فودافون كاش، اتصالات كاش، أورنج كاش، WE Pay) و InstaPay عبر تطبيق Android collector، تحلل النص، تطابق الحوالة مع طلب، وترسل Webhook للمتجر.

## الـ Stack

- **Frontend**: TanStack Start v1 + React 19 + Vite 7 + Tailwind v4
- **Backend**: Lovable Cloud (Supabase) — RLS، Realtime، Storage
- **Server logic**: `createServerFn` من `@tanstack/react-start` (مش Edge Functions)
- **Deployment**: Cloudflare Workers
- **اللغة**: العربية أولاً (RTL)، الأرقام بالعربية الشرقية في الواجهة

## ما تم بناؤه

### Phase 1 (مكتملة)
- Landing page عربية مع hero gradient
- نظام مصادقة كامل (signup / login) + RLS
- Schema قاعدة بيانات: 22 جدول + 4 enums + helper functions
- Layout للوحة التاجر (`/app`) ولوحة الإدارة (`/admin`)

### Phase 2 (مكتملة)
- 14 صفحة تاجر شاملة CRUD: حوالات، طلبات، تأكيدات realtime، مصادر، أرصدة، API keys، webhooks، تنبيهات، تكاملات، فريق، إعدادات، مخاطر، تحويلات
- 6 صفحات إدارية: لوحة تحكم، تجار، أجهزة، parser، احتيال، نظام
- صفحة `/reset-password`
- Auto-bootstrap: عند إنشاء حساب جديد، يتم seed لتاجر تجريبي كامل (مصادر، 50 حوالة، 14 طلب، 4 تنبيهات، webhook، API key)
- مكوّنات مشتركة: `EmptyState`, `ErrorState`, `LoadingSkeleton`, `StatusChip`, `exportToCsv`

## الأدوار

- `super_admin` — كل صلاحيات النظام
- `internal_admin` — لوحة `/admin`
- `merchant_owner` — مالك تاجر، كل صلاحيات تاجره
- `merchant_admin` — إدارة تاجر بدون billing
- `operator` — تشغيل يومي
- `viewer` — قراءة فقط

## القرارات المعمارية المهمة

1. **Tenant isolation عبر `merchant_members`** — كل query محمي بـ `is_merchant_member(auth.uid(), merchant_id)`
2. **`bootstrap_demo_merchant`** — security definer function تُستدعى من trigger `on_auth_user_created`
3. **مفاتيح API**: SHA-256 hash عبر `crypto.subtle.digest` في المتصفح، نخزن hash فقط
4. **Realtime**: قناة `parsed_transactions` على جدول `parsed_transactions`
5. **اللغة في DB**: الـ enums بالإنجليزية، الـ labels بالعربية في `ui-helpers.tsx`

## ما لم يُبنَ بعد (Phase 3+)

- Android collector app (Kotlin)
- محرك parser فعلي (الآن قواعد فارغة في `parser_templates`)
- AI extraction عبر Lovable AI Gateway
- محرك Webhook delivery مع retry
- نظام billing فعلي مع Paddle/Stripe
- Subdomains للتجار (`{slug}.goharpay.com`)
- تطبيق ميزة Transfers
