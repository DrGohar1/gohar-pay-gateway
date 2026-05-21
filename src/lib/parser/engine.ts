// Parser engine — runs regex rules from parser_templates/parser_rules
// against raw SMS bodies and returns a structured extraction.

export type Provider =
  | "vodafone_cash"
  | "etisalat_cash"
  | "orange_cash"
  | "we_pay"
  | "instapay"
  | "bank_sms";

export interface ParserRule {
  field: "amount" | "reference" | "sender" | "balance_after" | string;
  regex: string;
  priority: number;
}

export interface Extraction {
  amount?: number;
  currency: string;
  reference?: string;
  sender?: string;
  balance_after?: number;
  confidence: number;
  matched_fields: string[];
}

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function normalize(body: string): string {
  return body
    .replace(/[٠-٩]/g, (d) => ARABIC_DIGITS[d] ?? d)
    .replace(/\u200f|\u200e/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(s: string): number | undefined {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export function runRules(body: string, rules: ParserRule[]): Extraction {
  const text = normalize(body);
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  const out: Extraction = { currency: "EGP", confidence: 0, matched_fields: [] };

  for (const r of sorted) {
    if (out[r.field as keyof Extraction] !== undefined && r.field !== "amount") continue;
    let re: RegExp;
    try { re = new RegExp(r.regex, "iu"); } catch { continue; }
    const m = text.match(re);
    if (!m) continue;
    const value = m[1] ?? m[2] ?? m[0];
    if (!value) continue;
    out.matched_fields.push(r.field);
    const bag = out as unknown as Record<string, unknown>;
    if (r.field === "amount" || r.field === "balance_after") {
      const n = parseNumber(value);
      if (n !== undefined) bag[r.field] = n;
    } else {
      bag[r.field] = value.trim();
    }
  }

  const weights: Record<string, number> = { amount: 0.5, reference: 0.25, sender: 0.15, balance_after: 0.1 };
  out.confidence = Math.min(
    1,
    out.matched_fields.reduce((acc, f) => acc + (weights[f] ?? 0), 0),
  );
  return out;
}

export function classifyRisk(e: Extraction): "low" | "medium" | "high" | "critical" {
  if (e.confidence >= 0.9 && e.amount) return "low";
  if (e.confidence >= 0.7) return "medium";
  if (e.confidence >= 0.4) return "high";
  return "critical";
}
