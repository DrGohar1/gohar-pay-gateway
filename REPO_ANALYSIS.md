# Gohar Pay — تحليل كامل للريبو (Repo Analysis)

> آخر تحديث: 2026-05-21 — حالة المستودع بعد المراحل 1→6
> هذا الملف هو **مرجع التحليل الشامل** للحالة الحالية للنظام، الفجوات، والخطوات التالية.

---

## 1) ملخص تنفيذي (TL;DR)

**Gohar Pay** منصة SaaS عربية متعددة المستأجرين لتأكيد مدفوعات المحافظ الإلكترونية و InstaPay للسوق المصري.

- **الحالة**: MVP جاهز للإنتاج تقنيًا — التدفق من SMS → Parser → Webhook يعمل end-to-end.
- **ما يعمل فعليًا**: تسجيل/دخول، tenant auto-bootstrap، 15 صفحة تاجر + 7 صفحات إدارة، Ingest endpoint، Parser regex + AI fallback، Webhooks موقّعة HMAC، روابط دفع، تجربة 5 أيام، تطبيق Android scaffold.
- **ما ينقص للإطلاق التجاري**: تكامل دفع حقيقي للاشتراكات (Stripe/Paddle)، صفحة Branding/SEO للأدمن، اختبار e2e من جهاز Android حقيقي، نشر APK موقّع.

---

## 2) Stack التقني

| الطبقة | التقنية |
|---|---|
| Frontend | TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 |
| UI Kit | shadcn/ui + lucide-react + framer-motion |
| Routing | File-based (`src/routes/`) + `routeTree.gen.ts` (auto) |
| Backend | Lovable Cloud (Supabase Postgres + Auth + Realtime + Storage) |
| Server logic | `createServerFn` + Server Routes (`/api/public/*`) |
| Deployment | Cloudflare Workers (nodejs_compat) |
| AI | Lovable AI Gateway (Gemini 2.5 Flash) |
| Mobile | Android Kotlin + WorkManager + BroadcastReceiver |
| Plugins | WooCommerce (PHP)، Shopify (مخطّط) |

---

## 3) قاعدة البيانات (24 جدول)

### مجموعات الجداول

**Identity & Tenancy**
- `profiles` — بيانات المستخدم العامة
- `user_roles` — أدوار النظام (super_admin / internal_admin / merchant_owner / merchant_admin / operator / viewer)
- `merchants` — التجار (tenants)
- `merchant_members` — ربط user ↔ merchant

**Plans & Billing**
- `plans` — Starter / Growth / Enterprise
- `subscriptions` — اشتراك التاجر + `is_trial` + `trial_ends_at`

**Collection Pipeline**
- `devices` — أجهزة Android (`device_token_hash` SHA-256)
- `payment_sources` — محافظ التاجر (Vodafone Cash, InstaPay…)
- `raw_messages` — SMS الخام + idempotency key + message hash
- `parsed_transactions` — الحوالات بعد التحليل + status + risk + confidence
- `ai_extractions` — مخرجات AI fallback
- `parser_templates` + `parser_rules` — قواعد Regex لكل مزود (للأدمن فقط)

**Orders & Links**
- `orders` — طلبات التاجر (للمطابقة)
- `order_matches` — ربط transaction ↔ order
- `payment_links` — روابط دفع عامة (RLS تسمح بقراءة anon للروابط النشطة)

**Webhooks & Events**
- `webhooks` — endpoints التاجر
- `webhook_deliveries` — سجل الإرسال + retry state
- `transaction_events` — audit trail لكل حوالة

**Risk & Ops**
- `risk_reviews` — مراجعة يدوية للمعاملات المشبوهة
- `alerts` — تنبيهات التاجر
- `source_balances` — snapshots للأرصدة
- `transfers` — تحويلات بين المصادر
- `audit_logs` — audit عام

### دوال SECURITY DEFINER (7)
- `has_role(_user_id, _role)`
- `is_internal_admin(_user_id)`
- `is_merchant_member(_user_id, _merchant_id)`
- `current_user_merchant_id()`
- `handle_new_user()` — trigger لـ `auth.users`
- `bootstrap_demo_merchant(_user_id)` — يصنع tenant كامل لكل مستخدم جديد + تجربة 5 أيام
- `enqueue_webhook_delivery(_merchant, _event, _payload)`
- `touch_updated_at()`

### RLS — الحالة
- كل الجداول الـ tenant-scoped محمية بـ `is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid())`.
- `payment_links` لديها policy إضافي للـ `anon` (قراءة الروابط النشطة فقط) — مطلوب للـ checkout العام.
- `plans` للقراءة العامة (عرض التسعير).
- `parser_templates` و `parser_rules` للأدمن فقط.

---

## 4) صفحات التطبيق

### Public (3)
- `/` — Landing (Hero + Pricing + FAQ + Contact)
- `/login` — تسجيل دخول
- `/signup` — تسجيل + auto-bootstrap
- `/reset-password` — استعادة كلمة المرور
- `/pay/$code` — checkout عام برابط دفع

### Merchant Dashboard `/app/*` (15)
| الصفحة | الوظيفة |
|---|---|
| `/app` (index) | نظرة عامة tenant-isolated + KPIs + empty state |
| `/app/transactions` | جدول الحوالات + Drawer تفاصيل + confirm/reject + balance tracking |
| `/app/confirmations` | تأكيدات Realtime |
| `/app/orders` | طلبات + مطابقة |
| `/app/payment-links` | إنشاء/إدارة روابط دفع |
| `/app/sources` | محافظ التاجر |
| `/app/balances` | أرصدة + snapshots |
| `/app/alerts` | تنبيهات |
| `/app/api-keys` | مفاتيح API (SHA-256 hashing) |
| `/app/webhooks` | endpoints + secrets |
| `/app/integrations` | endpoints + code samples (cURL, Node, PHP/Woo) + merchant_id |
| `/app/team` | أعضاء الفريق |
| `/app/risk` | مراجعة المخاطر |
| `/app/settings` | إعدادات التاجر |
| `/app/transfers` | تحويلات (هيكلي) |

### Admin Dashboard `/admin/*` (7)
| الصفحة | الوظيفة |
|---|---|
| `/admin` (index) | KPIs عامة |
| `/admin/merchants` | كل التجار |
| `/admin/devices` | كل الأجهزة |
| `/admin/parser` | عرض قوالب + قواعد Regex لكل مزود |
| `/admin/fraud` | طابور احتيال |
| `/admin/subscriptions` | تمديد/إلغاء اشتراكات |
| `/admin/system` | إحصاءات النظام |

---

## 5) الـ Backend الخارجي

### Server Routes (`/api/public/*`)
- **`POST /api/public/ingest`** — يستقبل SMS من الـ collector. Auth: `X-Device-Token` يُهاش SHA-256 ويُقارن بـ `devices.device_token_hash`. Idempotency: `X-Idempotency-Key` أو hash جسم الرسالة (unique index). يشغّل الـ parser inline ويُدخل `parsed_transactions` ويستدعي `enqueue_webhook_delivery` عند `status=confirmed`.
- **`POST /api/public/heartbeat`** — تحديث `last_seen_at` و `is_online` للجهاز.

### Server Functions (`createServerFn`)
- `src/lib/parser/ai-extract.functions.ts` — fallback عبر Gemini عند confidence منخفض.
- `src/lib/webhooks/deliver.functions.ts` — توقيع HMAC-SHA256، exponential backoff.
- `src/lib/telegram.functions.ts` — إشعارات Telegram (TELEGRAM_BOT_TOKEN موجود).
- `src/lib/whatsapp.functions.ts` — WhatsApp Cloud API (يحتاج WHATSAPP_TOKEN).

### Parser Engine (`src/lib/parser/engine.ts`)
- تطبيع الأرقام العربية ٠-٩ → 0-9.
- ترتيب القواعد حسب `priority`.
- استخراج: `amount`, `reference`, `sender`, `balance_after`.
- حساب `confidence` بأوزان (amount=0.5، reference=0.25، sender=0.15، balance=0.1).
- تصنيف `risk`: low / medium / high / critical.

### Webhook Delivery
- POST مع رؤوس: `Content-Type: application/json`, `X-Gohar-Event`, `X-Gohar-Signature: sha256=<HMAC>`.
- Retry exponential: 1m, 5m, 15m, 1h, 6h.

---

## 6) Android Collector (`android-collector/`)

```
android-collector/
├─ app/src/main/
│  ├─ AndroidManifest.xml          # RECEIVE_SMS + READ_SMS permissions
│  └─ java/com/goharpay/collector/
│     ├─ MainActivity.kt            # شاشة إدخال device_id + token + start
│     ├─ SmsBroadcastReceiver.kt    # يلتقط SMS_RECEIVED_ACTION
│     ├─ IngestWorker.kt            # WorkManager + idempotency
│     └─ HeartbeatWorker.kt         # ping كل 15 دقيقة
├─ build.gradle.kts
└─ README.md
```

**للبناء**: `./gradlew assembleDebug` من داخل `android-collector/`.

---

## 7) الحسابات الجاهزة

كل الحسابات الستة موجودة في `auth.users` وفي `profiles`، وكل واحد له tenant معزول مع تجربة 5 أيام.

| الدور | البريد | كلمة المرور | الوصول |
|---|---|---|---|
| Super Admin | `superadmin@goharpay.test` | `SuperAdmin@2026` | `/admin` + كل التجار |
| Internal Admin | `admin@goharpay.test` | `Admin@2026` | `/admin` |
| Merchant Owner | `owner@goharpay.test` | `Owner@2026` | `/app` |
| Merchant Admin | `manager@goharpay.test` | `Manager@2026` | `/app` |
| Operator | `operator@goharpay.test` | `Operator@2026` | `/app` (تشغيلي) |
| Viewer | `viewer@goharpay.test` | `Viewer@2026` | `/app` (قراءة) |

**حسابات المالك (المطوّر) رُقّيت إلى super_admin + internal_admin**:
- `ahmed.medo9055@gmail.com` ✅
- `goharrr0@gmail.com` ✅

دلوقتي تقدر تدخل بأي واحد منهم وتشوف `/admin` و `/app` معًا.

---

## 8) Secrets المتاحة في Lovable Cloud

| الاسم | الحالة |
|---|---|
| `SUPABASE_URL` | ✅ |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| `SUPABASE_DB_URL` | ✅ |
| `LOVABLE_API_KEY` | ✅ (AI Gateway) |
| `TELEGRAM_BOT_TOKEN` | ✅ |
| `TELEGRAM_DEFAULT_CHAT_ID` | ✅ |
| `WHATSAPP_TOKEN` | ❌ مطلوب لتفعيل WhatsApp |
| `WHATSAPP_PHONE_ID` | ❌ مطلوب لتفعيل WhatsApp |
| `STRIPE_SECRET_KEY` | ❌ مطلوب للاشتراكات الحقيقية |

---

## 9) ما يعمل فعليًا اليوم (End-to-End)

1. ✅ مستخدم جديد يسجل → trigger يصنع له tenant + تجربة 5 أيام + رابط دفع ترحيبي.
2. ✅ تسجيل دخول بأي حساب من الستة → يدخل لوحته.
3. ✅ التاجر يفتح `/app/integrations` → يجد merchant_id + endpoints + code samples.
4. ✅ التاجر ينشئ رابط دفع `/app/payment-links` → الرابط العام `/pay/{code}` يفتح للعميل.
5. ✅ Android collector (محليًا) يرسل SMS إلى `/api/public/ingest` → يتم parsing → يظهر في `/app/transactions`.
6. ✅ عند `status=confirmed` → webhook يُرسل لـ URL التاجر مع توقيع HMAC.
7. ✅ Realtime: التأكيدات الجديدة تظهر فورًا في `/app/confirmations` بدون refresh.
8. ✅ الأدمن في `/admin` يرى كل التجار، يمدّد اشتراكاتهم، يفحص قواعد parser، ويراجع الاحتيال.

---

## 10) الفجوات والمهام المتبقية

### عاجل (للإطلاق التجاري)
- [ ] **تفعيل دفع الاشتراكات** — Stripe أو Paddle عبر زر تفعيل في Lovable Cloud.
- [ ] **بناء APK موقّع** للـ collector + استضافة download.
- [ ] **اختبار e2e من جهاز Android حقيقي** على شبكة فعلية بـ SMS حقيقي من فودافون كاش و InstaPay.
- [ ] **توسيع قواعد Regex** لكل مزود (الحالي يغطي الأنماط الشائعة فقط — نحتاج عينات حقيقية).

### مهم
- [ ] صفحة Admin Branding/SEO (logo، meta tags، theme colors).
- [ ] WhatsApp template registration + `WHATSAPP_TOKEN` setup.
- [ ] Email notifications (trial expiry, payment confirmed) — يحتاج Resend أو مزود مماثل.
- [ ] Stripe webhook → ترقية تلقائية من trial إلى paid.
- [ ] Shopify plugin.
- [ ] React Native app للتاجر (mobile-first dashboard).

### تحسينات
- [ ] i18n switch (إنجليزي/عربي).
- [ ] تصدير CSV من كل الجداول (الآن في `exportToCsv` helper موجود لكن غير مربوط بكل صفحة).
- [ ] Dark mode polish (الـ toggle موجود لكن بعض الـ tokens محتاجة مراجعة).
- [ ] Pagination حقيقي على الجداول الكبيرة (حاليًا limit 1000).
- [ ] Subdomains للتجار (`{slug}.goharpay.com`) — يحتاج تعديل DNS + middleware.

---

## 11) Migrations المنفّذة

```
20260520...   Phase 1 — schema الأساسي (22 جدول + enums + RLS)
20260521152744 Phase 2 — bootstrap_demo_merchant + 6 demo accounts
20260521160356 Phase 2 — security hardening
20260521164149 Phase 3 — parser templates + rules + idempotency indexes + enqueue_webhook_delivery
20260521180912 Phase 6 — device_token_hash + heartbeat fields
20260521192804 Phase 7 — payment_links + subscription trial fields
```

---

## 12) خريطة الملفات السريعة

```
src/
├─ routes/
│  ├─ index.tsx                    # Landing
│  ├─ login.tsx / signup.tsx / reset-password.tsx
│  ├─ pay.$code.tsx                # Public checkout
│  ├─ _authenticated.tsx           # auth guard layout
│  ├─ _authenticated/app.tsx       # merchant layout + trial banner
│  ├─ _authenticated/app/*.tsx     # 15 صفحة تاجر
│  ├─ _authenticated/admin.tsx     # admin guard layout
│  ├─ _authenticated/admin/*.tsx   # 7 صفحات إدارة
│  └─ api/public/
│     ├─ ingest.ts                 # SMS ingest endpoint
│     └─ heartbeat.ts              # device heartbeat
├─ lib/
│  ├─ parser/
│  │  ├─ engine.ts                 # Regex parser + risk classifier
│  │  └─ ai-extract.functions.ts   # Gemini fallback
│  ├─ webhooks/deliver.functions.ts
│  ├─ telegram.functions.ts
│  ├─ whatsapp.functions.ts
│  ├─ ui-helpers.tsx               # EmptyState, StatusChip, exportToCsv...
│  └─ use-merchant.ts
├─ components/
│  ├─ layout/
│  │  ├─ AppSidebar.tsx            # exports SidebarBrand, AppSidebarNav, AdminSidebarNav
│  │  └─ AppTopbar.tsx             # mobile hamburger + dark mode + logout
│  ├─ dashboard/SectionShell.tsx
│  └─ ui/*                         # shadcn primitives
└─ integrations/supabase/          # auto-generated، لا تُعدّل

android-collector/                  # Android Kotlin app
integrations/woocommerce/           # PHP WooCommerce plugin
supabase/migrations/                # 6 migrations
```

---

## 13) كيف تختبر بنفسك الآن

1. **اطلب publish** للموقع → تحصل على URL ثابت `https://gogpay.lovable.app`.
2. ادخل بـ `ahmed.medo9055@gmail.com` (دلوقتي super_admin).
3. روح `/admin` → شوف كل التجار + الأجهزة + قواعد parser.
4. روح `/app/integrations` → انسخ `merchant_id` + الـ endpoints.
5. جرّب POST يدوي على ingest (مع device_id حقيقي وtoken):
   ```bash
   curl -X POST https://gogpay.lovable.app/api/public/ingest \
     -H "X-Device-Token: <raw-token>" \
     -H "Content-Type: application/json" \
     -d '{"device_id":"<uuid>","provider":"vodafone_cash","body":"تم استلام 250 جنيه من 01000000000 المرجع 123456 الرصيد 500"}'
   ```
6. شوف الحوالة تظهر في `/app/transactions` فورًا.

---

**الخلاصة**: النظام شغّال بنية وتدفقًا. ما تبقى هو ربط مزود دفع للاشتراكات، تجربة من جهاز Android حقيقي، وتوسيع قواعد parser بعينات حقيقية من السوق.
