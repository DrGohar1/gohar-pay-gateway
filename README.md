# Gohar Pay Gateway

> منصة تأكيد المدفوعات وعمليات المحافظ للتجار في مصر

تستقبل إشعارات الدفع من المحافظ المصرية (فودافون كاش، اتصالات كاش، أورنج كاش، WE Pay) و InstaPay عبر تطبيق Android، تحلل النص، تطابق الحوالة مع طلب، وترسل Webhook للمتجر فوراً.

## التشغيل السريع

```bash
bun install
bun dev
```

افتح `http://localhost:8080` وسجّل حساب جديد — سيتم إنشاء تاجر تجريبي كامل تلقائياً.

## الملفات المهمة

- [`PROJECT_MEMORY.md`](./PROJECT_MEMORY.md) — سياق المشروع للـ AI
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) — مخطط قاعدة البيانات
- [`USERS.md`](./USERS.md) — كيف تنشئ مستخدم اختبار
- [`FINAL_REPORT.md`](./FINAL_REPORT.md) — تقرير Phase 2
- [`CHANGELOG.md`](./CHANGELOG.md) — سجل التغييرات
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — دليل الإسهام

## التقنيات

TanStack Start • React 19 • Tailwind v4 • Lovable Cloud (Supabase) • Cloudflare Workers
