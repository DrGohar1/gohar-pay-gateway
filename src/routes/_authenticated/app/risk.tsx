import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, LoadingSkeleton, StatusChip, riskAr } from "@/lib/ui-helpers";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/risk")({ component: Page });

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!merchantId) return;
    const { data } = await supabase.from("parsed_transactions")
      .select("id,amount,reference,risk,status,created_at")
      .eq("merchant_id", merchantId).in("risk", ["medium", "high", "critical"]).order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  if (loading) return (<><AppTopbar title="إدارة المخاطر" /><div className="p-6"><LoadingSkeleton /></div></>);

  return (
    <>
      <AppTopbar title="إدارة المخاطر" />
      <div className="p-6">
        {rows.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="لا توجد حوالات عالية المخاطر" />
        ) : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>{["رقم","المبلغ","المرجع","المخاطر","التوقيت"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-mono text-xs" dir="ltr">{r.id.slice(0, 8)}</td>
                    <td className="p-3 tabular-nums font-medium">{Number(r.amount).toLocaleString("ar-EG")} ج.م</td>
                    <td className="p-3" dir="ltr">{r.reference ?? "—"}</td>
                    <td className="p-3"><StatusChip tone={r.risk === "medium" ? "warning" : "destructive"}>{riskAr[r.risk]}</StatusChip></td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
