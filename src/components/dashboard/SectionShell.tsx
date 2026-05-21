import { AppTopbar } from "@/components/layout/AppTopbar";

export function SectionShell({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <>
      <AppTopbar title={title} />
      <div className="p-6 space-y-6">
        {description && <p className="text-sm text-muted-foreground max-w-3xl">{description}</p>}
        {children ?? <ComingSoonPanel title={title} />}
      </div>
    </>
  );
}

export function ComingSoonPanel({ title }: { title: string }) {
  return (
    <div className="rounded-xl border bg-card-gradient p-10 text-center shadow-soft">
      <div className="inline-block rounded-full bg-primary/10 text-primary text-xs px-3 py-1 mb-4">المرحلة الثانية</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        هذه الواجهة جاهزة معماريًا. سيتم تفعيلها بالكامل عند ربط محرك التحليل ومصادر البيانات في المرحلة التالية.
      </p>
    </div>
  );
}
