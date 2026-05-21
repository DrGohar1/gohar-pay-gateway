import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, StatusChip } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({ component: Page });

type Row = {
  id: string; merchant_id: string; plan_id: string; status: string;
  is_trial: boolean; trial_ends_at: string | null; current_period_end: string | null;
  merchant?: { display_name: string; contact_email: string | null };
  plan?: { name_ar: string; code: string };
};

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: subs } = await supabase
      .from("subscriptions").select("*").order("created_at", { ascending: false });
    if (subs && subs.length) {
      const mids = [...new Set(subs.map((s: any) => s.merchant_id))];
      const pids = [...new Set(subs.map((s: any) => s.plan_id))];
      const [{ data: ms }, { data: ps }] = await Promise.all([
        supabase.from("merchants").select("id,display_name,contact_email").in("id", mids),
        supabase.from("plans").select("id,name_ar,code").in("id", pids),
      ]);
      const mMap = Object.fromEntries((ms ?? []).map((m: any) => [m.id, m]));
      const pMap = Object.fromEntries((ps ?? []).map((p: any) => [p.id, p]));
      setRows(subs.map((s: any) => ({ ...s, merchant: mMap[s.merchant_id], plan: pMap[s.plan_id] })));
    } else setRows([]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function extend(id: string, days: number) {
    const end = new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await supabase.from("subscriptions").update({
      status: "active", is_trial: false, current_period_end: end,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم التفعيل"); load(); }
  }

  async function cancel(id: string) {
    const { error } = await supabase.from("subscriptions").update({ status: "canceled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم الإلغاء"); load(); }
  }

  function trialBadge(r: Row) {
    if (!r.is_trial || !r.trial_ends_at) return null;
    const days = Math.ceil((new Date(r.trial_ends_at).getTime() - Date.now()) / 86400000);
    const tone = days <= 0 ? "destructive" : days <= 2 ? "warning" : "info";
    return <StatusChip tone={tone}>{days <= 0 ? "انتهت التجربة" : `${days} يوم متبقي`}</StatusChip>;
  }

  return (
    <>
      <AppTopbar title="الاشتراكات والفترات التجريبية" />
      <div className="p-6 space-y-4">
        {loading ? <LoadingSkeleton /> : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-right p-3">التاجر</th>
                  <th className="text-right p-3">البريد</th>
                  <th className="text-right p-3">الباقة</th>
                  <th className="text-right p-3">الحالة</th>
                  <th className="text-right p-3">التجربة</th>
                  <th className="text-right p-3">ينتهي</th>
                  <th className="text-right p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.merchant?.display_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground" dir="ltr">{r.merchant?.contact_email ?? "—"}</td>
                    <td className="p-3">{r.plan?.name_ar ?? r.plan?.code ?? "—"}</td>
                    <td className="p-3"><StatusChip tone={r.status === "active" ? "success" : r.status === "trialing" ? "info" : r.status === "canceled" ? "destructive" : "muted"}>{r.status}</StatusChip></td>
                    <td className="p-3">{trialBadge(r)}</td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{r.current_period_end ? new Date(r.current_period_end).toLocaleDateString("ar-EG") : "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => extend(r.id, 30)}>+30 يوم</Button>
                        <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>إلغاء</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد اشتراكات</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
