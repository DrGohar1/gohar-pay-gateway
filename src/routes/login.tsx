import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/app" }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: search.redirect });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: r } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse({ email, password });
    if (!parsed.success) { toast.error("بيانات غير صحيحة"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error("فشل تسجيل الدخول: " + error.message); return; }
    toast.success("أهلاً بك");
    navigate({ to: r });
  };

  return (
    <div dir="rtl" className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex bg-hero-gradient text-white p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Sparkles className="h-5 w-5" /> جوهر باي
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold">منصّتك لتأكيد المدفوعات وعمليات التجار في مصر</h2>
          <p className="mt-4 opacity-90">سجّل دخولك وأكمل إدارة حوالاتك وطلباتك من لوحة واحدة.</p>
        </div>
        <div className="text-xs opacity-70">© جوهر باي</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل بياناتك للوصول إلى لوحتك</p>
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "دخول"}</Button>
          <p className="text-sm text-center text-muted-foreground">
            ليس لديك حساب؟ <Link to="/signup" className="text-primary font-medium">أنشئ حسابًا</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
