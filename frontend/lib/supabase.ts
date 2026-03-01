import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Lazy-init Supabase client — avoids build-time errors when env vars aren't set */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_KEY");
    _client = createClient(url, key);
  }
  return _client;
}
