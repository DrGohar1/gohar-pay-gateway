
-- payment_links table
CREATE TABLE IF NOT EXISTS public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  matched_transaction_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_links_merchant ON public.payment_links(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON public.payment_links(code);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_pl_member_rw ON public.payment_links FOR ALL TO authenticated
  USING (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()))
  WITH CHECK (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));

CREATE POLICY p_pl_public_read ON public.payment_links FOR SELECT TO anon
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));

CREATE TRIGGER trg_pl_updated BEFORE UPDATE ON public.payment_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- subscriptions trial fields
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;

-- Update bootstrap to give 5-day trial and seed a payment link
CREATE OR REPLACE FUNCTION public.bootstrap_demo_merchant(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _merchant_id uuid; _device_id uuid; _src1 uuid; _src2 uuid; _src3 uuid;
  _plan_id uuid; _order_id uuid; i int;
  _providers text[] := ARRAY['vodafone_cash','etisalat_cash','orange_cash','instapay','bank_sms'];
  _statuses text[] := ARRAY['confirmed','confirmed','confirmed','pending','manual_review','duplicate','rejected'];
  _risks text[] := ARRAY['low','low','low','medium','high'];
BEGIN
  IF EXISTS (SELECT 1 FROM public.merchant_members WHERE user_id = _user_id) THEN
    RETURN (SELECT merchant_id FROM public.merchant_members WHERE user_id = _user_id LIMIT 1);
  END IF;
  SELECT id INTO _plan_id FROM public.plans WHERE code='growth' LIMIT 1;
  IF _plan_id IS NULL THEN SELECT id INTO _plan_id FROM public.plans ORDER BY monthly_price_egp ASC LIMIT 1; END IF;

  INSERT INTO public.merchants (slug, legal_name, display_name, status, plan_id, contact_email)
  VALUES ('m-'||substr(_user_id::text,1,8), 'متجري', 'متجري', 'active', _plan_id,
          (SELECT email FROM public.profiles WHERE id=_user_id))
  RETURNING id INTO _merchant_id;

  INSERT INTO public.merchant_members (merchant_id, user_id, role) VALUES (_merchant_id, _user_id, 'merchant_owner');
  INSERT INTO public.user_roles (user_id, role, merchant_id) VALUES (_user_id, 'merchant_owner', _merchant_id) ON CONFLICT DO NOTHING;

  -- 5-day trial
  INSERT INTO public.subscriptions (merchant_id, plan_id, status, current_period_end, trial_ends_at, is_trial)
  VALUES (_merchant_id, _plan_id, 'trialing', now() + interval '5 days', now() + interval '5 days', true);

  INSERT INTO public.devices (merchant_id, label, is_online, last_seen_at, app_version, android_id)
  VALUES (_merchant_id, 'جهاز التحصيل الرئيسي', false, NULL, NULL, 'pending-'||substr(_user_id::text,1,8))
  RETURNING id INTO _device_id;

  INSERT INTO public.payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, status)
  VALUES (_merchant_id, _device_id, 'vodafone_cash'::public.source_provider, 'فودافون كاش', '01000000000', 0, 'active') RETURNING id INTO _src1;
  INSERT INTO public.payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, status)
  VALUES (_merchant_id, _device_id, 'instapay'::public.source_provider, 'إنستا باي', 'me@instapay', 0, 'active') RETURNING id INTO _src2;

  -- A welcome payment link
  INSERT INTO public.payment_links (merchant_id, code, title, description, amount, currency, status, created_by)
  VALUES (_merchant_id, 'demo-'||substr(md5(random()::text),1,10), 'رابط دفع تجريبي', 'جرّب نظام روابط الدفع', 250, 'EGP', 'active', _user_id);

  INSERT INTO public.alerts (merchant_id, severity, code, message) VALUES
    (_merchant_id, 'info', 'WELCOME', 'مرحبًا بك في Gohar Pay! لديك فترة تجريبية لمدة 5 أيام'),
    (_merchant_id, 'info', 'NEXT_STEP', 'أنشئ أول رابط دفع لك من صفحة روابط الدفع');

  INSERT INTO public.api_keys (merchant_id, label, key_prefix, key_hash, scopes)
  VALUES (_merchant_id, 'مفتاح الإنتاج', 'gp_live_', md5(random()::text), ARRAY['read:transactions','write:orders','manage:webhooks']);

  RETURN _merchant_id;
END; $function$;
