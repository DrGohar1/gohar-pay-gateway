
-- Idempotency & dedup
CREATE UNIQUE INDEX IF NOT EXISTS uq_raw_idem ON public.raw_messages (merchant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_raw_hash ON public.raw_messages (merchant_id, message_hash);

-- Allow service-role inserts via RLS (admin bypass + member of merchant)
DROP POLICY IF EXISTS p_raw_insert ON public.raw_messages;
CREATE POLICY p_raw_insert ON public.raw_messages
  FOR INSERT TO authenticated
  WITH CHECK (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));

DROP POLICY IF EXISTS p_txn_insert ON public.parsed_transactions;
CREATE POLICY p_txn_insert ON public.parsed_transactions
  FOR INSERT TO authenticated
  WITH CHECK (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));

-- Seed parser templates (idempotent)
INSERT INTO public.parser_templates (provider, name, version, is_active)
SELECT v.provider::public.source_provider, v.name, 1, true
FROM (VALUES
  ('vodafone_cash','Vodafone Cash — Credit'),
  ('etisalat_cash','Etisalat Cash — Credit'),
  ('orange_cash','Orange Cash — Credit'),
  ('instapay','InstaPay — Credit'),
  ('bank_sms','Generic Bank — Credit')
) AS v(provider,name)
WHERE NOT EXISTS (SELECT 1 FROM public.parser_templates p WHERE p.provider::text = v.provider AND p.name = v.name);

-- Seed parser rules (idempotent by template_id+field)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT id, provider FROM public.parser_templates LOOP
    IF NOT EXISTS (SELECT 1 FROM public.parser_rules WHERE template_id = t.id AND field='amount') THEN
      INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
        (t.id,'amount','(?:EGP|ج\.م|جنيه)\s*([0-9]+(?:[\.,][0-9]{1,2})?)|([0-9]+(?:[\.,][0-9]{1,2})?)\s*(?:EGP|ج\.م|جنيه)',10),
        (t.id,'reference','(?:ref(?:erence)?|مرجع|رقم العملية)[:\s#]*([A-Z0-9]{6,})',10),
        (t.id,'sender','(?:from|من)\s*(?:رقم)?\s*(\+?20?1[0-9]{9}|[A-Za-z0-9@._-]+)',5),
        (t.id,'balance_after','(?:balance|رصيدك|الرصيد)[:\s]*(?:EGP|ج\.م)?\s*([0-9]+(?:[\.,][0-9]{1,2})?)',5);
    END IF;
  END LOOP;
END $$;

-- Helper to enqueue deliveries
CREATE OR REPLACE FUNCTION public.enqueue_webhook_delivery(_merchant uuid, _event text, _payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE w record;
BEGIN
  FOR w IN SELECT id FROM public.webhooks WHERE merchant_id=_merchant AND is_active=true AND _event = ANY(events) LOOP
    INSERT INTO public.webhook_deliveries (webhook_id, event_type, payload, attempts, succeeded)
    VALUES (w.id, _event, _payload, 0, false);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_delivery(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
