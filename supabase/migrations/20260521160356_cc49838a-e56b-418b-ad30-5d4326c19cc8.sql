
DROP POLICY IF EXISTS p_audit_insert ON public.audit_logs;
CREATE POLICY p_audit_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (merchant_id IS NOT NULL AND is_merchant_member(auth.uid(), merchant_id))
    OR is_internal_admin(auth.uid())
  );

DROP POLICY IF EXISTS p_tpl_read ON public.parser_templates;
CREATE POLICY p_tpl_read ON public.parser_templates
  FOR SELECT TO authenticated
  USING (is_internal_admin(auth.uid()));

DROP POLICY IF EXISTS p_rules_read ON public.parser_rules;
CREATE POLICY p_rules_read ON public.parser_rules
  FOR SELECT TO authenticated
  USING (is_internal_admin(auth.uid()));

DROP POLICY IF EXISTS p_webhooks_rw ON public.webhooks;
CREATE POLICY p_webhooks_rw ON public.webhooks
  FOR ALL TO authenticated
  USING (
    is_internal_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.merchant_members mm
      WHERE mm.merchant_id = webhooks.merchant_id
        AND mm.user_id = auth.uid()
        AND mm.role IN ('merchant_owner'::app_role, 'merchant_admin'::app_role)
    )
  )
  WITH CHECK (
    is_internal_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.merchant_members mm
      WHERE mm.merchant_id = webhooks.merchant_id
        AND mm.user_id = auth.uid()
        AND mm.role IN ('merchant_owner'::app_role, 'merchant_admin'::app_role)
    )
  );

REVOKE EXECUTE ON FUNCTION public.bootstrap_demo_merchant(uuid) FROM PUBLIC, authenticated, anon;
