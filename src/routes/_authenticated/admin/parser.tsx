import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, EmptyState, StatusChip, providerArLabel } from "@/lib/ui-helpers";
import { Cpu, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppTopbar } from "@/components/layout/AppTopbar";

export const Route = createFileRoute("/_authenticated/admin/parser")({ component: Page });

type Template = { id: string; name: string; provider: string; version: number; is_active: boolean; created_at: string };
type Rule = { id: string; template_id: string; field: string; regex: string; priority: number };

const FIELD_AR: Record<string, string> = {
  amount: "المبلغ", sender: "المرسل", reference: "المرجع", balance_after: "الرصيد بعد", receiver: "المستلم",
};

function Page() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, r] = await Promise.all([
        supabase.from("parser_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("parser_rules").select("*").order("priority", { ascending: true }),
      ]);
      setTemplates((t.data ?? []) as Template[]);
      setRules((r.data ?? []) as Rule[]);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <AppTopbar title="محرك التحليل (Parser)" />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-card p-4 sm:p-5">
          <h2 className="font-display font-semibold flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> قوالب التحليل لكل مزود</h2>
          <p className="text-sm text-muted-foreground mt-1">
            كل مزوّد (فودافون كاش، اتصالات، أورنج، إنستا باي، البنوك) له قالب فيه قواعد Regex لاستخراج المبلغ والمرجع والمرسل والرصيد بعد العملية.
            عند فشل القواعد، يتم استدعاء الذكاء الاصطناعي (Gemini) كاحتياطي.
          </p>
        </div>

        {loading ? <LoadingSkeleton rows={6} /> : templates.length === 0 ? (
          <EmptyState icon={Cpu} title="لا توجد قوالب" description="أضف قوالب لكل مزوّد." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {templates.map((t) => {
              const tplRules = rules.filter((r) => r.template_id === t.id);
              return (
                <Collapsible key={t.id} className="rounded-xl border bg-card overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                    <div className="text-right">
                      <div className="font-medium">{providerArLabel[t.provider] ?? t.provider}</div>
                      <div className="text-xs text-muted-foreground">{t.name} · v{t.version} · {tplRules.length} قاعدة</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip tone={t.is_active ? "success" : "muted"}>{t.is_active ? "نشط" : "موقوف"}</StatusChip>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t divide-y">
                      {tplRules.map((r) => (
                        <div key={r.id} className="p-3 grid grid-cols-[80px_1fr] gap-3 items-center">
                          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary text-center font-medium">{FIELD_AR[r.field] ?? r.field}</span>
                          <code className="text-xs font-mono break-all bg-muted/40 rounded p-2" dir="ltr">{r.regex}</code>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
