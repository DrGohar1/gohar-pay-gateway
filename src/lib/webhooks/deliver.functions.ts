// Webhook delivery worker — signs payload with HMAC-SHA256 and POSTs.
// Called from server functions (e.g. after a transaction is confirmed) or on demand.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const InputSchema = z.object({ limit: z.number().min(1).max(50).default(20) });

export const drainWebhookQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InputSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("webhook_deliveries")
      .select("id, webhook_id, event_type, payload, attempts")
      .eq("succeeded", false)
      .lt("attempts", 5)
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) return { ok: false as const, error: error.message };

    const results: Array<{ id: string; status: number | null; ok: boolean }> = [];

    for (const d of rows ?? []) {
      const { data: wh } = await supabaseAdmin
        .from("webhooks")
        .select("url, secret, is_active")
        .eq("id", d.webhook_id)
        .maybeSingle();
      if (!wh?.is_active) continue;

      const body = JSON.stringify({ event: d.event_type, data: d.payload, ts: Date.now() });
      let status: number | null = null;
      let success = false;
      let respBody = "";
      try {
        const r = await fetch(wh.url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-gohar-signature": sign(wh.secret, body) },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        status = r.status;
        success = r.ok;
        respBody = (await r.text()).slice(0, 1000);
      } catch (e) {
        respBody = String(e).slice(0, 500);
      }

      const nextRetry = success ? null : new Date(Date.now() + Math.pow(2, d.attempts + 1) * 60_000).toISOString();
      await supabaseAdmin
        .from("webhook_deliveries")
        .update({
          attempts: d.attempts + 1,
          status_code: status,
          succeeded: success,
          response_body: respBody,
          next_retry_at: nextRetry,
        })
        .eq("id", d.id);
      results.push({ id: d.id, status, ok: success });
    }
    return { ok: true as const, processed: results.length, results };
  });
