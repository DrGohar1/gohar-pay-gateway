import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { Activity, CheckCircle2, AlertTriangle, Smartphone, TrendingUp, Clock } from "lucide-react";
import { demoTransactions, demoAlerts, providerLabel, statusLabel } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/")({ component: OverviewPage });

function OverviewPage() {
  const today = demoTransactions.slice(0, 24);
  const confirmed = today.filter((t) => t.status === "confirmed");
  const pending = today.filter((t) => t.status === "pending" || t.status === "manual_review");
  const suspicious = today.filter((t) => t.risk === "high" || t.risk === "critical");
  const total = confirmed.reduce((s, t) => s + t.amount, 0);

  const kpis = [
    { label: "إجمالي اليوم", value: `${total.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} ج.م`, icon: TrendingUp, color: "text-success" },
    { label: "حوالات مؤكدة", value: confirmed.length, icon: CheckCircle2, color: "text-primary" },
    { label: "قيد المراجعة", value: pending.length, icon: Clock, color: "text-warning" },
    { label: "مشبوهة / غير متطابقة", value: suspicious.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "أجهزة نشطة", value: 3, icon: Smartphone, color: "text-primary" },
    { label: "معدل النجاح", value: "97.4%", icon: Activity, color: "text-success" },
  ];

  return (
    <>
      <AppTopbar title="نظرة عامة" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border bg-card-gradient p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="mt-2 text-2xl font-bold font-display">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">آخر النشاطات</h3>
              <span className="text-xs text-muted-foreground">آخر مزامنة: قبل ٣ دقائق</span>
            </div>
            <div className="divide-y">
              {today.slice(0, 8).map((t) => (
                <div key={t.id} className="py-3 flex items-center gap-4 text-sm">
                  <div className={`h-2 w-2 rounded-full ${t.status === "confirmed" ? "bg-success" : t.status === "manual_review" ? "bg-warning" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{providerLabel[t.provider]} — {t.amount.toLocaleString("ar-EG")} ج.م</div>
                    <div className="text-xs text-muted-foreground">{t.id} · {t.reference} · {statusLabel[t.status]}</div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{new Date(t.receivedAt).toLocaleTimeString("ar-EG")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4">التنبيهات</h3>
            <div className="space-y-3">
              {demoAlerts.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      a.severity === "critical" ? "bg-destructive/10 text-destructive" :
                      a.severity === "error" ? "bg-destructive/10 text-destructive" :
                      a.severity === "warning" ? "bg-warning/15 text-warning-foreground" :
                      "bg-primary/10 text-primary"
                    }`}>{a.code}</span>
                    <span className="text-xs text-muted-foreground mr-auto">منذ {a.createdMin}د</span>
                  </div>
                  <div className="text-sm mt-2">{a.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
