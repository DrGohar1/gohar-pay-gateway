import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/app/settings")({ component: Page });

function Page() {
  const { merchantId } = useMerchant();
  const [profile, setProfile] = useState<{ full_name: string; email: string; phone: string }>({ full_name: "", email: "", phone: "" });
  const [merchant, setMerchant] = useState<{ display_name: string; contact_email: string }>({ display_name: "", contact_email: "" });
  const [loading, setLoading] = useState(true);
  const [pw, setPw] = useState("");

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: p } = await supabase.from("profiles").select("full_name,email,phone").eq("id", u.user.id).maybeSingle();
    if (p) setProfile({ full_name: p.full_name ?? "", email: p.email ?? "", phone: p.phone ?? "" });
    if (merchantId) {
      const { data: m } = await supabase.from("merchants").select("display_name,contact_email").eq("id", merchantId).maybeSingle();
      if (m) setMerchant({ display_name: m.display_name ?? "", contact_email: m.contact_email ?? "" });
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

function Section({ title, children }: any) {
  return <div className="rounded-xl border bg-card p-5 space-y-3"><h3 className="font-semibold">{title}</h3>{children}</div>;
}
function Field({ label, children }: any) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}
