import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip, providerArLabel, txnStatusAr } from "@/lib/ui-helpers";
import { Inbox, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/confirmations")({ component: Page });

type Row = { id: string; provider: string | null; amount: number; reference: string | null; status: string; confidence: number; created_at: string };

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  async function load() {
    if (!merchantId) return;
    const { data, error } = await supabase
      .from("parsed_transactions")
      .select("id,provider,amount,reference,status,confidence,created_at")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setError(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  useEffect(() => {
    if (!merchantId) return;
    const ch = supabase
      .channel(`txn-${merchantId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "parsed_transactions", filter: `merchant_id=eq.${merchantId}` },
        (payload) => {
          setRows((r) => [payload.new as Row, ...r].slice(0, 50));
          toast.success("حوالة جديدة وصلت");
        })
      .subscribe();
    const interval = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
  }, [merchantId]);

  const today = rows.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString());

  if (loading) return (<><AppTopbar title="التأكيدات الواردة" /><div className="p-6"><LoadingSkeleton rows={6} /></div></>);
  if (error) return (<><AppTopbar title="التأكيدات الواردة" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="التأكيدات الواردة" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <Radio className={`h-5 w-5 ${live ? "text-success animate-pulse" : "text-muted-foreground"}`} />
            <div>
              <div className="text-sm font-medium">البث المباشر {live ? "نشط" : "متوقف"}</div>
              <div className="text-xs text-muted-foreground">{today.length} حوالة اليوم</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 ml-1" /> تحديث</Button>
          <Button variant="ghost" size="sm" onClick={() => setLive((v) => !v)}>{live ? "إيقاف البث" : "تشغيل البث"}</Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="لم تصل أي تأكيدات بعد" description="ستظهر هنا فور وصول رسائل من جهاز التحصيل." />
        ) : (
          <div className="space-y-2">
            {rows.map((t) => (
              <div key={t.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                <div className={`h-2.5 w-2.5 rounded-full ${t.status === "confirmed" ? "bg-success" : t.status === "manual_review" ? "bg-warning" : t.status === "rejected" ? "bg-destructive" : "bg-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{t.provider ? providerArLabel[t.provider] : "—"} — {Number(t.amount).toLocaleString("ar-EG")} ج.م</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{t.reference ?? "—"} · {new Date(t.created_at).toLocaleString("ar-EG")}</div>
                </div>
                <StatusChip tone={t.status === "confirmed" ? "success" : t.status === "rejected" ? "destructive" : "warning"}>{txnStatusAr[t.status]}</StatusChip>
                <StatusChip tone={Number(t.confidence) >= 0.8 ? "success" : Number(t.confidence) >= 0.6 ? "warning" : "destructive"}>
                  ثقة {Math.round(Number(t.confidence) * 100)}%
                </StatusChip>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
