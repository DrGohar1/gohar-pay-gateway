import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { Activity, CheckCircle2, AlertTriangle, Link2, TrendingUp, Clock, Sparkles, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { providerArLabel, txnStatusAr, LoadingSkeleton } from "@/lib/ui-helpers";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/app/")({ component: OverviewPage });

type Txn = { id: string; provider: string | null; amount: number; reference: string | null; status: string; risk: string; confidence: number; created_at: string; balance_after: number | null };
type Alert = { id: string; code: string; message: string; severity: string; created_at: string };

const PROVIDER_COLORS: Record<string, string> = {
  vodafone_cash: "#E60000",
  etisalat_cash: "#3CB371",
  orange_cash: "#FF6B00",
  we_pay: "#7B2CBF",
  instapay: "#0EA5E9",
  bank_sms: "#64748B",
};

function OverviewPage() {
  const { merchantId } = useMerchant();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [linksCount, setLinksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: t }, { data: a }, { count }] = await Promise.all([
        supabase.from("parsed_transactions")
          .select("id,provider,amount,reference,status,risk,confidence,created_at,balance_after")
          .eq("merchant_id", merchantId).gte("created_at", since)
          .order("created_at", { ascending: false }).limit(500),
        supabase.from("alerts").select("id,code,message,severity,created_at").eq("merchant_id", merchantId).is("resolved_at", null).order("created_at", { ascending: false }).limit(8),
        supabase.from("payment_links").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId).eq("status", "active"),
      ]);
      setTxns((t ?? []) as Txn[]);
      setAlerts((a ?? []) as Alert[]);
      setLinksCount(count ?? 0);
      setLoading(false);
    })();
  }, [merchantId]);

  // ---- aggregations ----
  const today = useMemo(() => txns.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString()), [txns]);
  const confirmed = today.filter((t) => t.status === "confirmed");
  const pending = today.filter((t) => t.status === "pending" || t.status === "manual_review");
  const suspicious = today.filter((t) => t.risk === "high" || t.risk === "critical");
  const total = confirmed.reduce((s, t) => s + Number(t.amount), 0);
  const successRate = today.length ? Math.round((confirmed.length / today.length) * 100) : 0;

  // 7-day volume series
  const series = useMemo(() => {
    const days: { day: string; volume: number; count: number; success: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const items = txns.filter((t) => new Date(t.created_at).toDateString() === key);
      const conf = items.filter((t) => t.status === "confirmed");
      days.push({
        day: d.toLocaleDateString("ar-EG", { weekday: "short" }),
        volume: conf.reduce((s, t) => s + Number(t.amount), 0),
        count: items.length,
        success: items.length ? Math.round((conf.length / items.length) * 100) : 0,
      });
    }
    return days;
  }, [txns]);

  // Provider distribution
  const providerDist = useMemo(() => {
    const map = new Map<string, number>();
    txns.filter((t) => t.status === "confirmed").forEach((t) => {
      const k = t.provider ?? "unknown";
      map.set(k, (map.get(k) ?? 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([k, v]) => ({ name: providerArLabel[k] ?? k, key: k, value: Math.round(v) }));
  }, [txns]);

  // Hourly heatmap (24h × last 7 days)
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    txns.forEach((t) => {
      const d = new Date(t.created_at);
      const dayOffset = 6 - Math.floor((Date.now() - d.getTime()) / 86400000);
      if (dayOffset < 0 || dayOffset > 6) return;
      grid[dayOffset][d.getHours()] += 1;
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [txns]);

  if (loading) return (<><AppTopbar title="نظرة عامة" /><div className="p-6"><LoadingSkeleton rows={6} /></div></>);

  const kpis = [
    { label: "إجمالي اليوم", value: `${total.toLocaleString("ar-EG")} ج.م`, icon: TrendingUp, color: "text-success" },
    { label: "حوالات مؤكدة", value: confirmed.length, icon: CheckCircle2, color: "text-primary" },
    { label: "قيد المراجعة", value: pending.length, icon: Clock, color: "text-warning" },
    { label: "مشبوهة", value: suspicious.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "روابط نشطة", value: linksCount, icon: Link2, color: "text-primary" },
    { label: "معدل النجاح", value: today.length ? `${successRate}%` : "—", icon: Activity, color: "text-success" },
  ];

  const isEmpty = txns.length === 0;

  return (
    <>
      <AppTopbar title="نظرة عامة" />
      <div className="p-6 space-y-6">
        {/* KPIs */}
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
              مساحة عملك جاهزة وفارغة — ابدأ بإنشاء أول رابط دفع أو ربط مصدر دفع.
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

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">حجم العمليات — آخر 7 أيام</h3>
              <span className="text-xs text-muted-foreground">EGP</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="url(#vol)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> توزيع المحافظ</h3>
            {providerDist.length === 0 ? (
              <div className="h-56 grid place-items-center text-sm text-muted-foreground">لا توجد بيانات بعد</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={providerDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {providerDist.map((d, i) => (
                        <Cell key={i} fill={PROVIDER_COLORS[d.key] ?? "#94A3B8"} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">خريطة الكثافة الساعية (آخر 7 أيام)</h3>
            <span className="text-xs text-muted-foreground">عدد العمليات</span>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex gap-[2px] text-[9px] text-muted-foreground pr-8 mb-1" dir="ltr">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="w-5 text-center">{h}</div>
                ))}
              </div>
              {heatmap.grid.map((row, di) => {
                const date = new Date(); date.setDate(date.getDate() - (6 - di));
                return (
                  <div key={di} className="flex items-center gap-[2px] mb-[2px]" dir="ltr">
                    {row.map((v, h) => {
                      const intensity = v / heatmap.max;
                      return (
                        <div
                          key={h}
                          title={`${v} عملية`}
                          className="w-5 h-5 rounded-sm border border-border/30"
                          style={{ background: v === 0 ? "transparent" : `hsl(var(--primary) / ${0.15 + intensity * 0.85})` }}
                        />
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground pl-2 w-8">
                      {date.toLocaleDateString("ar-EG", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent txns + alerts */}
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
