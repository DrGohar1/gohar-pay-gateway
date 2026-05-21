
REVOKE EXECUTE ON FUNCTION public.bootstrap_demo_merchant(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_merchant_id() FROM PUBLIC, anon;
-- keep authenticated EXECUTE on current_user_merchant_id so client can call it
GRANT EXECUTE ON FUNCTION public.current_user_merchant_id() TO authenticated;
