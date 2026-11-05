import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClientInstance: SupabaseClient<any> | null = null;

/**
 * Restituisce un client Supabase con permessi Service Role (admin)
 * per bypassare RLS nelle operazioni di background, webhook e token management.
 */
export function getAdminClient(): SupabaseClient<any> {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL non configurato nelle variabili d\'ambiente.');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurato nelle variabili d\'ambiente.');
  }

  adminClientInstance = createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}
