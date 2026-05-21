import { ReactNode } from "react";
import { Inbox, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ icon: Icon = Inbox, title, description, action }: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>إعادة المحاولة</Button>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-md bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function StatusChip({ tone, children }: { tone: "success" | "warning" | "destructive" | "muted" | "primary" | "info"; children: ReactNode }) {
  const map = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${map[tone]}`}>{children}</span>;
}

export const providerArLabel: Record<string, string> = {
  vodafone_cash: "فودافون كاش",
  etisalat_cash: "اتصالات كاش",
  orange_cash: "أورنج كاش",
  we_pay: "WE Pay",
  instapay: "إنستا باي",
  bank_sms: "تحويل بنكي",
};

export const txnStatusAr: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكدة",
  rejected: "مرفوضة",
  duplicate: "مكررة",
  manual_review: "مراجعة يدوية",
};

export const orderStatusAr: Record<string, string> = {
  awaiting_payment: "بانتظار الدفع",
  confirmed: "مؤكدة",
  partially_matched: "تطابق جزئي",
  expired: "منتهية",
  manual_review: "مراجعة يدوية",
  cancelled: "ملغاة",
};

export const riskAr: Record<string, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  critical: "حرج",
};

export const sourceStatusAr: Record<string, string> = {
  active: "نشط",
  paused: "متوقف",
  offline: "غير متصل",
  limit_risk: "قارب الحد",
};

export const alertSeverityAr: Record<string, string> = {
  info: "معلومة",
  warning: "تحذير",
  error: "خطأ",
  critical: "حرج",
};

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          if (v === null || v === undefined) return "";
          const s = String(v).replace(/"/g, '""');
          return /[,"\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
