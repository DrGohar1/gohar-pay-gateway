
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('super_admin','internal_admin','merchant_owner','merchant_admin','operator','finance_viewer','support_agent');
CREATE TYPE public.merchant_status AS ENUM ('pending','active','suspended','closed');
CREATE TYPE public.source_provider AS ENUM ('vodafone_cash','etisalat_cash','orange_cash','we_pay','instapay','bank_sms','other');
CREATE TYPE public.source_status AS ENUM ('active','paused','offline','limit_risk');
CREATE TYPE public.txn_status AS ENUM ('pending','confirmed','rejected','duplicate','manual_review','expired');
CREATE TYPE public.order_status AS ENUM ('awaiting_payment','partially_matched','confirmed','manual_review','expired','cancelled');
CREATE TYPE public.risk_level AS ENUM ('low','medium','high','critical');
CREATE TYPE public.alert_severity AS ENUM ('info','warning','error','critical');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, full_name TEXT, phone TEXT, avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  merchant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, merchant_id)
);

CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL, name_en TEXT NOT NULL,
  monthly_price_egp NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_sources INT NOT NULL DEFAULT 1, max_devices INT NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  legal_name TEXT NOT NULL, display_name TEXT NOT NULL,
  contact_email TEXT, contact_phone TEXT,
  status public.merchant_status NOT NULL DEFAULT 'pending',
  plan_id UUID REFERENCES public.plans(id),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.merchant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'operator',
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, user_id)
);
CREATE INDEX ON public.merchant_members(user_id);
CREATE INDEX ON public.merchant_members(merchant_id);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  label TEXT NOT NULL, device_token_hash TEXT, android_id TEXT, app_version TEXT,
  last_seen_at TIMESTAMPTZ, is_online BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.devices(merchant_id);

CREATE TABLE public.payment_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  provider public.source_provider NOT NULL,
  label TEXT NOT NULL, identifier TEXT NOT NULL,
  estimated_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  previous_balance NUMERIC(14,2),
  status public.source_status NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  daily_usage NUMERIC(14,2) NOT NULL DEFAULT 0,
  monthly_usage NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payment_sources(merchant_id);

CREATE TABLE public.source_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.payment_sources(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

CREATE TABLE public.parser_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.source_provider NOT NULL,
  name TEXT NOT NULL, version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.parser_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.parser_templates(id) ON DELETE CASCADE,
  field TEXT NOT NULL, regex TEXT NOT NULL, priority INT NOT NULL DEFAULT 0
);

CREATE TABLE public.raw_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  source_id UUID REFERENCES public.payment_sources(id) ON DELETE SET NULL,
  provider public.source_provider, sender TEXT, body TEXT NOT NULL,
  message_hash TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  UNIQUE(merchant_id, message_hash)
);
CREATE INDEX ON public.raw_messages(merchant_id, ingested_at DESC);

CREATE TABLE public.parsed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  raw_message_id UUID REFERENCES public.raw_messages(id) ON DELETE SET NULL,
  source_id UUID REFERENCES public.payment_sources(id) ON DELETE SET NULL,
  provider public.source_provider,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  reference TEXT, sender_identifier TEXT, receiver_identifier TEXT,
  message_timestamp TIMESTAMPTZ,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  status public.txn_status NOT NULL DEFAULT 'pending',
  risk public.risk_level NOT NULL DEFAULT 'low',
  matched_order_id UUID,
  balance_before NUMERIC(14,2), balance_after NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.parsed_transactions(merchant_id, created_at DESC);
CREATE INDEX ON public.parsed_transactions(merchant_id, status);

CREATE TABLE public.transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.parsed_transactions(id) ON DELETE CASCADE,
  actor_id UUID, event_type TEXT NOT NULL, payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message_id UUID NOT NULL REFERENCES public.raw_messages(id) ON DELETE CASCADE,
  model TEXT NOT NULL, classification TEXT,
  fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(5,2), explanation TEXT, anomalies JSONB,
  recommended_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  external_ref TEXT, amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  customer_label TEXT,
  status public.order_status NOT NULL DEFAULT 'awaiting_payment',
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.orders(merchant_id, status);

CREATE TABLE public.order_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.parsed_transactions(id) ON DELETE CASCADE,
  amount_matched NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  url TEXT NOT NULL, secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, payload JSONB NOT NULL,
  status_code INT, attempts INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ, succeeded BOOLEAN NOT NULL DEFAULT FALSE,
  response_body TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  label TEXT NOT NULL, key_prefix TEXT NOT NULL, key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  code TEXT NOT NULL, message TEXT NOT NULL,
  metadata JSONB, resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.risk_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.parsed_transactions(id) ON DELETE SET NULL,
  level public.risk_level NOT NULL, reason TEXT NOT NULL,
  resolved_by UUID, resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  actor_id UUID, action TEXT NOT NULL,
  entity TEXT, entity_id UUID, diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== SECURITY DEFINER HELPERS (after tables exist) =====
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_internal_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'internal_admin') OR public.has_role(_user_id,'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_merchant_member(_user_id UUID, _merchant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.merchant_members WHERE user_id = _user_id AND merchant_id = _merchant_id)
$$;

-- ===== ENABLE RLS =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parser_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parser_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES =====
CREATE POLICY p_profiles_read ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_profiles_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY p_profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY p_roles_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_roles_admin ON public.user_roles FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));

CREATE POLICY p_plans_read ON public.plans FOR SELECT USING (true);
CREATE POLICY p_plans_admin ON public.plans FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));

CREATE POLICY p_merchants_read ON public.merchants FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_merchants_admin ON public.merchants FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));

CREATE POLICY p_mm_read ON public.merchant_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_mm_write ON public.merchant_members FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));

CREATE POLICY p_subs_read ON public.subscriptions FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_subs_admin ON public.subscriptions FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));

CREATE POLICY p_devices_read ON public.devices FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_devices_write ON public.devices FOR ALL TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid())) WITH CHECK (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_sources_read ON public.payment_sources FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_sources_write ON public.payment_sources FOR ALL TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid())) WITH CHECK (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_balances_read ON public.source_balances FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payment_sources s WHERE s.id = source_id AND (public.is_merchant_member(auth.uid(), s.merchant_id) OR public.is_internal_admin(auth.uid()))));

CREATE POLICY p_tpl_read ON public.parser_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY p_tpl_admin ON public.parser_templates FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));
CREATE POLICY p_rules_read ON public.parser_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY p_rules_admin ON public.parser_rules FOR ALL TO authenticated USING (public.is_internal_admin(auth.uid())) WITH CHECK (public.is_internal_admin(auth.uid()));

CREATE POLICY p_raw_read ON public.raw_messages FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_txn_read ON public.parsed_transactions FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_txn_update ON public.parsed_transactions FOR UPDATE TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_events_read ON public.transaction_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.parsed_transactions t WHERE t.id = transaction_id AND (public.is_merchant_member(auth.uid(), t.merchant_id) OR public.is_internal_admin(auth.uid()))));

CREATE POLICY p_ai_read ON public.ai_extractions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.raw_messages r WHERE r.id = raw_message_id AND (public.is_merchant_member(auth.uid(), r.merchant_id) OR public.is_internal_admin(auth.uid()))));

CREATE POLICY p_orders_read ON public.orders FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_orders_write ON public.orders FOR ALL TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid())) WITH CHECK (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_matches_read ON public.order_matches FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (public.is_merchant_member(auth.uid(), o.merchant_id) OR public.is_internal_admin(auth.uid()))));

CREATE POLICY p_webhooks_rw ON public.webhooks FOR ALL TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid())) WITH CHECK (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_wd_read ON public.webhook_deliveries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND (public.is_merchant_member(auth.uid(), w.merchant_id) OR public.is_internal_admin(auth.uid()))));

CREATE POLICY p_keys_rw ON public.api_keys FOR ALL TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid())) WITH CHECK (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_alerts_read ON public.alerts FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_alerts_update ON public.alerts FOR UPDATE TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_risk_read ON public.risk_reviews FOR SELECT TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));
CREATE POLICY p_risk_update ON public.risk_reviews FOR UPDATE TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_audit_read ON public.audit_logs FOR SELECT TO authenticated USING ((merchant_id IS NOT NULL AND public.is_merchant_member(auth.uid(), merchant_id)) OR public.is_internal_admin(auth.uid()));

CREATE POLICY p_transfers_rw ON public.transfers FOR ALL TO authenticated USING (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid())) WITH CHECK (public.is_merchant_member(auth.uid(), merchant_id) OR public.is_internal_admin(auth.uid()));

-- ===== TRIGGERS =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_merchants_updated BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_txn_updated BEFORE UPDATE ON public.parsed_transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.parsed_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;

-- ===== SEED PLANS =====
INSERT INTO public.plans (code, name_ar, name_en, monthly_price_egp, max_sources, max_devices, features) VALUES
('starter','المبتدئ','Starter',299,1,1,'{"webhooks":true,"api":true}'::jsonb),
('growth','النمو','Growth',799,3,3,'{"webhooks":true,"api":true,"woo":true,"ai":true}'::jsonb),
('enterprise','المؤسسة','Enterprise',2499,20,20,'{"webhooks":true,"api":true,"woo":true,"ai":true,"sso":true,"sla":true}'::jsonb);
