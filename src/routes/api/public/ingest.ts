// Public ingest endpoint for the Android collector.
// Auth: X-Device-Token (sha256 of token must equal devices.device_token_hash).
// Idempotency: X-Idempotency-Key OR sha256(body) is enforced via unique index.
import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runRules, classifyRisk, type ParserRule } from "@/lib/parser/engine";

const Body = z.object({
  device_id: z.string().uuid(),
  source_id: z.string().uuid().optional(),
  provider: z.enum(["vodafone_cash", "etisalat_cash", "orange_cash", "we_pay", "instapay", "bank_sms"]).optional(),
  sender: z.string().max(64).optional(),
  body: z.string().min(1).max(4000),
  received_at: z.string().datetime().optional(),
});

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export const Route = createFileRoute("/api/public/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-device-token");
        if (!token) return new Response("missing device token", { status: 401 });
        const tokenHash = sha256(token);

        const raw = await request.text();
        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(JSON.parse(raw));
        } catch (e) {
          return new Response(`invalid body: ${String(e)}`, { status: 400 });
        }

        const { data: device } = await supabaseAdmin
          .from("devices")
          .select("id, merchant_id, device_token_hash")
          .eq("id", parsed.device_id)
          .maybeSingle();
        if (!device || device.device_token_hash !== tokenHash) {
          return new Response("device unauthorized", { status: 401 });
        }

        const msgHash = sha256(parsed.body + "|" + (parsed.sender ?? ""));
        const idem = request.headers.get("x-idempotency-key");

        const { data: rawIns, error: rawErr } = await supabaseAdmin
          .from("raw_messages")
          .insert({
            merchant_id: device.merchant_id,
            device_id: device.id,
            source_id: parsed.source_id ?? null,
            provider: parsed.provider ?? null,
            sender: parsed.sender ?? null,
            body: parsed.body,
            message_hash: msgHash,
            received_at: parsed.received_at ?? new Date().toISOString(),
            idempotency_key: idem,
          })
          .select("id")
          .single();

        if (rawErr) {
          if (rawErr.code === "23505") {
            return Response.json({ ok: true, duplicate: true });
          }
          return new Response(rawErr.message, { status: 500 });
        }

        // Run parser
        let rules: ParserRule[] = [];
        if (parsed.provider) {
          const { data: tpl } = await supabaseAdmin
            .from("parser_templates")
            .select("id")
            .eq("provider", parsed.provider)
            .eq("is_active", true)
            .order("version", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (tpl) {
            const { data: rs } = await supabaseAdmin
              .from("parser_rules")
              .select("field, regex, priority")
              .eq("template_id", tpl.id);
            rules = (rs ?? []) as ParserRule[];
          }
        }
        const ex = runRules(parsed.body, rules);
        const risk = classifyRisk(ex);
        const status = ex.amount && ex.confidence >= 0.8 ? "confirmed" : ex.confidence >= 0.4 ? "manual_review" : "pending";

        const { data: txn } = await supabaseAdmin
          .from("parsed_transactions")
          .insert({
            merchant_id: device.merchant_id,
            source_id: parsed.source_id ?? null,
            provider: parsed.provider ?? null,
            raw_message_id: rawIns.id,
            amount: ex.amount ?? 0,
            currency: ex.currency,
            reference: ex.reference,
            sender_identifier: ex.sender ?? parsed.sender,
            confidence: ex.confidence,
            status,
            risk,
            balance_after: ex.balance_after,
            message_timestamp: parsed.received_at ?? new Date().toISOString(),
          })
          .select("id")
          .single();

        if (txn && status === "confirmed") {
          await supabaseAdmin.rpc("enqueue_webhook_delivery", {
            _merchant: device.merchant_id,
            _event: "payment.confirmed",
            _payload: { transaction_id: txn.id, amount: ex.amount, reference: ex.reference, provider: parsed.provider, confidence: ex.confidence, risk },
          });
        }

        return Response.json({ ok: true, transaction_id: txn?.id, status, confidence: ex.confidence });
      },
    },
  },
});
