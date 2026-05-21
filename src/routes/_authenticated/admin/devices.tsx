import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, ErrorState, EmptyState, StatusChip } from "@/lib/ui-helpers";
import { Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/devices")({ component: Page });

type Row = { id: string; label: string; is_online: boolean; last_seen_at: string | null; app_version: string | null; android_id: string | null; merchant_id: string };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("devices")
        .select("id,label,is_online,last_seen_at,app_version,android_id,merchant_id")
        .order("last_seen_at", { ascending: false, nullsFirst: false });
      if (error) setError(error.message); else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6">
        <h1 className="text-lg font-semibold font-display">أجهزة التحصيل</h1>
      </header>
      <div className="p-6">
        {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} /> :
          rows.length === 0 ? <EmptyState icon={Smartphone} title="لا توجد أجهزة" /> : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>{["الجهاز","Android ID","الإصدار","الحالة","آخر اتصال","التاجر"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.label}</td>
                    <td className="p-3 font-mono text-xs" dir="ltr">{r.android_id ?? "—"}</td>
                    <td className="p-3" dir="ltr">{r.app_version ?? "—"}</td>
                    <td className="p-3"><StatusChip tone={r.is_online ? "success" : "muted"}>{r.is_online ? "متصل" : "غير متصل"}</StatusChip></td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{r.last_seen_at ? new Date(r.last_seen_at).toLocaleString("ar-EG") : "—"}</td>
                    <td className="p-3 font-mono text-[10px]" dir="ltr">{r.merchant_id.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
