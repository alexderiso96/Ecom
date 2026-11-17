/**
 * Modulo di sicurezza Anti-Abuse, Rate-Limiting e Anti-Bot
 * Protegge gli endpoint di creazione ordini e previene spam su WhatsApp e database.
 */

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

// Mappe in-memory per memorizzare i tentativi
const ipStore = new Map<string, RateLimitRecord>();
const emailStore = new Map<string, RateLimitRecord>();

// Configurazione parametri di sicurezza
const MAX_ORDERS_PER_IP = 4; // Max 4 ordini per IP
const MAX_ORDERS_PER_EMAIL = 3; // Max 3 ordini per stessa email
const WINDOW_MS = 10 * 60 * 1000; // Finestra di 10 minuti
const BLOCK_DURATION_MS = 15 * 60 * 1000; // Blocco temporaneo di 15 minuti in caso di abuso
const MIN_HUMAN_INTERACTION_MS = 1200; // Tempo minimo umano per completare l'invio (1.2 secondi)

/**
 * Pulisce i record scaduti per evitare memory leak
 */
function cleanupExpiredRecords(store: Map<string, RateLimitRecord>, now: number) {
  if (store.size > 2000) {
    store.forEach((record, key) => {
      if (record.blockedUntil && record.blockedUntil < now) {
        store.delete(key);
      } else {
        record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);
        if (record.timestamps.length === 0 && !record.blockedUntil) {
          store.delete(key);
        }
      }
    });
  }
}

/**
 * Estrae l'indirizzo IP reale del client dai vari proxy e header di deployment (Vercel, Cloudflare, ecc.)
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

/**
 * Verifica se una richiesta di ordine rispetta i limiti di frequenza (per IP ed Email)
 */
export function checkOrderRateLimit(ip: string, email?: string | null): RateLimitResult {
  const now = Date.now();
  cleanupExpiredRecords(ipStore, now);
  cleanupExpiredRecords(emailStore, now);

  // 1. Controllo Rate Limit per IP
  const ipRecord = ipStore.get(ip) || { timestamps: [] };

  if (ipRecord.blockedUntil && ipRecord.blockedUntil > now) {
    const remainingSec = Math.ceil((ipRecord.blockedUntil - now) / 1000);
    return {
      allowed: false,
      reason: `Troppi tentativi consecutivi da questa rete. Blocco di sicurezza temporaneo: riprova tra ${Math.ceil(remainingSec / 60)} minuti.`,
      retryAfterSeconds: remainingSec,
    };
  }

  // Filtra timestamp validi nella finestra
  ipRecord.timestamps = ipRecord.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (ipRecord.timestamps.length >= MAX_ORDERS_PER_IP) {
    ipRecord.blockedUntil = now + BLOCK_DURATION_MS;
    ipStore.set(ip, ipRecord);
    return {
      allowed: false,
      reason: 'Limite massimo ordini raggiunto per questa sessione. Riprova tra 15 minuti.',
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  // 2. Controllo Rate Limit per Email (se presente)
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    const emailRecord = emailStore.get(cleanEmail) || { timestamps: [] };

    if (emailRecord.blockedUntil && emailRecord.blockedUntil > now) {
      const remainingSec = Math.ceil((emailRecord.blockedUntil - now) / 1000);
      return {
        allowed: false,
        reason: `Questa email ha superato il limite di ordini recenti. Riprova tra ${Math.ceil(remainingSec / 60)} minuti.`,
        retryAfterSeconds: remainingSec,
      };
    }

    emailRecord.timestamps = emailRecord.timestamps.filter((ts) => now - ts < WINDOW_MS);

    if (emailRecord.timestamps.length >= MAX_ORDERS_PER_EMAIL) {
      emailRecord.blockedUntil = now + BLOCK_DURATION_MS;
      emailStore.set(cleanEmail, emailRecord);
      return {
        allowed: false,
        reason: 'Numero massimo di ordini raggiunto per questo indirizzo email.',
        retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      };
    }

    // Registra timestamp email
    emailRecord.timestamps.push(now);
    emailStore.set(cleanEmail, emailRecord);
  }

  // Registra timestamp IP
  ipRecord.timestamps.push(now);
  ipStore.set(ip, ipRecord);

  return { allowed: true };
}

/**
 * Verifica trappola Honeypot e tempo minimo di interazione (Anti-Bot Automatici)
 */
export function verifyBotProtection(options: {
  honeypotValue?: string;
  clientTimestamp?: number;
}): { isHuman: boolean; reason?: string } {
  // 1. Se il campo invisibile honeypot è compilato, è categoricamente un bot
  if (options.honeypotValue && options.honeypotValue.trim().length > 0) {
    return {
      isHuman: false,
      reason: 'Rilevata attività automatizzata (trappola anti-bot attivata).',
    };
  }

  // 2. Controllo velocità sovrumana (i bot inviano form in millisecondi)
  if (options.clientTimestamp) {
    const elapsedMs = Date.now() - options.clientTimestamp;
    if (elapsedMs > 0 && elapsedMs < MIN_HUMAN_INTERACTION_MS) {
      return {
        isHuman: false,
        reason: 'Compilazione troppo rapida. Riprova con calma.',
      };
    }
  }

  return { isHuman: true };
}
