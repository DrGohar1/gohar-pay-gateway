import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { LoadingSkeleton } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/app/team")({ component: Page });

const ROLE_AR: Record<string, string> = {
  merchant_owner: "مالك",
  merchant_admin: "مدير",
  operator: "مشغّل",
  finance_viewer: "مالية",
  support_agent: "دعم",
};

function Page() {
  const { merchantId } = useMerchant();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!merchantId) return;
    const { data } = await supabase.from("merchant_members").select("id,role,joined_at,user_id").eq("merchant_id", merchantId);
    if (data && data.length > 0) {
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id,email,full_name").in("id", userIds);
      const merged = data.map((m) => ({ ...m, profile: profiles?.find((p) => p.id === m.user_id) }));
      setMembers(merged);
    }
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  if (loading) return (<><AppTopbar title="الفريق" /><div className="p-6"><LoadingSkeleton /></div></>);

  return (
    <>
      <AppTopbar title="الفريق" />
      <div className="p-6 space-y-4">
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>{["العضو","البريد","الدور","تاريخ الانضمام"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-medium">{m.profile?.full_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground" dir="ltr">{m.profile?.email}</td>
                  <td className="p-3">{ROLE_AR[m.role] ?? m.role}</td>
                  <td className="p-3 text-xs text-muted-foreground" dir="ltr">{new Date(m.joined_at).toLocaleDateString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">دعوة الأعضاء — متاح في Phase 3.</p>
      </div>
    </>
  );
}
