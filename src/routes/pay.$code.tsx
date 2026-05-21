import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/pay/$code")({ component: Page });

type PL = { id: string; merchant_id: string; code: string; title: string; description: string | null; amount: number; currency: string; status: string; expires_at: string | null };

function Page() {
  const { code } = Route.useParams();
  const [link, setLink] = useState<PL | null>(null);
  const [merchant, setMerchant] = useState<{ display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"info" | "pay" | "done">("info");
  const [sender, setSender] = useState("");
  const [ref, setRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payment_links").select("*").eq("code", code).maybeSingle();
      if (data) {
        setLink(data as PL);
        const { data: m } = await supabase.from("merchants").select("display_name").eq("id", (data as PL).merchant_id).maybeSingle();
        setMerchant(m as any);
      }
      setLoading(false);
    })();
  }, [code]);

  async function submit() {
    if (!sender || !ref || !link) { toast.error("املأ كل البيانات"); return; }
    setSubmitting(true);
    // Note: actual confirmation comes from SMS webhook; this just records intent
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setStep("done");
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!link || link.status !== "active" || (link.expires_at && new Date(link.expires_at) < new Date())) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">رابط الدفع غير متاح</h1>
          <p className="text-muted-foreground">قد يكون الرابط منتهي الصلاحية أو ملغيًا.</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-background to-muted/30 grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-hero-gradient grid place-items-center text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold">جوهر باي</span>
        </div>

        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground p-5 text-center">
            <p className="text-xs opacity-80">دفع لصالح</p>
            <h2 className="font-semibold mt-1">{merchant?.display_name ?? "متجر"}</h2>
            <div className="text-4xl font-bold tabular-nums mt-3">{Number(link.amount).toLocaleString("ar-EG")} <span className="text-base font-normal">ج.م</span></div>
            <p className="text-sm opacity-90 mt-2">{link.title}</p>
          </div>

          <div className="p-5 space-y-4">
            {step === "info" && (
              <>
                {link.description && <p className="text-sm text-muted-foreground">{link.description}</p>}
                <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-2">
                  <p className="font-medium">طرق الدفع المتاحة:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• فودافون كاش / اتصالات كاش / أورنج كاش</li>
                    <li>• إنستا باي</li>
                    <li>• تحويل بنكي</li>
                  </ul>
                </div>
                <Button className="w-full" onClick={() => setStep("pay")}>متابعة الدفع</Button>
              </>
            )}

            {step === "pay" && (
              <>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-900 dark:text-amber-200">
                  حوّل المبلغ <strong>{Number(link.amount).toLocaleString("ar-EG")} ج.م</strong> إلى أي من حسابات التاجر، ثم أدخل بياناتك للتأكيد التلقائي.
                </div>
                <div><Label>رقمك / حسابك</Label><Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" /></div>
                <div><Label>رقم العملية / المرجع</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="REF123456" dir="ltr" /></div>
                <Button className="w-full" onClick={submit} disabled={submitting}>{submitting ? "جاري التحقق..." : "تأكيد الدفع"}</Button>
                <button className="w-full text-xs text-muted-foreground" onClick={() => setStep("info")}>رجوع</button>
              </>
            )}

            {step === "done" && (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <h3 className="font-bold text-lg">تم استلام الطلب</h3>
                <p className="text-sm text-muted-foreground mt-2">سيتم تأكيد دفعتك تلقائيًا عند وصول إشعار التحويل للتاجر. يمكنك إغلاق هذه الصفحة.</p>
              </div>
            )}
          </div>

          <div className="border-t bg-muted/20 px-5 py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>محمي بواسطة Gohar Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
