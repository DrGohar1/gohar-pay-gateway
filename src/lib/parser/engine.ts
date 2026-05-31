// Parser engine — runs regex rules from parser_templates/parser_rules
// against raw SMS bodies and returns a structured extraction.
// Also ships with built-in fallback rules for major Egyptian payment SMS
// (Vodafone Cash, Etisalat Cash, Orange Cash, WE Pay, InstaPay, NBE, Banque Misr, CIB).

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
  provider_guess?: Provider;
}

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

export function normalize(body: string): string {
  return body
    .replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS[d] ?? d)
    .replace(/[٫،]/g, ".")
    .replace(/[\u200f\u200e\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(s: string): number | undefined {
  const cleaned = s.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

// ============================================================
// Built-in regex library for Egyptian payment SMS providers
// Each entry: detector (substring/regex that identifies the provider)
// + ordered list of capture rules.
// ============================================================
type BuiltinTemplate = {
  provider: Provider;
  detect: RegExp;
  rules: ParserRule[];
};

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    provider: "vodafone_cash",
    detect: /(vodafone\s*cash|فودافون\s*كاش|من\s*\+?2?01[0-9]{9}.*محفظت)/i,
    rules: [
      { field: "amount",        regex: "(?:استلمت|تم\\s*استلام|received)\\s*(?:مبلغ)?\\s*([\\d.,]+)\\s*(?:ج\\.?م|EGP|جنيه)", priority: 100 },
      { field: "amount",        regex: "([\\d.,]+)\\s*(?:ج\\.?م|EGP|جنيه)", priority: 50 },
      { field: "sender",        regex: "من\\s*(?:رقم|\\+?2?)?(01[0-9]{9})", priority: 100 },
      { field: "reference",     regex: "(?:رقم\\s*العملية|reference|ref|txn|كود)\\s*[:#]?\\s*([A-Za-z0-9]{6,})", priority: 100 },
      { field: "reference",     regex: "\\b(FT[A-Z0-9]{8,}|[A-Z0-9]{10,16})\\b", priority: 60 },
      { field: "balance_after", regex: "(?:الرصيد|balance)\\s*(?:الحالي|متاح|available)?\\s*[:=]?\\s*([\\d.,]+)", priority: 100 },
    ],
  },
  {
    provider: "etisalat_cash",
    detect: /(etisalat\s*cash|اتصالات\s*كاش|cash\s*etisalat)/i,
    rules: [
      { field: "amount",        regex: "([\\d.,]+)\\s*(?:ج\\.?م|EGP|جنيه)", priority: 80 },
      { field: "sender",        regex: "من\\s*(?:رقم)?\\s*(01[0-9]{9})", priority: 100 },
      { field: "reference",     regex: "(?:رقم\\s*المرجع|reference|ref)\\s*[:#]?\\s*([A-Z0-9]{6,})", priority: 100 },
      { field: "balance_after", regex: "(?:الرصيد|balance)\\s*[:=]?\\s*([\\d.,]+)", priority: 100 },
    ],
  },
  {
    provider: "orange_cash",
    detect: /(orange\s*cash|أورنج\s*كاش|اورنج\s*كاش|orangemoney)/i,
    rules: [
      { field: "amount",        regex: "(?:قيمة|amount|received)\\s*[:=]?\\s*([\\d.,]+)\\s*(?:ج\\.?م|EGP)", priority: 100 },
      { field: "amount",        regex: "([\\d.,]+)\\s*(?:ج\\.?م|EGP|LE)", priority: 60 },
      { field: "sender",        regex: "(?:من|from)\\s*(01[0-9]{9})", priority: 100 },
      { field: "reference",     regex: "(?:كود\\s*العملية|transaction\\s*id|trxid|ref)\\s*[:#]?\\s*([A-Za-z0-9]{6,})", priority: 100 },
      { field: "balance_after", regex: "(?:رصيدك|balance)\\s*[:=]?\\s*([\\d.,]+)", priority: 100 },
    ],
  },
  {
    provider: "we_pay",
    detect: /(WE\s*Pay|WePay|محفظة\s*WE|محفظتك\s*WE)/i,
    rules: [
      { field: "amount",        regex: "([\\d.,]+)\\s*(?:ج\\.?م|EGP)", priority: 80 },
      { field: "sender",        regex: "(?:من|sender)\\s*(01[0-9]{9})", priority: 100 },
      { field: "reference",     regex: "(?:ref|مرجع|رقم\\s*العملية)\\s*[:#]?\\s*([A-Za-z0-9]{6,})", priority: 100 },
      { field: "balance_after", regex: "(?:رصيد|balance)\\s*[:=]?\\s*([\\d.,]+)", priority: 100 },
    ],
  },
  {
    provider: "instapay",
    detect: /(instapay|انستاباي|إنستاباي|إنستا\s*باي|انستا\s*باي|@instapay|ipn)/i,
    rules: [
      { field: "amount",        regex: "(?:received|تم\\s*استلام|بقيمة|amount\\s*of)\\s*([\\d.,]+)\\s*(?:EGP|ج\\.?م)?", priority: 100 },
      { field: "amount",        regex: "([\\d.,]+)\\s*(?:EGP|ج\\.?م)", priority: 60 },
      { field: "sender",        regex: "(?:from|من)\\s*([A-Za-z0-9._-]+@(?:instapay|cib|nbe|qnb|aaib|adib|baraka|bm|hsbc))", priority: 100 },
      { field: "sender",        regex: "(?:from|من)\\s*(01[0-9]{9})", priority: 90 },
      { field: "reference",     regex: "(?:transaction|txn|ref(?:erence)?)\\s*(?:id|no\\.?|#)?\\s*[:=]?\\s*([A-Z0-9]{8,})", priority: 100 },
      { field: "reference",     regex: "\\bIPN[A-Z0-9]{6,}\\b", priority: 80 },
    ],
  },
  {
    provider: "bank_sms",
    // National Bank of Egypt / Banque Misr / CIB / QNB / AAIB / ADIB
    detect: /(NBE|National\s*Bank\s*of\s*Egypt|البنك\s*الأهلي|Banque\s*Misr|بنك\s*مصر|CIB|البنك\s*التجاري|QNB|AlAhli|Faisal|HSBC)/i,
    rules: [
      { field: "amount",        regex: "(?:credited|deposit(?:ed)?|تم\\s*إيداع|إيداع\\s*مبلغ|تم\\s*خصم)\\s*(?:بمبلغ)?\\s*([\\d.,]+)\\s*(?:EGP|ج\\.?م|جنيه)?", priority: 100 },
      { field: "amount",        regex: "([\\d.,]+)\\s*(?:EGP|ج\\.?م|جنيه)", priority: 50 },
      { field: "sender",        regex: "(?:from|من)\\s*(?:account\\s*)?([A-Z0-9*]{4,})", priority: 80 },
      { field: "reference",     regex: "(?:ref(?:erence)?|trans(?:action)?\\s*id|رقم\\s*العملية)\\s*[:#]?\\s*([A-Z0-9]{6,})", priority: 100 },
      { field: "balance_after", regex: "(?:available\\s*balance|الرصيد\\s*المتاح|balance)\\s*[:=]?\\s*([\\d.,]+)", priority: 100 },
    ],
  },
];

export function detectProvider(body: string): Provider | undefined {
  const text = normalize(body);
  for (const t of BUILTIN_TEMPLATES) {
    if (t.detect.test(text)) return t.provider;
  }
  return undefined;
}

export function runRules(body: string, rules: ParserRule[]): Extraction {
  const text = normalize(body);
  // If no DB rules provided, fall back to built-in templates.
  let effective = rules;
  let providerGuess: Provider | undefined;
  if (!rules || rules.length === 0) {
    providerGuess = detectProvider(text);
    if (providerGuess) {
      effective = BUILTIN_TEMPLATES.find((t) => t.provider === providerGuess)!.rules;
    } else {
      // Try every template; first one to match an amount wins.
      for (const t of BUILTIN_TEMPLATES) {
        const trial = applyRules(text, t.rules);
        if (trial.amount !== undefined) {
          trial.provider_guess = t.provider;
          return trial;
        }
      }
      return { currency: "EGP", confidence: 0, matched_fields: [] };
    }
  }
  const out = applyRules(text, effective);
  if (providerGuess) out.provider_guess = providerGuess;
  return out;
}

function applyRules(text: string, rules: ParserRule[]): Extraction {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  const out: Extraction = { currency: "EGP", confidence: 0, matched_fields: [] };

  for (const r of sorted) {
    const bag = out as unknown as Record<string, unknown>;
    if (bag[r.field] !== undefined && r.field !== "amount") continue;
    let re: RegExp;
    try { re = new RegExp(r.regex, "iu"); } catch { continue; }
    const m = text.match(re);
    if (!m) continue;
    const value = m[1] ?? m[2] ?? m[0];
    if (!value) continue;
    if (out.matched_fields.indexOf(r.field) === -1) out.matched_fields.push(r.field);
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
