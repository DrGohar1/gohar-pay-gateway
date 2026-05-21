import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) setReady(true);
    else {
      // Still allow if already in a session
      supabase.auth.getUser().then(({ data }) => setReady(!!data.user));
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور");
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/20 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="flex justify-center mb-4"><div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center"><KeyRound className="h-6 w-6 text-primary" /></div></div>
        <h1 className="text-2xl font-bold text-center font-display">إعادة تعيين كلمة المرور</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 mb-6">أدخل كلمة المرور الجديدة لحسابك</p>
        {!ready ? (
          <div className="text-center text-sm text-muted-foreground">
            <p>رابط غير صالح أو انتهت صلاحيته.</p>
            <Link to="/login" className="text-primary underline mt-3 inline-block">العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><Label>كلمة المرور الجديدة</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div>
            <div><Label>تأكيد كلمة المرور</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "حفظ كلمة المرور"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
