import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  text: z.string().min(1).max(4000),
  chatId: z.string().optional(),
});

export const sendTelegramMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChat = process.env.TELEGRAM_DEFAULT_CHAT_ID;
    if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN missing" };
    const chat_id = data.chatId || defaultChat;
    if (!chat_id) return { ok: false, error: "No chat_id configured" };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id, text: data.text, parse_mode: "HTML" }),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body?.description ?? `HTTP ${res.status}` };
    return { ok: true, message_id: body.result?.message_id };
  });
