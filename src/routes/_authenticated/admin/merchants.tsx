import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, ErrorState, EmptyState, StatusChip, exportToCsv } from "@/lib/ui-helpers";
import { Building2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/merchants")({ component: Page });

type Row = { id: string; slug: string; display_name: string; legal_name: string; status: string; contact_email: string | null; created_at: string };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    const { data, error } = await supabase.from("merchants")
      .select("id,slug,display_name,legal_name,status,contact_email,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message); else setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("merchants").update({ status: status as "active" | "suspended" | "pending" | "closed" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم تحديث الحالة"); load(); }
  }

  const filtered = rows.filter((r) => !q || r.display_name.includes(q) || r.slug.includes(q) || (r.contact_email ?? "").includes(q));

  return (
    <>
      <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6">
        <h1 className="text-lg font-semibold font-display flex-1">إدارة التجار</h1>
        <Button variant="outline" size="sm" onClick={() => exportToCsv("merchants.csv", filtered)}><Download className="h-4 w-4 ml-1" /> CSV</Button>
      </header>
      <div className="p-6 space-y-4">
        <Input placeholder="ابحث بالاسم أو الـ slug أو البريد..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> :
          filtered.length === 0 ? <EmptyState icon={Building2} title="لا يوجد تجار" /> : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>{["التاجر","Slug","البريد","الحالة","تاريخ التسجيل","إجراءات"].map((h) => <th key={h} className="text-right p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.display_name}<div className="text-xs text-muted-foreground">{r.legal_name}</div></td>
                    <td className="p-3 font-mono text-xs" dir="ltr">{r.slug}</td>
                    <td className="p-3 text-xs" dir="ltr">{r.contact_email ?? "—"}</td>
                    <td className="p-3"><StatusChip tone={r.status === "active" ? "success" : r.status === "suspended" ? "destructive" : "warning"}>{r.status}</StatusChip></td>
                    <td className="p-3 text-xs text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="p-3"><div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "active")}>تفعيل</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "suspended")}>إيقاف</Button>
                    </div></td>
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
