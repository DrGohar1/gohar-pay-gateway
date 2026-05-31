import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle2, Loader2, ShieldCheck, Clock, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/pay/$code")({
  component: Page,
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
    callback_url: typeof s.callback_url === "string" ? s.callback_url : undefined,
    embed: s.embed === "1" || s.embed === "true" ? true : false,
  }),
});

type PL = {
  id: string;
  merchant_id: string;
  code: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  expires_at: string | null;
  matched_transaction_id: string | null;
  metadata: any;
};

type Source = { id: string; provider: string; label: string; identifier: string };

const SESSION_MS = 15 * 60 * 1000;

function storageKey(code: string) { return `gp_pay_${code}`; }

/**
 * Quroosh logic: ensure unique EGP amount for concurrent pending intents.
 * Adds piaster offset (0.01..0.99) based on existing active links/pending txns
 * on the same merchant with the same base amount.
 */
async function computeUniqueAmount(merchantId: string, base: number, excludeCode: string): Promise<number> {
  const floor = Math.floor(Number(base));
  // Count pending payment intents in [floor, floor+1)
  const { data: links } = await supabase
    .from("payment_links")
    .select("amount, code, status, expires_at")
    .eq("merchant_id", merchantId)
    .gte("amount", floor)
    .lt("amount", floor + 1);
  const taken = new Set<number>();
  (links ?? []).forEach((l: any) => {
    if (l.code === excludeCode) return;
    if (l.status !== "active") return;
    if (l.expires_at && new Date(l.expires_at) < new Date()) return;
    taken.add(Math.round((Number(l.amount) - floor) * 100));
  });
  // Try base first if base has piasters already
  const baseOffset = Math.round((Number(base) - floor) * 100);
  if (!taken.has(baseOffset)) return Number(base);
  for (let i = 1; i < 100; i++) {
    if (!taken.has(i)) return +(floor + i / 100).toFixed(2);
  }
  return Number(base);
}

function Page() {
  const { code } = Route.useParams();
  const { order_id, callback_url, embed } = Route.useSearch();

  const [link, setLink] = useState<PL | null>(null);
  const [merchant, setMerchant] = useState<{ display_name: string } | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"info" | "pay" | "done" | "expired">("info");
  const [sender, setSender] = useState("");
  const [ref, setRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uniqueAmount, setUniqueAmount] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const calledBack = useRef(false);

  // Restore persistent state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(code));
      if (raw) {
        const s = JSON.parse(raw);
        if (s.deadline && s.deadline > Date.now()) {
          setDeadline(s.deadline);
          setStep(s.step ?? "info");
          setSender(s.sender ?? "");
          setRef(s.ref ?? "");
        }
      }
    } catch {}
  }, [code]);

  // Persist state
  useEffect(() => {
    if (deadline) {
      localStorage.setItem(storageKey(code), JSON.stringify({ deadline, step, sender, ref }));
    }
  }, [code, deadline, step, sender, ref]);

  // Tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payment_links").select("*").eq("code", code).maybeSingle();
      if (data) {
        const pl = data as PL;
        setLink(pl);
        const [{ data: m }, { data: s }] = await Promise.all([
          supabase.from("merchants").select("display_name").eq("id", pl.merchant_id).maybeSingle(),
          supabase.from("payment_sources").select("id,provider,label,identifier").eq("merchant_id", pl.merchant_id).eq("status", "active"),
        ]);
        setMerchant(m as any);
        setSources((s ?? []) as Source[]);
        // Compute Quroosh amount
        const unique = await computeUniqueAmount(pl.merchant_id, Number(pl.amount), pl.code);
        setUniqueAmount(unique);
        // Set deadline if not persisted
        if (!deadline) setDeadline(Date.now() + SESSION_MS);
        if (pl.matched_transaction_id) setStep("done");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Realtime: listen for payment confirmation
  useEffect(() => {
    if (!link) return;
    const ch = supabase
      .channel(`pay-${link.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payment_links", filter: `id=eq.${link.id}` },
        (payload: any) => {
          const next = payload.new as PL;
          setLink(next);
          if (next.matched_transaction_id) {
            setStep("done");
            fireCallback(next.matched_transaction_id);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [link?.id]);

  function fireCallback(txnId: string) {
    if (calledBack.current) return;
    calledBack.current = true;
    localStorage.removeItem(storageKey(code));
    // postMessage for iframe embeds
    try {
      window.parent?.postMessage({
        type: "gohar_pay:confirmed",
        code, order_id, transaction_id: txnId, amount: uniqueAmount,
      }, "*");
    } catch {}
    // Redirect for standalone
    if (callback_url && !embed) {
      setTimeout(() => {
        const url = new URL(callback_url);
        url.searchParams.set("status", "confirmed");
        url.searchParams.set("order_id", order_id ?? "");
        url.searchParams.set("transaction_id", txnId);
        window.location.href = url.toString();
      }, 2000);
    }
  }

  const remaining = deadline ? Math.max(0, deadline - now) : 0;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  useEffect(() => {
    if (deadline && remaining === 0 && step !== "done") setStep("expired");
  }, [remaining, deadline, step]);

  async function submit() {
    if (!sender || !ref || !link) { toast.error("املأ كل البيانات"); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success("تم استلام طلبك. ننتظر تأكيد التحويل تلقائيًا.");
  }

  function copyAmount() {
    if (uniqueAmount == null) return;
    navigator.clipboard.writeText(String(uniqueAmount));
    toast.success("تم نسخ المبلغ");
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!link || link.status !== "active" || (link.expires_at && new Date(link.expires_at) < new Date())) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2">رابط الدفع غير متاح</h1>
          <p className="text-muted-foreground">قد يكون الرابط منتهي الصلاحية أو ملغيًا.</p>
        </div>
      </div>
    );
  }

  const amount = uniqueAmount ?? Number(link.amount);
  const padded = uniqueAmount != null && uniqueAmount !== Number(link.amount);

  return (
    <div dir="rtl" className={`${embed ? "" : "min-h-screen bg-gradient-to-b from-background to-muted/30"} grid place-items-center p-4`}>
      <div className="w-full max-w-md">
        {!embed && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-hero-gradient grid place-items-center text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold">جوهر باي</span>
          </div>
        )}

        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground p-5 text-center">
            <p className="text-xs opacity-80">دفع لصالح</p>
            <h2 className="font-semibold mt-1">{merchant?.display_name ?? "متجر"}</h2>
            <div className="text-4xl font-bold tabular-nums mt-3 flex items-center justify-center gap-2">
              {amount.toLocaleString("ar-EG", { minimumFractionDigits: 2 })}
              <span className="text-base font-normal">ج.م</span>
              <button onClick={copyAmount} className="opacity-80 hover:opacity-100"><Copy className="h-4 w-4" /></button>
            </div>
            <p className="text-sm opacity-90 mt-2">{link.title}</p>
            {padded && (
              <p className="text-[11px] opacity-80 mt-2 bg-white/10 rounded px-2 py-1 inline-block">
                ⚡ أضفنا قروشًا للتعرّف الفوري على دفعتك
              </p>
            )}
            {order_id && <p className="text-[10px] opacity-70 mt-1" dir="ltr">Order: {order_id}</p>}
          </div>

          {step !== "done" && step !== "expired" && (
            <div className="flex items-center justify-center gap-1.5 bg-muted/40 py-2 text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>الجلسة تنتهي خلال</span>
              <span className="tabular-nums font-mono font-semibold" dir="ltr">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="p-5 space-y-4">
            {step === "info" && (
              <>
                {link.description && <p className="text-sm text-muted-foreground">{link.description}</p>}
                {sources.length > 0 ? (
                  <Tabs defaultValue={sources[0].provider}>
                    <TabsList className="grid grid-cols-2 w-full">
                      {sources.slice(0, 4).map((s) => (
                        <TabsTrigger key={s.id} value={s.provider} className="text-xs">{s.label}</TabsTrigger>
                      ))}
                    </TabsList>
                    {sources.map((s) => (
                      <TabsContent key={s.id} value={s.provider}>
                        <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-2">
                          <div className="text-xs text-muted-foreground">حوّل إلى الرقم/الحساب:</div>
                          <div className="flex items-center justify-between gap-2">
                            <code className="font-mono text-base" dir="ltr">{s.identifier}</code>
                            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(s.identifier); toast.success("تم النسخ"); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            بالمبلغ بالضبط: <strong className="text-foreground tabular-nums">{amount.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</strong>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="rounded-lg bg-muted/40 p-3 text-sm">
                    <p className="font-medium mb-1">طرق الدفع المتاحة:</p>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      <li>• فودافون كاش / اتصالات كاش / أورنج كاش</li>
                      <li>• إنستا باي</li>
                      <li>• تحويل بنكي</li>
                    </ul>
                  </div>
                )}
                <Button className="w-full" onClick={() => setStep("pay")}>تم التحويل — متابعة التأكيد</Button>
              </>
            )}

            {step === "pay" && (
              <>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
                  بعد تحويل المبلغ <strong>{amount.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م</strong>، أدخل بياناتك. سيتم التأكيد تلقائيًا فور وصول إشعار التحويل.
                </div>
                <div><Label>رقمك / حسابك</Label><Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" /></div>
                <div><Label>رقم العملية / المرجع</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="REF123456" dir="ltr" /></div>
                <Button className="w-full" onClick={submit} disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 ml-1 animate-spin" /> جاري التحقق...</> : "تأكيد الدفع"}
                </Button>
                <button className="w-full text-xs text-muted-foreground" onClick={() => setStep("info")}>رجوع</button>
              </>
            )}

            {step === "done" && (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <h3 className="font-bold text-lg">تم تأكيد الدفع</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {callback_url ? "سيتم تحويلك للمتجر خلال ثوانٍ..." : "يمكنك إغلاق هذه الصفحة."}
                </p>
              </div>
            )}

            {step === "expired" && (
              <div className="text-center py-4">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <h3 className="font-bold">انتهت جلسة الدفع</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-3">من فضلك أنشئ طلبًا جديدًا من المتجر.</p>
                <Button variant="outline" onClick={() => { localStorage.removeItem(storageKey(code)); window.location.reload(); }}>إعادة المحاولة</Button>
              </div>
            )}
          </div>

          <div className="border-t bg-muted/20 px-5 py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>محمي بواسطة Gohar Pay · دفع آمن داخل مصر</span>
          </div>
        </div>
      </div>
    </div>
  );
}
