import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip, orderStatusAr } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/orders")({ component: Page });

type Order = { id: string; external_ref: string | null; amount: number; customer_label: string | null; status: string; created_at: string; updated_at: string };

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusF, setStatusF] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ external_ref: "", amount: "", customer_label: "" });

  async function load() {
    if (!merchantId) return;
    const { data, error } = await supabase.from("orders")
      .select("id,external_ref,amount,customer_label,status,created_at,updated_at")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message); else setRows((data ?? []) as Order[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function createOrder() {
    if (!merchantId || !form.amount) return;
    const { error } = await supabase.from("orders").insert({
      merchant_id: merchantId,
      external_ref: form.external_ref || null,
      amount: Number(form.amount),
      customer_label: form.customer_label || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("تم إنشاء الطلب"); setOpen(false); setForm({ external_ref: "", amount: "", customer_label: "" }); load(); }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم"); load(); }
  }

  const filtered = statusF ? rows.filter((o) => o.status === statusF) : rows;

  if (loading) return (<><AppTopbar title="الطلبات" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="الطلبات" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="الطلبات" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.entries(orderStatusAr).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="mr-auto" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" /> طلب جديد</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إنشاء طلب يدوي</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>المرجع الخارجي</Label><Input value={form.external_ref} onChange={(e) => setForm({ ...form, external_ref: e.target.value })} placeholder="WC-12345" /></div>
                <div><Label>المبلغ (ج.م)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>العميل</Label><Input value={form.customer_label} onChange={(e) => setForm({ ...form, customer_label: e.target.value })} /></div>
                <Button className="w-full" onClick={createOrder}>إنشاء</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="لا توجد طلبات" description="أنشئ أول طلب يدوي أو انتظر التكامل مع المتجر." />
        ) : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>{["رقم","المرجع","العميل","المبلغ","الحالة","تاريخ الإنشاء","إجراءات"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs" dir="ltr">{o.id.slice(0, 8)}</td>
                    <td className="p-3" dir="ltr">{o.external_ref ?? "—"}</td>
                    <td className="p-3">{o.customer_label ?? "—"}</td>
                    <td className="p-3 tabular-nums font-medium">{Number(o.amount).toLocaleString("ar-EG")} ج.م</td>
                    <td className="p-3"><StatusChip tone={o.status === "confirmed" ? "success" : o.status === "expired" ? "muted" : o.status === "cancelled" ? "destructive" : "warning"}>{orderStatusAr[o.status]}</StatusChip></td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{new Date(o.created_at).toLocaleString("ar-EG")}</td>
                    <td className="p-3"><div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "confirmed")}>تأكيد</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "cancelled")}>إلغاء</Button>
                    </div></td>
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
