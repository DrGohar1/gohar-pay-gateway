-- Enrich parser rules with provider-specific patterns based on real SMS formats
-- from VodafoneCash, Etisalat Cash, Orange Cash, WE Pay, InstaPay, and Egyptian banks.

DO $$
DECLARE
  vf  uuid; et  uuid; orc uuid; we  uuid; ip  uuid; bk  uuid;
BEGIN
  SELECT id INTO vf  FROM public.parser_templates WHERE provider='vodafone_cash' ORDER BY version DESC LIMIT 1;
  SELECT id INTO et  FROM public.parser_templates WHERE provider='etisalat_cash' ORDER BY version DESC LIMIT 1;
  SELECT id INTO orc FROM public.parser_templates WHERE provider='orange_cash'   ORDER BY version DESC LIMIT 1;
  SELECT id INTO ip  FROM public.parser_templates WHERE provider='instapay'      ORDER BY version DESC LIMIT 1;
  SELECT id INTO bk  FROM public.parser_templates WHERE provider='bank_sms'      ORDER BY version DESC LIMIT 1;

  -- Ensure WE Pay template exists
  INSERT INTO public.parser_templates (provider, name, version, is_active)
  SELECT 'we_pay'::source_provider, 'WE Pay — Credit', 1, true
  WHERE NOT EXISTS (SELECT 1 FROM public.parser_templates WHERE provider='we_pay');
  SELECT id INTO we FROM public.parser_templates WHERE provider='we_pay' ORDER BY version DESC LIMIT 1;

  -- Wipe & reseed rules per provider (idempotent re-run safe)
  DELETE FROM public.parser_rules WHERE template_id IN (vf, et, orc, we, ip, bk);

  -- ============ Vodafone Cash ============
  -- Typical: "تم استلام مبلغ 1500.00 ج.م من 01001234567 رصيدك 12345.67"
  INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
    (vf,'amount',         'استلام\s*مبلغ\s*([0-9]+(?:\.[0-9]{1,2})?)', 20),
    (vf,'amount',         'received\s*EGP\s*([0-9]+(?:\.[0-9]{1,2})?)', 18),
    (vf,'amount',         '([0-9]+(?:\.[0-9]{1,2})?)\s*(?:EGP|ج\.م|جنيه)', 10),
    (vf,'sender',         'من\s*(?:رقم)?\s*(?:المحفظة)?\s*(01[0-9]{9})', 20),
    (vf,'sender',         'from\s*(\+?20?1[0-9]{9})', 15),
    (vf,'reference',      '(?:رقم\s*العملية|مرجع|ref(?:erence)?)[:\s#]*([A-Z0-9]{6,})', 20),
    (vf,'balance_after',  'رصيدك\s*(?:الحالي\s*)?(?:هو\s*)?([0-9]+(?:\.[0-9]{1,2})?)', 20),
    (vf,'balance_after',  'balance[:\s]*EGP?\s*([0-9]+(?:\.[0-9]{1,2})?)', 12);

  -- ============ Etisalat Cash ============
  INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
    (et,'amount',         'تم\s*إيداع\s*([0-9]+(?:\.[0-9]{1,2})?)', 20),
    (et,'amount',         'مبلغ\s*([0-9]+(?:\.[0-9]{1,2})?)\s*ج', 18),
    (et,'amount',         '([0-9]+(?:\.[0-9]{1,2})?)\s*(?:EGP|ج\.م|جنيه)', 10),
    (et,'sender',         'من\s*(?:رقم)?\s*(01[0-9]{9})', 20),
    (et,'reference',      '(?:رقم\s*المرجع|مرجع|ref)[:\s#]*([A-Z0-9]{6,})', 20),
    (et,'balance_after',  '(?:رصيدك|الرصيد)\s*(?:الحالي)?\s*[:=]?\s*([0-9]+(?:\.[0-9]{1,2})?)', 18);

  -- ============ Orange Cash ============
  INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
    (orc,'amount',        'تم\s*استلام\s*([0-9]+(?:\.[0-9]{1,2})?)\s*ج', 20),
    (orc,'amount',        'received\s*([0-9]+(?:\.[0-9]{1,2})?)\s*EGP', 18),
    (orc,'amount',        '([0-9]+(?:\.[0-9]{1,2})?)\s*(?:EGP|ج\.م)', 10),
    (orc,'sender',        '(?:من|from)\s*(?:wallet)?\s*(01[0-9]{9}|\+?201[0-9]{9})', 18),
    (orc,'reference',     '(?:trx|txn|transaction|عملية)[:\s#]*([A-Z0-9]{6,})', 18),
    (orc,'balance_after', '(?:balance|رصيد)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)', 15);

  -- ============ WE Pay ============
  INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
    (we,'amount',         '(?:تم\s*إيداع|received)\s*([0-9]+(?:\.[0-9]{1,2})?)', 20),
    (we,'amount',         '([0-9]+(?:\.[0-9]{1,2})?)\s*(?:EGP|ج\.م)', 10),
    (we,'sender',         '(?:من|from)\s*(01[0-9]{9})', 18),
    (we,'reference',      '(?:ref|مرجع)[:\s#]*([A-Z0-9]{6,})', 15),
    (we,'balance_after',  '(?:رصيد|balance)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)', 15);

  -- ============ InstaPay (IPN messages) ============
  -- Typical: "استلمت 2500 جنيه من Ahmed Ali عبر إنستاباي. مرجع: IPN20251101..."
  INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
    (ip,'amount',         'استلمت\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:جنيه|ج)', 22),
    (ip,'amount',         'received\s*EGP?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*via\s*InstaPay', 22),
    (ip,'amount',         '([0-9]+(?:\.[0-9]{1,2})?)\s*(?:EGP|جنيه|ج\.م)', 10),
    (ip,'sender',         'من\s+([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s\.\-]{2,60})\s+(?:عبر|via)', 20),
    (ip,'sender',         '([A-Za-z0-9_\.\-]+@(?:instapay|ipn|bank))', 18),
    (ip,'reference',      '(?:IPN|REF|مرجع)[:\s]*([A-Z0-9]{8,})', 22),
    (ip,'balance_after',  '(?:balance|رصيد)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)', 12);

  -- ============ Generic Bank SMS (CIB, NBE, Banque Misr, AAIB) ============
  INSERT INTO public.parser_rules(template_id, field, regex, priority) VALUES
    (bk,'amount',         '(?:credit(?:ed)?|إيداع|أُضيف)\s*(?:by|of|بمبلغ)?\s*EGP?\s*([0-9,]+(?:\.[0-9]{1,2})?)', 20),
    (bk,'amount',         'مبلغ\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*ج', 18),
    (bk,'amount',         '([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:EGP|ج\.م|جنيه)', 10),
    (bk,'sender',         '(?:from|من)\s*([A-Z0-9*]{4,})', 12),
    (bk,'reference',      '(?:ref(?:erence)?|trx|txn|مرجع)[:\s#]*([A-Z0-9]{6,})', 20),
    (bk,'balance_after',  '(?:avail(?:able)?\s*bal(?:ance)?|الرصيد\s*المتاح|رصيد)[:\s]*EGP?\s*([0-9,]+(?:\.[0-9]{1,2})?)', 20);

END $$;