# Changelog

## [0.2.0] — Phase 2 (2026-05-21)

### Added
- 14 صفحة تاجر CRUD كاملة تحت `/app/*`
- 6 صفحات إدارية تحت `/admin/*`
- صفحة `/reset-password` لإعادة تعيين كلمة المرور
- `bootstrap_demo_merchant()` — auto-seed لتاجر تجريبي مع 50 حوالة و14 طلب
- `current_user_merchant_id()` helper
- مكوّنات UI مشتركة (`ui-helpers.tsx`)
- Hook `useMerchant()` لجلب tenant الحالي
- Realtime على جدول الحوالات
- Client-side SHA-256 hashing لمفاتيح API
- CSV export في جداول التجار والحوالات
- ملفات توثيق (PROJECT_MEMORY, DATABASE_SCHEMA, USERS, FINAL_REPORT)

### Changed
- توسيع `__root.tsx` لإضافة Toaster RTL وmetadata SEO عربية
- AppSidebar — إضافة الـ 14 رابط مع badge "قريباً" للتحويلات

### Security
- Revoke EXECUTE على `bootstrap_demo_merchant` و `handle_new_user` من PUBLIC
- جميع الجداول الجديدة عليها RLS scoped بـ `is_merchant_member`

## [0.1.0] — Phase 1 (2026-05-21)

### Added
- Landing page عربية بـ hero gradient ثلاثي الأبعاد خفيف
- Schema قاعدة بيانات: 22 جدول، 4 enums، 5 helper functions
- نظام مصادقة (signup/login) عبر Supabase Auth
- RLS policies لكل الجداول
- Layout `/app` للتجار و `/admin` للإدارة
- `AppSidebar`, `AppTopbar`, `SectionShell`
- Demo data في `lib/demo-data.ts`
