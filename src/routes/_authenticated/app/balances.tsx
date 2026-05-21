import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/lib/ui-helpers";
import { Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/balances")({ component: Page });

type Snap = { id: string; source_id: string; balance: number; detected_at: string; reason: string | null };
type Src = { id: string; label: string };

function Page() {
  const { merchantId } = useMerchant();
  const [sources, setSources] = useState<Src[]>([]);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSrc, setSelectedSrc] = useState<string>("");
  const [adjust, setAdjust] = useState({ balance: "", reason: "" });
  const [open, setOpen] = useState(false);

  async function load() {
    if (!merchantId) return;
    const { data: srcs, error: e1 } = await supabase.from("payment_sources").select("id,label").eq("merchant_id", merchantId);
    if (e1) { setError(e1.message); setLoading(false); return; }
    setSources(srcs ?? []);
    if (srcs && srcs.length > 0 && !selectedSrc) setSelectedSrc(srcs[0].id);
    const ids = (srcs ?? []).map((s) => s.id);
    if (ids.length === 0) { setLoading(false); return; }
    const { data: sn, error: e2 } = await supabase.from("source_balances").select("*").in("source_id", ids).order("detected_at", { ascending: false }).limit(200);
    if (e2) setError(e2.message); else setSnaps((sn ?? []) as Snap[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function addSnapshot() {
    if (!selectedSrc || !adjust.balance) return;
    const { error } = await supabase.from("source_balances").insert({ source_id: selectedSrc, balance: Number(adjust.balance), reason: adjust.reason || "manual" });
    if (error) toast.error(error.message); else { toast.success("تم تسجيل اللقطة"); setOpen(false); setAdjust({ balance: "", reason: "" }); load(); }
  }

  const chartData = snaps.filter((s) => s.source_id === selectedSrc).reverse().map((s) => ({ time: new Date(s.detected_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }), balance: Number(s.balance) }));

  if (loading) return (<><AppTopbar title="لقطات الأرصدة" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="لقطات الأرصدة" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);
  if (sources.length === 0) return (<><AppTopbar title="لقطات الأرصدة" /><div className="p-6"><EmptyState icon={Wallet} title="لا توجد مصادر" description="أضف مصادر دفع أولًا لتتبع أرصدتها." /></div></>);

  return (
    <>
      <AppTopbar title="لقطات الأرصدة" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedSrc} onChange={(e) => setSelectedSrc(e.target.value)}>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="mr-auto" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline">تسجيل لقطة يدوية</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>تعديل الرصيد</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>الرصيد الجديد</Label><Input type="number" value={adjust.balance} onChange={(e) => setAdjust({ ...adjust, balance: e.target.value })} /></div>
                <div><Label>السبب (مطلوب للسجل)</Label><Input value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} placeholder="تعديل بعد سحب نقدي..." /></div>
                <Button className="w-full" onClick={addSnapshot}>حفظ</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {chartData.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-4">الرصيد عبر الزمن</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>{["التوقيت","الرصيد","السبب"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {snaps.filter((s) => s.source_id === selectedSrc).map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 text-muted-foreground text-xs" dir="ltr">{new Date(s.detected_at).toLocaleString("ar-EG")}</td>
                  <td className="p-3 tabular-nums font-medium">{Number(s.balance).toLocaleString("ar-EG")} ج.م</td>
                  <td className="p-3 text-xs text-muted-foreground">{s.reason ?? "auto"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
