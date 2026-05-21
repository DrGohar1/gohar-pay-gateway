import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app" });
  },
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({
      fullName: z.string().min(2).max(120),
      email: z.string().email(),
      password: z.string().min(8).max(72),
    }).safeParse({ fullName, email, password });
    if (!parsed.success) { toast.error("تحقّق من البيانات"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin + "/app" },
    });
    setLoading(false);
    if (error) { toast.error("فشل التسجيل: " + error.message); return; }
    toast.success("تم إنشاء حسابك. تحقّق من بريدك لتأكيد الحساب.");
    navigate({ to: "/login" });
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elegant space-y-5">
        <div>
          <Link to="/" className="text-sm text-primary">→ العودة للرئيسية</Link>
          <h1 className="font-display text-2xl font-bold mt-3">إنشاء حساب تاجر</h1>
          <p className="text-sm text-muted-foreground mt-1">ابدأ تأكيد مدفوعاتك خلال دقائق</p>
        </div>
        <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
        <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-2"><Label>كلمة المرور</Label><Input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "إنشاء الحساب"}</Button>
        <p className="text-sm text-center text-muted-foreground">
          لديك حساب؟ <Link to="/login" className="text-primary font-medium">تسجيل دخول</Link>
        </p>
      </form>
    </div>
  );
}
