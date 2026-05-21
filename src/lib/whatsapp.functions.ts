// WhatsApp Cloud API — send template/text. Stub until WHATSAPP_TOKEN secret is added.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  to: z.string().regex(/^\+?\d{8,15}$/),
  text: z.string().min(1).max(1000),
});

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) return { ok: false as const, error: "WhatsApp not configured (add WHATSAPP_TOKEN + WHATSAPP_PHONE_ID)" };
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: data.to.replace(/^\+/, ""),
        type: "text",
        text: { body: data.text },
      }),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false as const, error: body?.error?.message ?? `HTTP ${res.status}` };
    return { ok: true as const, message_id: body?.messages?.[0]?.id };
  });
