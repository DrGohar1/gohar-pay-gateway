import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link2, Plus, Copy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/payment-links")({ component: Page });

type PL = {
  id: string; code: string; title: string; description: string | null;
  amount: number; currency: string; status: string; expires_at: string | null;
  used_count: number; max_uses: number | null; created_at: string;
};

function Page() {
  const { merchantId, loading: mLoading } = useMerchant();
  const [rows, setRows] = useState<PL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", expires_in_days: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!merchantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as PL[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function create() {
    if (!merchantId || !form.title || !form.amount) {
      toast.error("املأ العنوان والمبلغ");
      return;
    }
    setSaving(true);
    const code = "pl_" + Math.random().toString(36).slice(2, 12);
    const expires = form.expires_in_days
      ? new Date(Date.now() + Number(form.expires_in_days) * 86400000).toISOString()
      : null;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("payment_links").insert({
      merchant_id: merchantId, code, title: form.title,
      description: form.description || null, amount: Number(form.amount),
      currency: "EGP", status: "active", expires_at: expires,
      created_by: u.user?.id,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("تم إنشاء الرابط");
      setOpen(false);
      setForm({ title: "", description: "", amount: "", expires_in_days: "" });
      load();
    }
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("payment_links").update({ status: "revoked" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم الإلغاء"); load(); }
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/pay/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط");
  }

  if (mLoading || loading) return (<><AppTopbar title="روابط الدفع" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="روابط الدفع" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="روابط الدفع" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">أنشئ روابط دفع آمنة لمشاركتها مع عملائك</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-1" /> رابط جديد</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إنشاء رابط دفع</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="فاتورة طلب #1234" /></div>
                <div><Label>المبلغ (ج.م)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="250" /></div>
                <div><Label>الوصف (اختياري)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>ينتهي بعد (أيام، اختياري)</Label><Input type="number" value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: e.target.value })} placeholder="7" /></div>
                <Button onClick={create} disabled={saving} className="w-full">{saving ? "جاري..." : "إنشاء"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Link2} title="لا توجد روابط دفع بعد" description="أنشئ أول رابط دفع لتشاركه مع عملائك." />
        ) : (
          <div className="grid gap-3">
            {rows.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{p.title}</h3>
                    <StatusChip tone={p.status === "active" ? "success" : "muted"}>
                      {p.status === "active" ? "نشط" : p.status === "revoked" ? "ملغي" : p.status}
                    </StatusChip>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  <div className="text-xs text-muted-foreground mt-2 flex gap-4 flex-wrap">
                    <span dir="ltr">/pay/{p.code}</span>
                    <span>استُخدم {p.used_count} مرة</span>
                    {p.expires_at && <span>ينتهي {new Date(p.expires_at).toLocaleDateString("ar-EG")}</span>}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold tabular-nums">{Number(p.amount).toLocaleString("ar-EG")} ج.م</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(p.code)}><Copy className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" asChild><a href={`/pay/${p.code}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                  {p.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => revoke(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
