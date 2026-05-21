// Demo data used in dashboard shells for phase 1 visuals.
// Replaced by live data from Supabase server functions in phase 2.

export type DemoTxn = {
  id: string;
  provider: "vodafone_cash" | "etisalat_cash" | "orange_cash" | "we_pay" | "instapay" | "bank_sms";
  source: string;
  amount: number;
  reference: string;
  sender: string;
  receivedAt: string;
  confidence: number;
  status: "pending" | "confirmed" | "rejected" | "duplicate" | "manual_review";
  risk: "low" | "medium" | "high" | "critical";
  matchedOrder?: string;
};

const providers: DemoTxn["provider"][] = ["vodafone_cash", "etisalat_cash", "orange_cash", "instapay", "bank_sms"];
const statuses: DemoTxn["status"][] = ["confirmed", "confirmed", "confirmed", "pending", "manual_review", "duplicate", "rejected"];
const risks: DemoTxn["risk"][] = ["low", "low", "low", "low", "medium", "high"];

export const demoTransactions: DemoTxn[] = Array.from({ length: 48 }, (_, i) => {
  const p = providers[i % providers.length];
  return {
    id: `TXN-${(102045 + i).toString()}`,
    provider: p,
    source: p === "instapay" ? "InstaPay - Main" : `Line ${(i % 3) + 1}`,
    amount: Math.round((Math.random() * 4800 + 50) * 100) / 100,
    reference: `REF${Math.floor(100000 + Math.random() * 900000)}`,
    sender: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
    receivedAt: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
    confidence: Math.round((0.55 + Math.random() * 0.45) * 100),
    status: statuses[i % statuses.length],
    risk: risks[i % risks.length],
    matchedOrder: i % 3 === 0 ? `ORD-${10500 + i}` : undefined,
  };
});

export const providerLabel: Record<DemoTxn["provider"], string> = {
  vodafone_cash: "فودافون كاش",
  etisalat_cash: "اتصالات كاش",
  orange_cash: "أورنج كاش",
  we_pay: "WE Pay",
  instapay: "إنستا باي",
  bank_sms: "تحويل بنكي",
};

export const statusLabel: Record<DemoTxn["status"], string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكدة",
  rejected: "مرفوضة",
  duplicate: "مكررة",
  manual_review: "مراجعة يدوية",
};

export const riskLabel: Record<DemoTxn["risk"], string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  critical: "حرج",
};

export const demoSources = [
  { id: "ps1", provider: "vodafone_cash" as const, label: "خط فودافون الرئيسي", identifier: "01001234567", balance: 18540.5, status: "active", lastMessageMin: 3 },
  { id: "ps2", provider: "instapay" as const, label: "InstaPay - Main", identifier: "gohar@instapay", balance: 42100.0, status: "active", lastMessageMin: 11 },
  { id: "ps3", provider: "etisalat_cash" as const, label: "خط اتصالات الفرع", identifier: "01102345678", balance: 7320.75, status: "limit_risk", lastMessageMin: 56 },
];

export const demoAlerts = [
  { id: "a1", severity: "warning" as const, code: "LOW_BALANCE", message: "رصيد خط اتصالات الفرع منخفض", createdMin: 8 },
  { id: "a2", severity: "error" as const, code: "DUPLICATE_REF", message: "تم رصد مرجع مكرر REF482931", createdMin: 24 },
  { id: "a3", severity: "info" as const, code: "DEVICE_ONLINE", message: "جهاز التحصيل #2 متصل الآن", createdMin: 42 },
  { id: "a4", severity: "critical" as const, code: "BALANCE_ANOMALY", message: "تغير غير متوقع في رصيد فودافون كاش", createdMin: 91 },
];

export const demoOrders = Array.from({ length: 14 }, (_, i) => ({
  id: `ORD-${10500 + i}`,
  externalRef: `WC-${20001 + i}`,
  amount: Math.round((Math.random() * 2400 + 100) * 100) / 100,
  customer: `عميل #${i + 1}`,
  status: (["awaiting_payment", "confirmed", "partially_matched", "expired", "manual_review"] as const)[i % 5],
  createdMin: i * 23,
}));
