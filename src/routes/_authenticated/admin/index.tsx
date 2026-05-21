import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton } from "@/lib/ui-helpers";
import { Building2, Smartphone, ListChecks, Bell, ShieldAlert, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Page });

function Stat({ icon: Icon, label, value, tone = "primary" }: { icon: any; label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-${tone}/10 grid place-items-center`}><Icon className={`h-5 w-5 text-${tone}`} /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const [stats, setStats] = useState({ merchants: 0, devices: 0, txns: 0, alerts: 0, sources: 0, online: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, d, t, a, s, on] = await Promise.all([
        supabase.from("merchants").select("id", { count: "exact", head: true }),
        supabase.from("devices").select("id", { count: "exact", head: true }),
        supabase.from("parsed_transactions").select("id", { count: "exact", head: true }),
        supabase.from("alerts").select("id", { count: "exact", head: true }).is("resolved_at", null),
        supabase.from("payment_sources").select("id", { count: "exact", head: true }),
        supabase.from("devices").select("id", { count: "exact", head: true }).eq("is_online", true),
      ]);
      setStats({
        merchants: m.count ?? 0, devices: d.count ?? 0, txns: t.count ?? 0,
        alerts: a.count ?? 0, sources: s.count ?? 0, online: on.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6">
        <h1 className="text-lg font-semibold font-display">لوحة الإدارة الداخلية</h1>
      </header>
      <div className="p-6 space-y-6">
        {loading ? <LoadingSkeleton /> : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Stat icon={Building2} label="التجار" value={stats.merchants} />
            <Stat icon={Smartphone} label="الأجهزة" value={stats.devices} />
            <Stat icon={Activity} label="المتصلة الآن" value={stats.online} tone="success" />
            <Stat icon={ListChecks} label="الحوالات" value={stats.txns} />
            <Stat icon={ShieldAlert} label="مصادر الدفع" value={stats.sources} />
            <Stat icon={Bell} label="تنبيهات مفتوحة" value={stats.alerts} tone="warning" />
          </div>
        )}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-2">نظرة عامة على النظام</h3>
          <p className="text-sm text-muted-foreground">لوحة تحكم المسؤولين الداخليين. استخدم القائمة الجانبية للوصول إلى إدارة التجار، الأجهزة، محرك التحليل، وقوائم الاحتيال.</p>
        </div>
      </div>
    </>
  );
}
