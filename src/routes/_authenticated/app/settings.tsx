import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/lib/ui-helpers";
import { MessageCircle, Bell, Send, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/settings")({ component: Page });

type Settings = {
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
  whatsapp_enabled?: boolean;
  notify_email?: boolean;
  notify_telegram?: boolean;
  notify_whatsapp?: boolean;
  shopify_domain?: string;
  shopify_token?: string;
};

function Page() {
  const { merchantId } = useMerchant();
  const [profile, setProfile] = useState<{ full_name: string; email: string; phone: string }>({ full_name: "", email: "", phone: "" });
  const [merchant, setMerchant] = useState<{ display_name: string; contact_email: string }>({ display_name: "", contact_email: "" });
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [pw, setPw] = useState("");

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: p } = await supabase.from("profiles").select("full_name,email,phone").eq("id", u.user.id).maybeSingle();
    if (p) setProfile({ full_name: p.full_name ?? "", email: p.email ?? "", phone: p.phone ?? "" });
    if (merchantId) {
      const { data: m } = await supabase.from("merchants").select("display_name,contact_email,settings").eq("id", merchantId).maybeSingle();
      if (m) {
        setMerchant({ display_name: m.display_name ?? "", contact_email: m.contact_email ?? "" });
        setSettings((m.settings as Settings) ?? {});
      }
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [merchantId]);

  async function saveProfile() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update(profile).eq("id", u.user.id);
    if (error) toast.error(error.message); else toast.success("تم الحفظ");
  }
  async function saveMerchant() {
    if (!merchantId) return;
    const { error } = await supabase.from("merchants").update(merchant).eq("id", merchantId);
    if (error) toast.error(error.message); else toast.success("تم الحفظ");
  }
  async function saveSettings(patch: Partial<Settings>) {
    if (!merchantId) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    const { error } = await supabase.from("merchants").update({ settings: next as any }).eq("id", merchantId);
    if (error) toast.error(error.message); else toast.success("تم الحفظ");
  }
  async function changePw() {
    if (!pw || pw.length < 8) { toast.error("كلمة المرور لازم تكون 8 أحرف على الأقل"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message); else { toast.success("تم تغيير كلمة المرور"); setPw(""); }
  }
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return (<><AppTopbar title="الإعدادات" /><div className="p-6"><LoadingSkeleton /></div></>);

  return (
    <>
      <AppTopbar title="الإعدادات" />
      <div className="p-6 space-y-6 max-w-3xl">
        <Section title="الملف الشخصي">
          <Field label="الاسم"><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></Field>
          <Field label="البريد"><Input value={profile.email} disabled dir="ltr" /></Field>
          <Field label="الهاتف"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} dir="ltr" /></Field>
          <Button size="sm" onClick={saveProfile}>حفظ</Button>
        </Section>

        <Section title="بيانات النشاط">
          <Field label="اسم النشاط"><Input value={merchant.display_name} onChange={(e) => setMerchant({ ...merchant, display_name: e.target.value })} /></Field>
          <Field label="بريد التواصل"><Input value={merchant.contact_email} onChange={(e) => setMerchant({ ...merchant, contact_email: e.target.value })} dir="ltr" /></Field>
          <Button size="sm" onClick={saveMerchant}>حفظ</Button>
        </Section>

        <Section title="إشعارات التحويلات" icon={<Bell className="h-4 w-4 text-primary" />}>
          <Toggle label="إشعارات بريد إلكتروني عند تأكيد كل عملية" checked={!!settings.notify_email} onCheckedChange={(v) => saveSettings({ notify_email: v })} />
          <Toggle label="إشعارات تيليجرام" checked={!!settings.notify_telegram} onCheckedChange={(v) => saveSettings({ notify_telegram: v })} />
          <Toggle label="إشعارات واتساب للعميل" checked={!!settings.notify_whatsapp} onCheckedChange={(v) => saveSettings({ notify_whatsapp: v })} />
        </Section>

        <Section title="ربط واتساب Cloud API" icon={<MessageCircle className="h-4 w-4 text-success" />}>
          <p className="text-xs text-muted-foreground">
            احصل على Token و Phone Number ID من <a className="text-primary hover:underline" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">Meta Developers</a>.
          </p>
          <Field label="WhatsApp Token"><Input type="password" value={settings.whatsapp_token ?? ""} onChange={(e) => setSettings({ ...settings, whatsapp_token: e.target.value })} placeholder="EAAG..." dir="ltr" /></Field>
          <Field label="Phone Number ID"><Input value={settings.whatsapp_phone_id ?? ""} onChange={(e) => setSettings({ ...settings, whatsapp_phone_id: e.target.value })} placeholder="1234567890" dir="ltr" /></Field>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => saveSettings({ whatsapp_token: settings.whatsapp_token, whatsapp_phone_id: settings.whatsapp_phone_id, whatsapp_enabled: true })}>
              <Send className="h-3.5 w-3.5 ml-1" /> حفظ وتفعيل
            </Button>
            {settings.whatsapp_enabled && <span className="text-xs text-success">● مفعّل</span>}
          </div>
        </Section>

        <Section title="ربط متجر Shopify" icon={<Store className="h-4 w-4 text-primary" />}>
          <p className="text-xs text-muted-foreground">
            أنشئ Private App في لوحة Shopify وانسخ النطاق و Admin API Token.
          </p>
          <Field label="نطاق المتجر"><Input value={settings.shopify_domain ?? ""} onChange={(e) => setSettings({ ...settings, shopify_domain: e.target.value })} placeholder="mystore.myshopify.com" dir="ltr" /></Field>
          <Field label="Admin API Token"><Input type="password" value={settings.shopify_token ?? ""} onChange={(e) => setSettings({ ...settings, shopify_token: e.target.value })} placeholder="shpat_..." dir="ltr" /></Field>
          <Button size="sm" onClick={() => saveSettings({ shopify_domain: settings.shopify_domain, shopify_token: settings.shopify_token })}>حفظ الربط</Button>
        </Section>

        <Section title="كلمة المرور">
          <Field label="كلمة مرور جديدة"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Button size="sm" onClick={changePw}>تغيير</Button>
        </Section>

        <Section title="منطقة الخطر">
          <p className="text-sm text-muted-foreground">تسجيل الخروج من جميع الجلسات.</p>
          <Button size="sm" variant="destructive" onClick={signOut}>تسجيل الخروج</Button>
        </Section>
      </div>
    </>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: any) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}
function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
