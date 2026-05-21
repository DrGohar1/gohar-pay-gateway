import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, StatusChip } from "@/lib/ui-helpers";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/system")({ component: Page });

type Plan = { id: string; code: string; name_ar: string; monthly_price_egp: number; max_devices: number; max_sources: number; is_active: boolean };

function Page() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plans").select("*").order("monthly_price_egp", { ascending: true });
      setPlans((data ?? []) as Plan[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6">
        <h1 className="text-lg font-semibold font-display">إعدادات النظام والباقات</h1>
      </header>
      <div className="p-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-3">الباقات المتاحة</h2>
          {loading ? <LoadingSkeleton /> : (
            <div className="grid gap-3 md:grid-cols-3">
              {plans.map((p) => (
                <div key={p.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{p.name_ar}</div>
                      <div className="text-xs text-muted-foreground font-mono" dir="ltr">{p.code}</div>
                    </div>
                    <StatusChip tone={p.is_active ? "success" : "muted"}>{p.is_active ? "نشط" : "موقوف"}</StatusChip>
                  </div>
                  <div className="text-3xl font-bold tabular-nums">{Number(p.monthly_price_egp).toLocaleString("ar-EG")} <span className="text-sm font-normal text-muted-foreground">ج.م / شهر</span></div>
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div>أجهزة قصوى: {p.max_devices}</div>
                    <div>مصادر دفع قصوى: {p.max_sources}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">معلومات النظام</h2>
          </div>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">الإصدار</span><span className="font-mono" dir="ltr">v0.2.0 (Phase 2)</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">قاعدة البيانات</span><span>Lovable Cloud</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">المنصة</span><span>TanStack Start + Cloudflare</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">اللغة الأساسية</span><span>العربية (RTL)</span></div>
          </div>
        </section>
      </div>
    </>
  );
}
