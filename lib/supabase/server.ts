import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only server client using the public anon key (Row Level Security applies).
 * Returns null when credentials are missing so the app can fall back to demo data.
 * The service-role key is intentionally never used by the UI.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
