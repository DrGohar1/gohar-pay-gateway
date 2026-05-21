// AI extraction via Lovable AI Gateway — fallback when regex confidence is low.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  body: z.string().min(1).max(4000),
  provider_hint: z.string().optional(),
});

export const extractWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "LOVABLE_API_KEY missing" };

    const sys = `أنت محرك استخراج بيانات حوالات المحافظ المصرية. أعد JSON فقط بالحقول:
{ amount:number|null, currency:"EGP", reference:string|null, sender:string|null, balance_after:number|null, provider:"vodafone_cash"|"etisalat_cash"|"orange_cash"|"instapay"|"bank_sms"|null, confidence:number(0..1), anomalies:string[] }`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `النص:\n${data.body}\n${data.provider_hint ? "تلميح المزود: " + data.provider_hint : ""}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    try {
      return { ok: true as const, fields: JSON.parse(content) };
    } catch {
      return { ok: false as const, error: "AI returned invalid JSON" };
    }
  });
