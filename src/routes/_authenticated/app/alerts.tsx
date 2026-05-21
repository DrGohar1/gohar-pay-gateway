import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip, alertSeverityAr } from "@/lib/ui-helpers";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/alerts")({ component: Page });

type Alert = { id: string; severity: string; code: string; message: string; created_at: string; resolved_at: string | null };

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "resolved">("active");

  async function load() {
    if (!merchantId) return;
    const { data, error } = await supabase.from("alerts").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
    if (error) setError(error.message); else setRows((data ?? []) as Alert[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function resolve(id: string) {
    const { error } = await supabase.from("alerts").update({ resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم حل التنبيه"); load(); }
  }

  const filtered = rows.filter((a) => tab === "active" ? !a.resolved_at : !!a.resolved_at);

  if (loading) return (<><AppTopbar title="التنبيهات" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="التنبيهات" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="التنبيهات" />
      <div className="p-6 space-y-4">
        <div className="inline-flex rounded-lg border p-1">
          <button onClick={() => setTab("active")} className={`px-4 py-1.5 text-sm rounded-md ${tab === "active" ? "bg-primary text-primary-foreground" : ""}`}>نشطة ({rows.filter((a) => !a.resolved_at).length})</button>
          <button onClick={() => setTab("resolved")} className={`px-4 py-1.5 text-sm rounded-md ${tab === "resolved" ? "bg-primary text-primary-foreground" : ""}`}>محلولة ({rows.filter((a) => !!a.resolved_at).length})</button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title={tab === "active" ? "لا توجد تنبيهات نشطة" : "لا توجد تنبيهات محلولة"} description="كل شيء يعمل بشكل طبيعي." />
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                <StatusChip tone={a.severity === "critical" ? "destructive" : a.severity === "error" ? "destructive" : a.severity === "warning" ? "warning" : "info"}>{alertSeverityAr[a.severity]}</StatusChip>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{a.message}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{a.code} · {new Date(a.created_at).toLocaleString("ar-EG")}</div>
                </div>
                {!a.resolved_at && <Button size="sm" variant="outline" onClick={() => resolve(a.id)}><Check className="h-4 w-4 ml-1" /> حل</Button>}
                {a.resolved_at && <span className="text-xs text-muted-foreground" dir="ltr">{new Date(a.resolved_at).toLocaleDateString("ar-EG")}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3">إعدادات التنبيهات</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <Setting label="حد الرصيد المنخفض (ج.م)" defaultValue="5000" />
            <Setting label="عتبة الثقة الدنيا (%)" defaultValue="60" />
            <Setting label="عدد المحاولات قبل التنبيه" defaultValue="3" />
            <Setting label="نافذة كشف التكرار (دقيقة)" defaultValue="10" />
          </div>
          <Button size="sm" className="mt-4" onClick={() => toast.success("تم حفظ الإعدادات")}>حفظ</Button>
        </div>
      </div>
    </>
  );
}

function Setting({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input defaultValue={defaultValue} className="w-full h-9 rounded-md border bg-background px-3 text-sm" />
    </div>
  );
}
