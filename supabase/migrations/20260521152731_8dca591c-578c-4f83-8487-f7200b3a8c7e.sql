DELETE FROM merchants WHERE slug LIKE 'demo-%' AND id NOT IN (SELECT merchant_id FROM subscriptions);

CREATE OR REPLACE FUNCTION public.bootstrap_demo_merchant(_user_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $function$
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
  VALUES ('demo-'||substr(_user_id::text,1,8), 'متجر التجربة', 'متجر التجربة', 'active', _plan_id,
          (SELECT email FROM public.profiles WHERE id=_user_id))
  RETURNING id INTO _merchant_id;

  INSERT INTO public.merchant_members (merchant_id, user_id, role) VALUES (_merchant_id, _user_id, 'merchant_owner');
  INSERT INTO public.user_roles (user_id, role, merchant_id) VALUES (_user_id, 'merchant_owner', _merchant_id) ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (merchant_id, plan_id, status, current_period_end) VALUES (_merchant_id, _plan_id, 'active', now() + interval '30 days');

  INSERT INTO public.devices (merchant_id, label, is_online, last_seen_at, app_version, android_id)
  VALUES (_merchant_id, 'جهاز التحصيل الرئيسي', true, now() - interval '2 minutes', '1.0.0', 'demo-android-'||substr(_user_id::text,1,8))
  RETURNING id INTO _device_id;

  INSERT INTO public.payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, previous_balance, status, last_message_at, daily_usage, monthly_usage)
  VALUES (_merchant_id, _device_id, 'vodafone_cash'::public.source_provider, 'خط فودافون الرئيسي', '01001234567', 18540.50, 17200.00, 'active', now() - interval '3 minutes', 4200, 38000) RETURNING id INTO _src1;
  INSERT INTO public.payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, previous_balance, status, last_message_at, daily_usage, monthly_usage)
  VALUES (_merchant_id, _device_id, 'instapay'::public.source_provider, 'InstaPay - Main', 'gohar@instapay', 42100.00, 39800.00, 'active', now() - interval '11 minutes', 9100, 92000) RETURNING id INTO _src2;
  INSERT INTO public.payment_sources (merchant_id, device_id, provider, label, identifier, estimated_balance, previous_balance, status, last_message_at, daily_usage, monthly_usage)
  VALUES (_merchant_id, _device_id, 'etisalat_cash'::public.source_provider, 'خط اتصالات الفرع', '01102345678', 7320.75, 8100.00, 'limit_risk', now() - interval '56 minutes', 1800, 14000) RETURNING id INTO _src3;

  FOR i IN 0..7 LOOP
    INSERT INTO public.source_balances (source_id, balance, detected_at, reason) VALUES (_src1, 18540.50 - (i*180), now() - (i || ' hours')::interval, 'auto');
    INSERT INTO public.source_balances (source_id, balance, detected_at, reason) VALUES (_src2, 42100 - (i*420), now() - (i || ' hours')::interval, 'auto');
  END LOOP;

  FOR i IN 0..13 LOOP
    INSERT INTO public.orders (merchant_id, external_ref, amount, currency, customer_label, status, created_at)
    VALUES (_merchant_id, 'WC-'||(20001+i), round((random()*2400+100)::numeric, 2), 'EGP', 'عميل #'||(i+1),
      (ARRAY['awaiting_payment','confirmed','partially_matched','expired','manual_review']::public.order_status[])[1 + (i % 5)], now() - (i*23 || ' minutes')::interval) RETURNING id INTO _order_id;
  END LOOP;

  FOR i IN 0..49 LOOP
    INSERT INTO public.parsed_transactions (merchant_id, source_id, provider, amount, currency, reference, sender_identifier, message_timestamp, confidence, status, risk, created_at, balance_after)
    VALUES (_merchant_id, (ARRAY[_src1,_src2,_src3])[1 + (i % 3)], (_providers[1 + (i % 5)])::public.source_provider,
      round((random()*4800+50)::numeric, 2), 'EGP', 'REF'||(100000 + floor(random()*900000)::int),
      '0100'||lpad(floor(random()*9999999)::text, 7, '0'), now() - (i*17 || ' minutes')::interval,
      round((0.55 + random()*0.45)::numeric, 2), (_statuses[1 + (i % 7)])::public.txn_status,
      (_risks[1 + (i % 5)])::public.risk_level, now() - (i*17 || ' minutes')::interval, round((random()*40000+5000)::numeric, 2));
  END LOOP;

  INSERT INTO public.alerts (merchant_id, severity, code, message, created_at) VALUES
    (_merchant_id, 'warning', 'LOW_BALANCE', 'رصيد خط اتصالات الفرع منخفض', now() - interval '8 minutes'),
    (_merchant_id, 'error', 'DUPLICATE_REF', 'تم رصد مرجع مكرر REF482931', now() - interval '24 minutes'),
    (_merchant_id, 'info', 'DEVICE_ONLINE', 'جهاز التحصيل متصل الآن', now() - interval '42 minutes'),
    (_merchant_id, 'critical', 'BALANCE_ANOMALY', 'تغير غير متوقع في رصيد فودافون كاش', now() - interval '91 minutes');

  INSERT INTO public.webhooks (merchant_id, url, secret, events, is_active)
  VALUES (_merchant_id, 'https://example.com/webhooks/gohar', 'whsec_demo_'||substr(md5(random()::text),1,24), ARRAY['payment.confirmed','payment.pending','order.updated'], true);

  INSERT INTO public.api_keys (merchant_id, label, key_prefix, key_hash, scopes)
  VALUES (_merchant_id, 'مفتاح الإنتاج', 'gp_live_', md5(random()::text), ARRAY['read:transactions','write:orders','manage:webhooks']);

  RETURN _merchant_id;
END; $function$;

DO $$ DECLARE u record; BEGIN
  FOR u IN SELECT id FROM auth.users WHERE email LIKE '%@goharpay.test' AND email NOT IN ('superadmin@goharpay.test','admin@goharpay.test') LOOP
    PERFORM public.bootstrap_demo_merchant(u.id);
  END LOOP;
END $$;