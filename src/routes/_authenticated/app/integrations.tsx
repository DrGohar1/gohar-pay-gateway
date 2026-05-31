import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { ShoppingBag, Code2, Webhook as WebhookIcon, Copy, KeyRound, Globe, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMerchant } from "@/lib/use-merchant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/app/integrations")({ component: Page });

function Page() {
  const { merchantId } = useMerchant();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://gogpay.lovable.app";
  const ingestUrl = `${baseUrl}/api/public/ingest`;
  const heartbeatUrl = `${baseUrl}/api/public/heartbeat`;
  const mid = merchantId ?? "YOUR_MERCHANT_ID";

  function copy(s: string) { navigator.clipboard.writeText(s); toast.success("تم النسخ"); }

  const wpSnippet = `// PHP — Gohar Pay WooCommerce hook
add_action('woocommerce_thankyou', function($order_id){
  wp_remote_post('${baseUrl}/api/public/ingest', [
    'headers' => ['Authorization' => 'Bearer ' . GOHAR_PAY_API_KEY],
    'body' => json_encode([ 'merchant_id' => '${mid}', 'order_id' => $order_id ])
  ]);
});`;

  const curlSnippet = `curl -X POST ${baseUrl}/api/public/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant_id": "${mid}",
    "device_id": "DEVICE_UUID",
    "body": "تم استلام مبلغ 500 ج.م من 01001234567",
    "sender": "VodafoneCash",
    "received_at": "2026-05-21T12:00:00Z"
  }'`;

  const jsSnippet = `// Node.js / Next.js
await fetch("${baseUrl}/api/public/ingest", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.GOHAR_PAY_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    merchant_id: "${mid}",
    order_id: order.id,
    amount: order.total
  })
});`;

  const checkoutBase = `${baseUrl}/pay/{LINK_CODE}`;
  const iframeSnippet = `<!-- تضمين صفحة الدفع داخل متجرك -->
<iframe
  src="${checkoutBase}?embed=1&order_id=ORDER_123"
  width="100%" height="640" frameborder="0"
  style="border-radius:16px;max-width:480px;border:1px solid #e5e7eb"
></iframe>
<script>
  window.addEventListener("message", (e) => {
    if (e.data?.type === "gohar_pay:confirmed") {
      // تم تأكيد الدفع تلقائيًا — حدّث الطلب
      window.location.href = "/order-success?id=" + e.data.order_id;
    }
  });
</script>`;

  const redirectSnippet = `// إعادة توجيه المستخدم لصفحة الدفع
const url = new URL("${checkoutBase}");
url.searchParams.set("order_id", "ORDER_123");
url.searchParams.set("callback_url", "https://yourstore.com/return");
window.location.href = url.toString();
// عند نجاح الدفع سيُعاد توجيه العميل إلى:
// https://yourstore.com/return?status=confirmed&order_id=ORDER_123&transaction_id=...`;


  return (
    <>
      <AppTopbar title="الربط والتكاملات" />
      <div className="p-4 sm:p-6 space-y-6">

        {/* Quick credentials banner */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h2 className="font-display font-semibold text-lg">بيانات الربط الخاصة بك</h2>
          </div>
          <p className="text-sm text-muted-foreground">انسخ هذه البيانات وضعها في ووردبريس / ووكوميرس / موقعك أو أي نظام تستخدمه.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Merchant ID" value={mid} onCopy={copy} icon={KeyRound} />
            <Field label="Ingest Endpoint" value={ingestUrl} onCopy={copy} icon={Globe} />
            <Field label="Heartbeat Endpoint" value={heartbeatUrl} onCopy={copy} icon={Smartphone} />
            <Field label="API Base" value={`${baseUrl}/api`} onCopy={copy} icon={Code2} />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/app/api-keys"><Button size="sm"><KeyRound className="h-4 w-4 ml-1" /> إنشاء مفتاح API</Button></Link>
            <Link to="/app/webhooks"><Button size="sm" variant="outline"><WebhookIcon className="h-4 w-4 ml-1" /> إدارة Webhooks</Button></Link>
          </div>
        </div>

        {/* Integration cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card icon={ShoppingBag} title="WooCommerce / WordPress" status="جاهز" desc="ركّب إضافة Gohar Pay على متجرك وأكّد الطلبات تلقائيًا.">
            <ol className="text-xs space-y-1 text-muted-foreground list-decimal pr-4">
              <li>نزّل إضافة Gohar Pay (في مجلد integrations/woocommerce)</li>
              <li>فعّلها من لوحة ووردبريس</li>
              <li>أدخل Merchant ID + API Key</li>
            </ol>
          </Card>

          <Card icon={Code2} title="REST API" status="جاهز" desc="استخدم API للتكامل مع أي نظام مخصص.">
            <div className="text-xs space-y-1">
              <div><span className="text-muted-foreground">Auth:</span> <code dir="ltr">Bearer &lt;API_KEY&gt;</code></div>
              <div><span className="text-muted-foreground">Format:</span> JSON</div>
            </div>
          </Card>

          <Card icon={WebhookIcon} title="Webhooks الصادرة" status="جاهز" desc="استقبل إشعار فور تأكيد كل دفعة على نظامك.">
            <div className="text-xs text-muted-foreground">يدعم HMAC SHA-256 + إعادة المحاولة التلقائية.</div>
          </Card>

          <Card icon={Smartphone} title="تطبيق الأندرويد" status="جاهز" desc="ركّب التطبيق على هاتف يحتوي شريحة المحفظة لقراءة الرسائل تلقائيًا.">
            <Link to="/app/sources"><Button size="sm" variant="outline" className="w-full">إدارة الأجهزة</Button></Link>
          </Card>
        </div>

        {/* Code samples */}
        <div className="rounded-2xl border bg-card p-4 sm:p-6">
          <h3 className="font-display font-semibold mb-3">أمثلة جاهزة للنسخ</h3>
          <Tabs defaultValue="curl">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="js">Node.js</TabsTrigger>
              <TabsTrigger value="php">PHP / WP</TabsTrigger>
            </TabsList>
            <TabsContent value="curl"><CodeBlock code={curlSnippet} onCopy={copy} /></TabsContent>
            <TabsContent value="js"><CodeBlock code={jsSnippet} onCopy={copy} /></TabsContent>
            <TabsContent value="php"><CodeBlock code={wpSnippet} onCopy={copy} /></TabsContent>
          </Tabs>
        </div>

      </div>
    </>
  );
}

function Field({ label, value, onCopy, icon: Icon }: { label: string; value: string; onCopy: (s: string) => void; icon: any }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono break-all" dir="ltr">{value}</code>
        <Button size="sm" variant="ghost" onClick={() => onCopy(value)} className="shrink-0 h-7 w-7 p-0"><Copy className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, status, desc, children }: any) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 grid place-items-center"><Icon className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-success">{status}</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      {children}
    </div>
  );
}

function CodeBlock({ code, onCopy }: { code: string; onCopy: (s: string) => void }) {
  return (
    <div className="relative mt-3">
      <pre className="rounded-lg bg-muted/40 border p-3 text-xs overflow-x-auto" dir="ltr"><code>{code}</code></pre>
      <Button size="sm" variant="ghost" className="absolute top-2 left-2 h-7" onClick={() => onCopy(code)}>
        <Copy className="h-3 w-3 ml-1" /> نسخ
      </Button>
    </div>
  );
}
