import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { Clock } from "lucide-react";

function TrialBanner() {
  const { merchantId } = useMerchant();
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!merchantId) return;
    supabase.from("subscriptions").select("is_trial,trial_ends_at,status")
      .eq("merchant_id", merchantId).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data?.is_trial && data.trial_ends_at) {
          setDays(Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000));
        }
      });
  }, [merchantId]);
  if (days === null) return null;
  const expired = days <= 0;
  return (
    <div className={`px-6 py-2 text-sm flex items-center justify-between gap-3 ${expired ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
      <div className="flex items-center gap-2"><Clock className="h-4 w-4" />
        {expired ? "انتهت فترتك التجريبية — قم بالترقية لمتابعة استخدام المنصة" : `أنت في فترة تجريبية — متبقي ${days} ${days === 1 ? "يوم" : "أيام"}`}
      </div>
      <Link to="/app/settings" className="font-medium underline underline-offset-2">ترقية</Link>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app")({
  component: () => (
    <div className="min-h-screen flex w-full bg-muted/20" dir="rtl">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        <TrialBanner />
        <Outlet />
      </main>
    </div>
  ),
});
