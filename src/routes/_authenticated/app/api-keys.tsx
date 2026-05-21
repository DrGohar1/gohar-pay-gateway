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
import { KeyRound, Plus, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/api-keys")({ component: Page });

type Key = { id: string; label: string; key_prefix: string; scopes: string[]; created_at: string; last_used_at: string | null; revoked_at: string | null };

const ALL_SCOPES = [
  { v: "read:transactions", l: "قراءة الحوالات" },
  { v: "write:orders", l: "إدارة الطلبات" },
  { v: "manage:webhooks", l: "إدارة Webhooks" },
];

function rand(n: number) { return Array.from({ length: n }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join(""); }
async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Page() {
  const { merchantId } = useMerchant();
  const [rows, setRows] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ label: string; scopes: string[] }>({ label: "", scopes: ["read:transactions"] });
  const [newKey, setNewKey] = useState<string | null>(null);

  async function load() {
    if (!merchantId) return;
    const { data, error } = await supabase.from("api_keys").select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
    if (error) setError(error.message); else setRows((data ?? []) as Key[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  async function create() {
    if (!merchantId || !form.label) return;
    const raw = "gp_live_" + rand(32);
    const hash = await sha256Hex(raw);
    const { error } = await supabase.from("api_keys").insert({
      merchant_id: merchantId, label: form.label, key_prefix: raw.slice(0, 12),
      key_hash: hash, scopes: form.scopes,
    });
    if (error) { toast.error(error.message); return; }
    setNewKey(raw);
    load();
  }

  async function revoke(id: string) {
    if (!confirm("هل تريد إلغاء هذا المفتاح؟ لن يعمل بعدها.")) return;
    const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الإلغاء"); load(); }
  }

  if (loading) return (<><AppTopbar title="مفاتيح API" /><div className="p-6"><LoadingSkeleton /></div></>);
  if (error) return (<><AppTopbar title="مفاتيح API" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="مفاتيح API" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewKey(null); setForm({ label: "", scopes: ["read:transactions"] }); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" /> إنشاء مفتاح</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{newKey ? "احفظ المفتاح الآن" : "مفتاح API جديد"}</DialogTitle></DialogHeader>
              {newKey ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                    لن يظهر المفتاح مرة أخرى. انسخه واحفظه في مكان آمن.
                  </div>
                  <div className="rounded-lg bg-muted p-3 font-mono text-xs break-all flex items-center gap-2" dir="ltr">
                    {newKey}
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("تم النسخ"); }}><Copy className="h-3 w-3" /></Button>
                  </div>
                  <Button className="w-full" onClick={() => { setOpen(false); setNewKey(null); }}>تم</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label>الاسم</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="مفتاح الإنتاج" /></div>
                  <div><Label>الصلاحيات</Label>
                    <div className="space-y-2 mt-2">
                      {ALL_SCOPES.map((s) => (
                        <label key={s.v} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.scopes.includes(s.v)} onChange={(e) => {
                            setForm((f) => ({ ...f, scopes: e.target.checked ? [...f.scopes, s.v] : f.scopes.filter((x) => x !== s.v) }));
                          }} />
                          {s.l}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={create}>إنشاء</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={KeyRound} title="لا توجد مفاتيح" description="أنشئ مفتاحًا للوصول إلى API من تطبيقاتك." />
        ) : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>{["الاسم","المفتاح","الصلاحيات","الحالة","آخر استخدام","إجراءات"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <tr key={k.id} className="border-t">
                    <td className="p-3 font-medium">{k.label}</td>
                    <td className="p-3 font-mono text-xs" dir="ltr">{k.key_prefix}••••••</td>
                    <td className="p-3 text-xs">{k.scopes.join(", ")}</td>
                    <td className="p-3">{k.revoked_at ? <StatusChip tone="destructive">ملغى</StatusChip> : <StatusChip tone="success">نشط</StatusChip>}</td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{k.last_used_at ? new Date(k.last_used_at).toLocaleString("ar-EG") : "لم يستخدم"}</td>
                    <td className="p-3">{!k.revoked_at && <Button size="sm" variant="ghost" onClick={() => revoke(k.id)}>إلغاء</Button>}</td>
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
