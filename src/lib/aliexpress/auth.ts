import { createClient } from '@/lib/supabase/server';

/**
 * Verifica se la richiesta è autorizzata:
 * 1. Tramite Bearer Token corrispondente a process.env.CRON_SECRET (usato da GitHub Actions / cURL / webhooks)
 * 2. Oppure tramite sessione autenticata utente con ruolo 'admin' o 'superadmin'.
 */
export async function isAuthorizedCronOrAdmin(req: Request): Promise<{ authorized: boolean; reason?: string }> {
  // 1. Verifica Bearer Token da Header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token === cronSecret.trim()) {
      return { authorized: true };
    }
  }

  // 2. Se non c'è Bearer o non corrisponde, controlla se l'utente ha una sessione attiva come Admin/SuperAdmin
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
        return { authorized: true };
      }
    }
  } catch (err) {
    // Session check fallito
  }

  return {
    authorized: false,
    reason: 'Non autorizzato: token Bearer mancante/errato o utente privo di permessi Admin.',
  };
}

