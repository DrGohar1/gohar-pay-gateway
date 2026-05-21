import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { ShoppingBag, Code2, Webhook as WebhookIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMerchant } from "@/lib/use-merchant";

export const Route = createFileRoute("/_authenticated/app/integrations")({ component: Page });

function Page() {
  const { merchantId } = useMerchant();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const ingestUrl = `${baseUrl}/api/public/ingest`;
  const webhookUrl = `${baseUrl}/api/public/ingest?merchant=${merchantId ?? "YOUR_ID"}`;

  function copy(s: string) { navigator.clipboard.writeText(s); toast.success("تم النسخ"); }

  return (
    <>
      <AppTopbar title="الربط والتكاملات" />
      <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card icon={ShoppingBag} title="WooCommerce" status="غير مفعّل" desc="ربط متجرك على WooCommerce لتأكيد الطلبات تلقائيًا.">
          <ol className="text-xs space-y-1 text-muted-foreground list-decimal pr-4">
            <li>ثبّت إضافة Gohar Pay (قريبًا)</li>
            <li>أدخل عنوان Webhook التالي</li>
            <li>الصق مفتاح API من صفحة المفاتيح</li>
          </ol>
          <CodeBox value={webhookUrl} onCopy={copy} />
        </Card>

        <Card icon={Code2} title="REST API" status="جاهز" desc="استخدم API للتكامل مع أي نظام.">
          <div className="text-xs space-y-2">
            <div><span className="text-muted-foreground">Base URL:</span> <code className="text-xs" dir="ltr">{baseUrl}/api</code></div>
            <div><span className="text-muted-foreground">المصادقة:</span> Bearer {`<API_KEY>`}</div>
          </div>
          <Button variant="outline" size="sm" className="w-full" disabled>عرض التوثيق (قريبًا)</Button>
        </Card>

        <Card icon={WebhookIcon} title="Webhook عام" status="جاهز" desc="استقبل أحداث الدفع في أي نظام.">
          <CodeBox value={ingestUrl} onCopy={copy} />
          <div className="text-xs text-muted-foreground">يدعم HMAC SHA-256 للتحقق من التوقيع.</div>
        </Card>
      </div>
    </>
  );
}

function Card({ icon: Icon, title, status, desc, children }: any) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center"><Icon className="h-5 w-5 text-primary" /></div><div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground">{status}</div></div></div>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      {children}
    </div>
  );
}

function CodeBox({ value, onCopy }: { value: string; onCopy: (s: string) => void }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2 flex items-center gap-2">
      <code className="flex-1 text-xs break-all" dir="ltr">{value}</code>
      <Button size="sm" variant="ghost" onClick={() => onCopy(value)}><Copy className="h-3 w-3" /></Button>
    </div>
  );
}
