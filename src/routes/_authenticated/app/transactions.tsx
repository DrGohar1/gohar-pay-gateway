import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { demoTransactions, providerLabel, statusLabel, riskLabel } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/transactions")({ component: Page });

function Page() {
  return (
    <>
      <AppTopbar title="الحوالات" />
      <div className="p-6">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3 flex-wrap">
            <input placeholder="ابحث برقم الحوالة أو المرجع..." className="h-9 flex-1 min-w-64 rounded-md border bg-background px-3 text-sm" />
            <select className="h-9 rounded-md border bg-background px-3 text-sm">
              <option>كل المزودين</option><option>فودافون كاش</option><option>إنستا باي</option>
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm">
              <option>كل الحالات</option><option>مؤكدة</option><option>قيد المراجعة</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {["رقم الحوالة","المزود","المصدر","المبلغ","المرجع","المرسل","الحالة","المخاطر","الثقة","الطلب","التوقيت"].map(h => (
                    <th key={h} className="text-right p-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demoTransactions.slice(0, 30).map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium" dir="ltr">{t.id}</td>
                    <td className="p-3">{providerLabel[t.provider]}</td>
                    <td className="p-3 text-muted-foreground">{t.source}</td>
                    <td className="p-3 tabular-nums font-medium">{t.amount.toLocaleString("ar-EG")} ج.م</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">{t.reference}</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">{t.sender}</td>
                    <td className="p-3"><StatusChip status={t.status} /></td>
                    <td className="p-3"><RiskChip risk={t.risk} /></td>
                    <td className="p-3 tabular-nums">{t.confidence}%</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">{t.matchedOrder || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs" dir="ltr">{new Date(t.receivedAt).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusChip({ status }: { status: keyof typeof statusLabel }) {
  const map: Record<string, string> = {
    confirmed: "bg-success/10 text-success",
    pending: "bg-warning/15 text-warning-foreground",
    rejected: "bg-destructive/10 text-destructive",
    duplicate: "bg-muted text-muted-foreground",
    manual_review: "bg-primary/10 text-primary",
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[status]}`}>{statusLabel[status]}</span>;
}

function RiskChip({ risk }: { risk: keyof typeof riskLabel }) {
  const map: Record<string, string> = {
    low: "bg-success/10 text-success",
    medium: "bg-warning/15 text-warning-foreground",
    high: "bg-destructive/10 text-destructive",
    critical: "bg-destructive/20 text-destructive",
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[risk]}`}>{riskLabel[risk]}</span>;
}
