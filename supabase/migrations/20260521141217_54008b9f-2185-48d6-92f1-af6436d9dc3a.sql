
-- =============== Helpers ===============
CREATE OR REPLACE FUNCTION public.current_user_merchant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT merchant_id FROM public.merchant_members
   WHERE user_id = auth.uid()
   ORDER BY joined_at ASC LIMIT 1
$$;

-- =============== Extra write policies (members can write activity) ===============
DROP POLICY IF EXISTS p_alerts_insert ON public.alerts;
CREATE POLICY p_alerts_insert ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));

DROP POLICY IF EXISTS p_risk_insert ON public.risk_reviews;
CREATE POLICY p_risk_insert ON public.risk_reviews FOR INSERT TO authenticated
  WITH CHECK (is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));

DROP POLICY IF EXISTS p_events_insert ON public.transaction_events;
CREATE POLICY p_events_insert ON public.transaction_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.parsed_transactions t
    WHERE t.id = transaction_id AND (is_merchant_member(auth.uid(), t.merchant_id) OR is_internal_admin(auth.uid()))));

DROP POLICY IF EXISTS p_wd_insert ON public.webhook_deliveries;
CREATE POLICY p_wd_insert ON public.webhook_deliveries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.webhooks w
    WHERE w.id = webhook_id AND (is_merchant_member(auth.uid(), w.merchant_id) OR is_internal_admin(auth.uid()))));

DROP POLICY IF EXISTS p_matches_insert ON public.order_matches;
CREATE POLICY p_matches_insert ON public.order_matches FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND (is_merchant_member(auth.uid(), o.merchant_id) OR is_internal_admin(auth.uid()))));

DROP POLICY IF EXISTS p_audit_insert ON public.audit_logs;
CREATE POLICY p_audit_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (merchant_id IS NULL OR is_merchant_member(auth.uid(), merchant_id) OR is_internal_admin(auth.uid()));

DROP POLICY IF EXISTS p_balances_insert ON public.source_balances;
CREATE POLICY p_balances_insert ON public.source_balances FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.payment_sources s
    WHERE s.id = source_id AND (is_merchant_member(auth.uid(), s.merchant_id) OR is_internal_admin(auth.uid()))));

-- =============== Seed default plans ===============
INSERT INTO public.plans (code, name_ar, name_en, monthly_price_egp, max_sources, max_devices, features)
SELECT * FROM (VALUES
  ('starter','المبتدئ','Starter',499::numeric,2,1,'{"webhooks":true,"api":true,"ai":false}'::jsonb),
  ('pro','المحترف','Pro',1499::numeric,5,3,'{"webhooks":true,"api":true,"ai":true}'::jsonb),
  ('scale','التوسع','Scale',3999::numeric,20,10,'{"webhooks":true,"api":true,"ai":true,"whitelabel":true}'::jsonb)
) AS v(code,name_ar,name_en,monthly_price_egp,max_sources,max_devices,features)
WHERE NOT EXISTS (SELECT 1 FROM public.plans);

-- =============== Bootstrap demo merchant function ===============
CREATE OR REPLACE FUNCTION public.bootstrap_demo_merchant(_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _merchant_id uuid;
  _device_id uuid;
  _src1 uuid; _src2 uuid; _src3 uuid;
  _plan_id uuid;
  _order_id uuid;
  _txn_id uuid;
  i int;
  _providers text[] := ARRAY['vodafone_cash','etisalat_cash','orange_cash','instapay','bank_sms'];
  _statuses text[] := ARRAY['confirmed','confirmed','confirmed','pending','manual_review','duplicate','rejected'];
  _risks text[] := ARRAY['low','low','low','medium','high'];
BEGIN
  -- Skip if user already has a merchant
  IF EXISTS (SELECT 1 FROM merchant_members WHERE user_id = _user_id) THEN
    RETURN (SELECT merchant_id FROM merchant_members WHERE user_id = _user_id LIMIT 1);
  END IF;

  SELECT id INTO _plan_id FROM plans WHERE code='pro' LIMIT 1;

  INSERT INTO merchants (slug, legal_name, display_name, status, plan_id, contact_email)
  VALUES ('demo-'||substr(_user_id::text,1,8), 'متجر التجربة', 'متجر التجربة', 'active', _plan_id,
          (SELECT email FROM profiles WHERE id=_user_id))
  RETURNING id INTO _merchant_id;

  INSERT INTO merchant_members (merchant_id, user_id, role) VALUES (_merchant_id, _user_id, 'merchant_owner');
  INSERT INTO user_roles (user_id, role, merchant_id) VALUES (_user_id, 'merchant_owner', _merchant_id)
    ON CONFLICT DO NOTHING;

  INSERT INTO subscriptions (merchant_id, plan_id, status, current_period_end)
  VALUES (_merchant_id, _plan_id, 'active', now() + interval '30 days');

  -- Device
  INSERT INTO devices (merchant_id, label, is_online, last_seen_at, app_version, android_id)
  VALUES (_merchant_id, 'جهاز التحصيل الرئيسي', true, now() - interval '2 minutes', '1.0.0', 'demo-android-001')
  RETURNING id INTO _device_id;

  -- Payment sources
  INSERT INTO payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, previous_balance, status, last_message_at, daily_usage, monthly_usage)
  VALUES (_merchant_id, _device_id, 'vodafone_cash', 'خط فودافون الرئيسي', '01001234567', 18540.50, 17200.00, 'active', now() - interval '3 minutes', 4200, 38000)
  RETURNING id INTO _src1;
  INSERT INTO payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, previous_balance, status, last_message_at, daily_usage, monthly_usage)
  VALUES (_merchant_id, _device_id, 'instapay', 'InstaPay - Main', 'gohar@instapay', 42100.00, 39800.00, 'active', now() - interval '11 minutes', 9100, 92000)
  RETURNING id INTO _src2;
  INSERT INTO payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, previous_balance, status, last_message_at, daily_usage, monthly_usage)
  VALUES (_merchant_id, _device_id, 'etisalat_cash', 'خط اتصالات الفرع', '01102345678', 7320.75, 8100.00, 'limit_risk', now() - interval '56 minutes', 1800, 14000)
  RETURNING id INTO _src3;

  -- Balance snapshots
  FOR i IN 0..7 LOOP
    INSERT INTO source_balances (source_id, balance, detected_at, reason)
    VALUES (_src1, 18540.50 - (i*180), now() - (i || ' hours')::interval, 'auto');
    INSERT INTO source_balances (source_id, balance, detected_at, reason)
    VALUES (_src2, 42100 - (i*420), now() - (i || ' hours')::interval, 'auto');
  END LOOP;

  -- Orders
  FOR i IN 0..13 LOOP
    INSERT INTO orders (merchant_id, external_ref, amount, currency, customer_label, status, created_at)
    VALUES (_merchant_id, 'WC-'||(20001+i),
            round((random()*2400+100)::numeric, 2), 'EGP', 'عميل #'||(i+1),
            (ARRAY['awaiting_payment','confirmed','partially_matched','expired','manual_review']::order_status[])[1 + (i % 5)],
            now() - (i*23 || ' minutes')::interval)
    RETURNING id INTO _order_id;
  END LOOP;

  -- Transactions
  FOR i IN 0..49 LOOP
    INSERT INTO parsed_transactions (
      merchant_id, source_id, provider, amount, currency, reference, sender_identifier,
      message_timestamp, confidence, status, risk, created_at, balance_after
    ) VALUES (
      _merchant_id,
      (ARRAY[_src1,_src2,_src3])[1 + (i % 3)],
      (_providers[1 + (i % 5)])::payment_provider,
      round((random()*4800+50)::numeric, 2), 'EGP',
      'REF'||(100000 + floor(random()*900000)::int),
      '0100'||lpad(floor(random()*9999999)::text, 7, '0'),
      now() - (i*17 || ' minutes')::interval,
      round((0.55 + random()*0.45)::numeric, 2),
      (_statuses[1 + (i % 7)])::txn_status,
      (_risks[1 + (i % 5)])::risk_level,
      now() - (i*17 || ' minutes')::interval,
      round((random()*40000+5000)::numeric, 2)
    );
  END LOOP;

  -- Alerts
  INSERT INTO alerts (merchant_id, severity, code, message, created_at) VALUES
    (_merchant_id, 'warning', 'LOW_BALANCE', 'رصيد خط اتصالات الفرع منخفض', now() - interval '8 minutes'),
    (_merchant_id, 'error', 'DUPLICATE_REF', 'تم رصد مرجع مكرر REF482931', now() - interval '24 minutes'),
    (_merchant_id, 'info', 'DEVICE_ONLINE', 'جهاز التحصيل متصل الآن', now() - interval '42 minutes'),
    (_merchant_id, 'critical', 'BALANCE_ANOMALY', 'تغير غير متوقع في رصيد فودافون كاش', now() - interval '91 minutes');

  -- Webhook
  INSERT INTO webhooks (merchant_id, url, secret, events, is_active)
  VALUES (_merchant_id, 'https://example.com/webhooks/gohar', 'whsec_demo_'||substr(md5(random()::text),1,24),
          ARRAY['payment.confirmed','payment.pending','order.updated'], true);

  -- API key
  INSERT INTO api_keys (merchant_id, label, key_prefix, key_hash, scopes)
  VALUES (_merchant_id, 'مفتاح الإنتاج', 'gp_live_', md5(random()::text),
          ARRAY['read:transactions','write:orders','manage:webhooks']);

  RETURN _merchant_id;
END;
$$;

-- =============== Hook into signup ===============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  PERFORM public.bootstrap_demo_merchant(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== Realtime ===============
ALTER TABLE public.parsed_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$ BEGIN
  PERFORM 1; ALTER PUBLICATION supabase_realtime ADD TABLE public.parsed_transactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
