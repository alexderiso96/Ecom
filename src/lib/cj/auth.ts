import { getAdminClient } from '@/lib/supabase/admin';
import { CjApiResponse, CjAuthData, CjCredentialsRecord } from '@/types/cj.types';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

// Throttle per rispettare il limite max 1 req/sec sull'autenticazione
let lastAuthRequestTimestamp = 0;
let authLockPromise: Promise<{ accessToken: string; openId: string }> | null = null;

async function waitAuthRateLimit() {
  const now = Date.now();
  const elapsed = now - lastAuthRequestTimestamp;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastAuthRequestTimestamp = Date.now();
}

/**
 * Recupera o inizializza il record delle credenziali CJ dal DB
 */
export async function getCjCredentials(): Promise<CjCredentialsRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cj_credentials')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[CJ Auth] Errore lettura cj_credentials:', error.message);
    throw new Error(`Impossibile recuperare credenziali CJ: ${error.message}`);
  }

  if (data) {
    return data as unknown as CjCredentialsRecord;
  }

  // Se la tabella è vuota, controlla se ci sono credenziali nelle variabili d'ambiente
  const envEmail = process.env.CJ_EMAIL;
  const envApiKey = process.env.CJ_API_KEY;
  const envPassword = process.env.CJ_PASSWORD;

  if (envEmail && (envApiKey || envPassword)) {
    const { data: inserted, error: insertError } = await supabase
      .from('cj_credentials')
      .insert({
        email: envEmail,
        api_key: envApiKey || null,
        password: envPassword || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[CJ Auth] Errore bootstrap cj_credentials da env:', insertError.message);
      return null;
    }

    return inserted as unknown as CjCredentialsRecord;
  }

  return null;
}

/**
 * Restituisce l'openId salvato per verificare i webhook HMAC in maniera ultra-rapida.
 */
export async function getStoredOpenId(): Promise<string | null> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('cj_credentials')
      .select('open_id')
      .eq('is_active', true)
      .not('open_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cred = data as { open_id?: string | null } | null;
    if (cred?.open_id) {
      return cred.open_id;
    }
  } catch (err) {
    console.error('[CJ Auth] Errore recupero openId per webhook:', err);
  }

  return process.env.CJ_OPEN_ID || null;
}

/**
 * Esegue il login tramite POST /authentication/getAccessToken
 */
async function requestAccessToken(email: string, apiKeyOrPassword?: string | null): Promise<CjAuthData> {
  await waitAuthRateLimit();

  const isPassword = !process.env.CJ_API_KEY && Boolean(process.env.CJ_PASSWORD);
  const payload: Record<string, string> = { email };

  if (apiKeyOrPassword) {
    if (isPassword) {
      payload.password = apiKeyOrPassword;
    } else {
      payload.apiKey = apiKeyOrPassword;
    }
  }

  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`CJ getAccessToken fallito con HTTP ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as CjApiResponse<CjAuthData>;

  if (json.code !== 200 || !json.data?.accessToken) {
    throw new Error(`CJ getAccessToken risposta invalida [${json.code}]: ${json.message || 'Dati mancanti'}`);
  }

  return json.data;
}

/**
 * Esegue il refresh del token tramite POST /authentication/refreshAccessToken
 */
async function requestRefreshToken(refreshToken: string): Promise<CjAuthData> {
  await waitAuthRateLimit();

  const response = await fetch(`${CJ_API_BASE}/authentication/refreshAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`CJ refreshAccessToken fallito con HTTP ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as CjApiResponse<CjAuthData>;

  if (json.code !== 200 || !json.data?.accessToken) {
    throw new Error(`CJ refreshAccessToken errore [${json.code}]: ${json.message || 'Dati mancanti'}`);
  }

  return json.data;
}

/**
 * Ottiene un access token valido garantendo il rispetto del rate limit e del TTL di 24 ore.
 * Include lock atomico in memoria per evitare richieste duplicate concorrenti.
 */
export async function getValidCjToken(forceRefresh = false): Promise<{ accessToken: string; openId: string }> {
  if (authLockPromise) {
    return authLockPromise;
  }

  authLockPromise = (async () => {
    try {
      const creds = await getCjCredentials();
      if (!creds) {
        throw new Error('Nessuna credenziale CJ configurata in cj_credentials o nelle variabili d\'ambiente.');
      }

      if (creds.is_circuit_broken) {
        throw new Error(`CJ API bloccata da circuit breaker (Codice 1600014: ${creds.circuit_break_reason}). Riattivare manualmente le API su CJdropshipping.`);
      }

      const now = new Date();
      const expiresAt = creds.access_token_expires_at ? new Date(creds.access_token_expires_at) : null;
      // Considera il token valido se mancano almeno 15 minuti alla scadenza e non è richiesto forceRefresh
      const isStillValid =
        !forceRefresh &&
        creds.access_token &&
        expiresAt &&
        expiresAt.getTime() - now.getTime() > 15 * 60 * 1000;

      if (isStillValid && creds.access_token && creds.open_id) {
        return {
          accessToken: creds.access_token,
          openId: creds.open_id,
        };
      }

      let authData: CjAuthData;

      // Se abbiamo un refresh token ancora valido e dobbiamo solo aggiornare, proviamo il refresh
      const refreshExpiresAt = creds.refresh_token_expires_at ? new Date(creds.refresh_token_expires_at) : null;
      const canRefresh = creds.refresh_token && refreshExpiresAt && refreshExpiresAt.getTime() > now.getTime();

      if (canRefresh && creds.refresh_token) {
        try {
          authData = await requestRefreshToken(creds.refresh_token);
        } catch (refreshErr) {
          console.warn('[CJ Auth] Refresh token fallito, fallback su getAccessToken completo:', refreshErr);
          authData = await requestAccessToken(creds.email, creds.api_key || creds.password);
        }
      } else {
        authData = await requestAccessToken(creds.email, creds.api_key || creds.password);
      }

      const supabase = getAdminClient();
      const openIdStr = String(authData.openId);

      // Aggiorna credenziali nel DB
      await supabase
        .from('cj_credentials')
        .update({
          access_token: authData.accessToken,
          refresh_token: authData.refreshToken,
          open_id: openIdStr,
          access_token_expires_at: authData.accessTokenExpiryDate
            ? new Date(authData.accessTokenExpiryDate).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          refresh_token_expires_at: authData.refreshTokenExpiryDate
            ? new Date(authData.refreshTokenExpiryDate).toISOString()
            : null,
          is_circuit_broken: false,
          circuit_break_reason: null,
        })
        .eq('id', creds.id);

      return {
        accessToken: authData.accessToken,
        openId: openIdStr,
      };
    } finally {
      authLockPromise = null;
    }
  })();

  return authLockPromise;
}

/**
 * Attiva il circuit breaker in caso di errore 1600014 (API access disabled)
 */
export async function triggerCircuitBreaker(reason: string) {
  try {
    const supabase = getAdminClient();
    await supabase
      .from('cj_credentials')
      .update({
        is_circuit_broken: true,
        circuit_break_reason: reason,
        circuit_broken_at: new Date().toISOString(),
      })
      .eq('is_active', true);

    console.error(`[CJ CIRCUIT BREAKER ATTIVATO]: ${reason}`);
  } catch (err) {
    console.error('[CJ Auth] Errore salvataggio circuit breaker:', err);
  }
}
