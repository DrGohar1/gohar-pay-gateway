# دليل الإسهام (Contributing)

## بنية المشروع

```
src/
  routes/                # TanStack file-based routing
    _authenticated/      # محمي بـ auth guard
      app/               # لوحة التاجر
      admin/             # لوحة الإدارة
  components/
    ui/                  # shadcn primitives
    layout/              # AppSidebar, AppTopbar
    dashboard/           # SectionShell
  lib/
    ui-helpers.tsx       # مكوّنات مشتركة + Arabic labels
    use-merchant.ts      # tenant context hook
  integrations/supabase/ # auto-generated، لا تعدّلها
supabase/
  migrations/            # SQL migrations
```

## قواعد الكود

1. **العربية أولاً**: كل نص في UI بالعربية
2. **Tenant isolation**: استخدم `useMerchant()` للـ tenant، لا تستعلم مباشرة
3. **Design tokens**: استخدم `text-primary`, `bg-card` — لا تكتب `text-white`
4. **Server fns**: للمنطق الحساس استخدم `createServerFn`، ليس Edge Functions
5. **RLS**: كل جدول جديد لازم يكون عليه RLS + policy `is_merchant_member`

## إضافة صفحة جديدة

1. أنشئ ملف في `src/routes/_authenticated/app/myfeature.tsx`
2. صدّر `Route = createFileRoute(...)`
3. أضف رابط في `AppSidebar.tsx`
4. استخدم `<AppTopbar title="..." />` لرأس الصفحة

## إضافة جدول

```sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  -- ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_my_read ON public.my_table FOR SELECT TO authenticated
  USING (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));
```
