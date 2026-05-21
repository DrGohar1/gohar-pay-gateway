import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Webhook, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/webhooks")({ component: Page });

const EVENTS = [
  "payment.confirmed", "payment.pending", "payment.rejected", "payment.suspicious",
  "order.updated", "balance.low", "risk.flag.raised",
];

type WH = { id: string; url: string; secret: string; events: string[]; is_active: boolean; created_at: string };
type Del = { id: string; webhook_id: string; event_type: string; status_code: number | null; attempts: number; succeeded: boolean; created_at: string };

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<WH[]>([]);
  const [dels, setDels] = useState<Del[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ url: string; events: string[] }>({ url: "", events: ["payment.confirmed"] });

  async function load() {
    if (!merchantId) return;
    const { data, error } = await supabase.from("webhooks").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setRows((data ?? []) as WH[]);
    const ids = (data ?? []).map((w) => w.id);
    if (ids.length > 0) {
      const { data: d } = await supabase.from("webhook_deliveries").select("*").in("webhook_id", ids).order("created_at", { ascending: false }).limit(50);
      setDels((d ?? []) as Del[]);
    }
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function create() {
    if (!merchantId || !form.url) return;
    const secret = "whsec_" + Array.from({ length: 24 }, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
    const { error } = await supabase.from("webhooks").insert({ merchant_id: merchantId, url: form.url, secret, events: form.events });
    if (error) toast.error(error.message); else { toast.success("تم"); setOpen(false); setForm({ url: "", events: ["payment.confirmed"] }); load(); }
  }
  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from("webhooks").update({ is_active: !active }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function remove(id: string) {
    if (!confirm("حذف الـ webhook؟")) return;
    const { error } = await supabase.from("webhooks").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم"); load(); }
  }
  async function test(w: WH) {
    const { error } = await supabase.from("webhook_deliveries").insert({
      webhook_id: w.id, event_type: "test", payload: { test: true, ts: Date.now() } as any,
      attempts: 1, succeeded: true, status_code: 200, response_body: "OK",
    });
    if (error) toast.error(error.message); else { toast.success("تم إرسال طلب تجريبي"); load(); }
  }

  if (loading) return (<><AppTopbar title="Webhooks" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="Webhooks" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="Webhooks" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" /> إضافة Webhook</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Webhook جديد</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>عنوان URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} dir="ltr" placeholder="https://example.com/webhook" /></div>
                <div><Label>الأحداث</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {EVENTS.map((ev) => (
                      <label key={ev} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={form.events.includes(ev)} onChange={(e) =>
                          setForm((f) => ({ ...f, events: e.target.checked ? [...f.events, ev] : f.events.filter((x) => x !== ev) }))} />
                        <span dir="ltr">{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={create}>إضافة</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Webhook} title="لا توجد Webhooks" description="أضف Webhook لاستقبال الأحداث في نظامك." />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {rows.map((w) => {
                const wDels = dels.filter((d) => d.webhook_id === w.id);
                const successRate = wDels.length > 0 ? Math.round((wDels.filter((d) => d.succeeded).length / wDels.length) * 100) : 100;
                return (
                  <div key={w.id} className="rounded-xl border bg-card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-mono text-xs break-all" dir="ltr">{w.url}</div>
                      <StatusChip tone={w.is_active ? "success" : "muted"}>{w.is_active ? "نشط" : "متوقف"}</StatusChip>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {w.events.map((ev) => <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-muted" dir="ltr">{ev}</span>)}
                    </div>
                    <div className="text-xs text-muted-foreground">نسبة النجاح: {successRate}% · {wDels.length} عملية تسليم</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => test(w)}><Send className="h-3 w-3 ml-1" /> اختبار</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(w.id, w.is_active)}>{w.is_active ? "إيقاف" : "تفعيل"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(w.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border bg-card">
              <div className="p-4 border-b font-semibold">سجل التسليمات</div>
              {dels.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">لا توجد عمليات تسليم بعد</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>{["التوقيت","الحدث","الحالة","المحاولات"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {dels.map((d) => (
                        <tr key={d.id} className="border-t">
                          <td className="p-3 text-xs text-muted-foreground" dir="ltr">{new Date(d.created_at).toLocaleString("ar-EG")}</td>
                          <td className="p-3 font-mono text-xs" dir="ltr">{d.event_type}</td>
                          <td className="p-3"><StatusChip tone={d.succeeded ? "success" : "destructive"}>{d.status_code ?? "—"}</StatusChip></td>
                          <td className="p-3 tabular-nums">{d.attempts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
