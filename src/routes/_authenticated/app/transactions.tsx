import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useMerchant } from "@/lib/use-merchant";
import { EmptyState, ErrorState, LoadingSkeleton, StatusChip, providerArLabel, txnStatusAr, riskAr, exportToCsv } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Download, Search, ListChecks } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/transactions")({ component: Page });

type Txn = {
  id: string; provider: string | null; amount: number; reference: string | null;
  sender_identifier: string | null; created_at: string; confidence: number;
  status: string; risk: string; matched_order_id: string | null;
  source_id: string | null; notes: string | null; balance_after: number | null;
};

function Page() {
  const { merchantId, loading: mLoading } = useMerchant();
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  const [providerF, setProviderF] = useState("");
  const [riskF, setRiskF] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<{ k: keyof Txn; dir: "asc" | "desc" }>({ k: "created_at", dir: "desc" });
  const [page, setPage] = useState(0);
  const pageSize = 20;

  async function load() {
    if (!merchantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("parsed_transactions")
      .select("id,provider,amount,reference,sender_identifier,created_at,confidence,status,risk,matched_order_id,source_id,notes,balance_after")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) setError(error.message);
    else setRows((data ?? []) as Txn[]);
    setLoading(false);
  }
  useEffect(() => { if (merchantId) load(); }, [merchantId]);

  const filtered = useMemo(() => {
    let r = rows;
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((t) => t.id.toLowerCase().includes(s) || (t.reference ?? "").toLowerCase().includes(s) || String(t.amount).includes(s));
    }
    if (statusF) r = r.filter((t) => t.status === statusF);
    if (providerF) r = r.filter((t) => t.provider === providerF);
    if (riskF) r = r.filter((t) => t.risk === riskF);
    const dir = sort.dir === "asc" ? 1 : -1;
    r = [...r].sort((a, b) => {
      const av = a[sort.k] as any, bv = b[sort.k] as any;
      if (av == null) return 1; if (bv == null) return -1;
      return av > bv ? dir : av < bv ? -dir : 0;
    });
    return r;
  }, [rows, q, statusF, providerF, riskF, sort]);

  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("parsed_transactions").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم التحديث");
      setRows((r) => r.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  }

  function toggleSort(k: keyof Txn) {
    setSort((s) => ({ k, dir: s.k === k && s.dir === "desc" ? "asc" : "desc" }));
  }

  if (mLoading || loading) return (<><AppTopbar title="الحوالات" /><div className="p-6"><LoadingSkeleton rows={8} /></div></>);
  if (error) return (<><AppTopbar title="الحوالات" /><div className="p-6"><ErrorState message={error} onRetry={load} /></div></>);

  return (
    <>
      <AppTopbar title="الحوالات" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث بالرقم، المرجع، أو المبلغ..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-9" />
          </div>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={providerF} onChange={(e) => setProviderF(e.target.value)}>
            <option value="">كل المزودين</option>
            {Object.entries(providerArLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.entries(txnStatusAr).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={riskF} onChange={(e) => setRiskF(e.target.value)}>
            <option value="">كل المخاطر</option>
            {Object.entries(riskAr).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => exportToCsv(`transactions-${Date.now()}.csv`, filtered as any)}>
            <Download className="h-4 w-4 ml-1" /> تصدير CSV
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ListChecks} title="لا توجد حوالات" description="لم نرصد أي حوالات تطابق المعايير الحالية. جرّب تعديل الفلاتر." />
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-10"></th>
                    {([["id","رقم"],["provider","المزود"],["amount","المبلغ"],["reference","المرجع"],["status","الحالة"],["risk","المخاطر"],["confidence","الثقة"],["created_at","التوقيت"]] as [keyof Txn,string][]).map(([k, l]) => (
                      <th key={k} className="text-right p-3 font-medium whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort(k)}>
                        {l} {sort.k === k && (sort.dir === "asc" ? "↑" : "↓")}
                      </th>
                    ))}
                    <th className="text-right p-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <>
                      <tr key={t.id} className="border-t hover:bg-muted/20">
                        <td className="p-2">
                          <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="p-1 hover:bg-muted rounded">
                            {expanded === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="p-3 font-mono text-xs" dir="ltr">{t.id.slice(0, 8)}</td>
                        <td className="p-3">{t.provider ? providerArLabel[t.provider] : "—"}</td>
                        <td className="p-3 tabular-nums font-medium">{Number(t.amount).toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-3 text-muted-foreground" dir="ltr">{t.reference ?? "—"}</td>
                        <td className="p-3"><StatusChip tone={t.status === "confirmed" ? "success" : t.status === "rejected" ? "destructive" : t.status === "manual_review" ? "primary" : t.status === "duplicate" ? "muted" : "warning"}>{txnStatusAr[t.status]}</StatusChip></td>
                        <td className="p-3"><StatusChip tone={t.risk === "low" ? "success" : t.risk === "medium" ? "warning" : "destructive"}>{riskAr[t.risk]}</StatusChip></td>
                        <td className="p-3 tabular-nums">{Math.round(Number(t.confidence) * 100)}%</td>
                        <td className="p-3 text-muted-foreground text-xs" dir="ltr">{new Date(t.created_at).toLocaleString("ar-EG")}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "confirmed")}>تأكيد</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "rejected")}>رفض</Button>
                          </div>
                        </td>
                      </tr>
                      {expanded === t.id && (
                        <tr className="bg-muted/10 border-t">
                          <td colSpan={10} className="p-4">
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">الرسالة الخام</div>
                                <div className="rounded bg-muted/40 p-3 font-mono text-xs">سيتم عرض الرسالة الأصلية بعد ربط محرك التحليل</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">تحليل AI</div>
                                <div className="rounded bg-muted/40 p-3 text-xs">قيد التحليل — Phase 5</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">السجل</div>
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                  <li>أنشئت في {new Date(t.created_at).toLocaleString("ar-EG")}</li>
                                  <li>الحالة الحالية: {txnStatusAr[t.status]}</li>
                                  {t.matched_order_id && <li>مرتبطة بطلب {t.matched_order_id.slice(0, 8)}</li>}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between p-3 border-t text-sm">
              <span className="text-muted-foreground">إجمالي {filtered.length} حوالة</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>السابق</Button>
                <span className="px-3 py-1">{page + 1} / {Math.ceil(filtered.length / pageSize)}</span>
                <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage((p) => p + 1)}>التالي</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
