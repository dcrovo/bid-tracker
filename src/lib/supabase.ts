import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey } from "@/lib/supabase-keys";

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublishableKey();

  if (!url || !key) return null;
  return createClient(url, key);
}
