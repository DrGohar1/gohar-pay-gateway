import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { Activity, CheckCircle2, AlertTriangle, Link2, TrendingUp, Clock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { providerArLabel, txnStatusAr, LoadingSkeleton } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/app/")({ component: OverviewPage });

type Txn = { id: string; provider: string | null; amount: number; reference: string | null; status: string; risk: string; confidence: number; created_at: string; balance_after: number | null };
type Alert = { id: string; code: string; message: string; severity: string; created_at: string };

function OverviewPage() {
  const { merchantId } = useMerchant();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [linksCount, setLinksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      const [{ data: t }, { data: a }, { count }] = await Promise.all([
        supabase.from("parsed_transactions").select("id,provider,amount,reference,status,risk,confidence,created_at,balance_after").eq("merchant_id", merchantId).order("created_at", { ascending: false }).limit(100),
        supabase.from("alerts").select("id,code,message,severity,created_at").eq("merchant_id", merchantId).is("resolved_at", null).order("created_at", { ascending: false }).limit(8),
        supabase.from("payment_links").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId).eq("status", "active"),
      ]);
      setTxns((t ?? []) as Txn[]);
      setAlerts((a ?? []) as Alert[]);
      setLinksCount(count ?? 0);
      setLoading(false);
    })();
  }, [merchantId]);

  if (loading) return (<><AppTopbar title="نظرة عامة" /><div className="p-6"><LoadingSkeleton rows={6} /></div></>);

  const today = txns.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString());
  const confirmed = today.filter((t) => t.status === "confirmed");
  const pending = today.filter((t) => t.status === "pending" || t.status === "manual_review");
  const suspicious = today.filter((t) => t.risk === "high" || t.risk === "critical");
  const total = confirmed.reduce((s, t) => s + Number(t.amount), 0);
  const successRate = today.length ? Math.round((confirmed.length / today.length) * 100) : 0;

  const kpis = [
    { label: "إجمالي اليوم", value: `${total.toLocaleString("ar-EG")} ج.م`, icon: TrendingUp, color: "text-success" },
    { label: "حوالات مؤكدة", value: confirmed.length, icon: CheckCircle2, color: "text-primary" },
    { label: "قيد المراجعة", value: pending.length, icon: Clock, color: "text-warning" },
    { label: "مشبوهة", value: suspicious.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "روابط دفع نشطة", value: linksCount, icon: Link2, color: "text-primary" },
    { label: "معدل النجاح", value: today.length ? `${successRate}%` : "—", icon: Activity, color: "text-success" },
  ];

  const isEmpty = txns.length === 0;

  return (
    <>
      <AppTopbar title="نظرة عامة" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="mt-2 text-2xl font-bold font-display">{k.value}</div>
            </div>
          ))}
        </div>

        {isEmpty && (
          <div className="rounded-2xl border-2 border-dashed bg-card p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-2">مرحبًا بك في Gohar Pay</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              مساحة عملك جاهزة وفارغة تمامًا — ابدأ بإنشاء أول رابط دفع أو ربط مصدر دفع لاستقبال الحوالات.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/app/payment-links" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">
                <Link2 className="h-4 w-4" /> إنشاء رابط دفع
              </Link>
              <Link to="/app/sources" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border font-medium hover:bg-muted/50">
                ربط مصدر دفع
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">آخر الحوالات</h3>
              <Link to="/app/transactions" className="text-xs text-primary hover:underline">عرض الكل ←</Link>
            </div>
            {txns.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد حوالات بعد</div>
            ) : (
              <div className="divide-y">
                {txns.slice(0, 8).map((t) => (
                  <div key={t.id} className="py-3 flex items-center gap-4 text-sm">
                    <div className={`h-2 w-2 rounded-full ${t.status === "confirmed" ? "bg-success" : t.status === "manual_review" ? "bg-warning" : "bg-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{(t.provider && providerArLabel[t.provider]) || "—"} — {Number(t.amount).toLocaleString("ar-EG")} ج.م</div>
                      <div className="text-xs text-muted-foreground truncate" dir="ltr">{t.reference ?? t.id.slice(0, 8)} · {txnStatusAr[t.status]}</div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{new Date(t.created_at).toLocaleTimeString("ar-EG")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4">التنبيهات</h3>
            {alerts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">لا توجد تنبيهات</div>
            ) : (
              <div className="space-y-3">
                {alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        a.severity === "critical" || a.severity === "error" ? "bg-destructive/10 text-destructive" :
                        a.severity === "warning" ? "bg-warning/15 text-warning-foreground" :
                        "bg-primary/10 text-primary"
                      }`}>{a.code}</span>
                      <span className="text-xs text-muted-foreground mr-auto" dir="ltr">{new Date(a.created_at).toLocaleDateString("ar-EG")}</span>
                    </div>
                    <div className="text-sm mt-2">{a.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
