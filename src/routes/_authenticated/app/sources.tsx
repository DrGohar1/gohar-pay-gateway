import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip, providerArLabel, sourceStatusAr } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smartphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/sources")({ component: Page });

type Src = { id: string; provider: string; label: string; identifier: string; estimated_balance: number; previous_balance: number | null; status: string; last_message_at: string | null; daily_usage: number; monthly_usage: number };

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<Src[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ provider: "vodafone_cash", label: "", identifier: "" });

  async function load() {
    if (!merchantId) return;
    const { data, error } = await supabase.from("payment_sources").select("*").eq("merchant_id", merchantId).order("created_at");
    if (error) setError(error.message); else setRows((data ?? []) as Src[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function create() {
    if (!merchantId) return;
    const { error } = await supabase.from("payment_sources").insert({ merchant_id: merchantId, ...form } as any);
    if (error) toast.error(error.message); else { toast.success("تم"); setOpen(false); setForm({ provider: "vodafone_cash", label: "", identifier: "" }); load(); }
  }
  async function toggle(id: string, current: string) {
    const next = current === "active" ? "paused" : "active";
    const { error } = await supabase.from("payment_sources").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function remove(id: string) {
    if (!confirm("هل تريد حذف هذا المصدر؟")) return;
    const { error } = await supabase.from("payment_sources").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحذف"); load(); }
  }

  if (loading) return (<><AppTopbar title="المصادر والخطوط" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="المصادر والخطوط" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="المصادر والخطوط" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" /> إضافة مصدر</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إضافة مصدر دفع</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>المزود</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                    {Object.entries(providerArLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><Label>الاسم</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="خط فودافون الرئيسي" /></div>
                <div><Label>الرقم / المعرّف</Label><Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} dir="ltr" /></div>
                <Button className="w-full" onClick={create}>إضافة</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Smartphone} title="لا توجد مصادر مسجلة" description="أضف خط فودافون كاش، إنستا باي، أو أي مصدر آخر للبدء." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{providerArLabel[s.provider]}</div>
                    <div className="font-semibold mt-1">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-1" dir="ltr">{s.identifier.replace(/(.{4})(.*)(.{3})/, "$1****$3")}</div>
                  </div>
                  <StatusChip tone={s.status === "active" ? "success" : s.status === "paused" ? "warning" : s.status === "offline" ? "destructive" : "warning"}>{sourceStatusAr[s.status]}</StatusChip>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">الرصيد التقديري</div>
                  <div className="text-xl font-bold font-display tabular-nums">{Number(s.estimated_balance).toLocaleString("ar-EG")} ج.م</div>
                  {s.previous_balance && <div className="text-xs text-muted-foreground mt-1">السابق: {Number(s.previous_balance).toLocaleString("ar-EG")}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-muted-foreground">اليومي</div><div className="font-medium tabular-nums">{Number(s.daily_usage).toLocaleString("ar-EG")}</div></div>
                  <div><div className="text-muted-foreground">الشهري</div><div className="font-medium tabular-nums">{Number(s.monthly_usage).toLocaleString("ar-EG")}</div></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => toggle(s.id, s.status)}>{s.status === "active" ? "إيقاف" : "تفعيل"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
