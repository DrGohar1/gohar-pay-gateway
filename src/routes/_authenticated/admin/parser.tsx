import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton, EmptyState, StatusChip, providerArLabel } from "@/lib/ui-helpers";
import { Cpu } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/parser")({ component: Page });

type Template = { id: string; name: string; provider: string; version: number; is_active: boolean; created_at: string };
type Rule = { id: string; template_id: string; field: string; regex: string; priority: number };

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
      <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6">
        <h1 className="text-lg font-semibold font-display">محرك التحليل (Parser)</h1>
      </header>
      <div className="p-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-3">قوالب التحليل لكل مزود</h2>
          {loading ? <LoadingSkeleton /> : templates.length === 0 ? (
            <EmptyState icon={Cpu} title="لا توجد قوالب بعد" description="القوالب تُربط بكل مزود محفظة لاستخراج المبلغ، المرجع، والمرسل من نص الرسالة." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((t) => {
                const tplRules = rules.filter((r) => r.template_id === t.id);
                return (
                  <div key={t.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div><div className="font-medium">{t.name}</div><div className="text-xs text-muted-foreground">{providerArLabel[t.provider] ?? t.provider} · v{t.version}</div></div>
                      <StatusChip tone={t.is_active ? "success" : "muted"}>{t.is_active ? "نشط" : "موقوف"}</StatusChip>
                    </div>
                    <div className="text-xs text-muted-foreground">{tplRules.length} قاعدة استخراج</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
