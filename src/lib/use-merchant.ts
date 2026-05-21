import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MerchantContext = {
  merchantId: string | null;
  loading: boolean;
  error: string | null;
};

let cachedMerchantId: string | null = null;

export function useMerchant(): MerchantContext {
  const [merchantId, setMerchantId] = useState<string | null>(cachedMerchantId);
  const [loading, setLoading] = useState(!cachedMerchantId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedMerchantId) return;
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("merchant_members")
        .select("merchant_id")
        .eq("user_id", u.user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      if (data?.merchant_id) {
        cachedMerchantId = data.merchant_id;
        setMerchantId(data.merchant_id);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { merchantId, loading, error };
}

export function clearMerchantCache() {
  cachedMerchantId = null;
}
