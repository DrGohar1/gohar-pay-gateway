import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, EmptyState, StatusChip, riskAr } from "@/lib/ui-helpers";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/fraud")({ component: Page });

type Review = { id: string; level: string; reason: string; resolved_at: string | null; created_at: string; merchant_id: string; transaction_id: string | null };

function Page() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("risk_reviews").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data ?? []) as Review[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function resolve(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("risk_reviews").update({ resolved_at: new Date().toISOString(), resolved_by: user?.id }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحل"); load(); }
  }

  return (
    <>
      <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6">
        <h1 className="text-lg font-semibold font-display">قائمة الاحتيال والمخاطر</h1>
      </header>
      <div className="p-6">
        {loading ? <LoadingSkeleton /> : rows.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="لا توجد حالات مفتوحة" description="جميع التنبيهات تم مراجعتها." />
        ) : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>{["المستوى","السبب","التاجر","التاريخ","الحالة","إجراء"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3"><StatusChip tone={r.level === "critical" || r.level === "high" ? "destructive" : r.level === "medium" ? "warning" : "muted"}>{riskAr[r.level] ?? r.level}</StatusChip></td>
                    <td className="p-3">{r.reason}</td>
                    <td className="p-3 font-mono text-[10px]" dir="ltr">{r.merchant_id.slice(0, 8)}</td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString("ar-EG")}</td>
                    <td className="p-3"><StatusChip tone={r.resolved_at ? "success" : "warning"}>{r.resolved_at ? "تم الحل" : "مفتوحة"}</StatusChip></td>
                    <td className="p-3">{!r.resolved_at && <Button size="sm" variant="ghost" onClick={() => resolve(r.id)}>حل</Button>}</td>
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
