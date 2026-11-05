import { getValidCjToken, triggerCircuitBreaker } from './auth';
import { CjApiResponse } from '@/types/cj.types';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

export type CjApiCategory = 'catalog' | 'order' | 'auth';

// -------------------------------------------------------------
// Rate Limiter: Coda sequenziale per Orders / Payments (max 2 req/s)
// -------------------------------------------------------------
class OrderQueueLimiter {
  private lastExecutionTime = 0;
  private readonly minIntervalMs = 500; // 2 req / 1000ms
  private queueTail: Promise<void> = Promise.resolve();

  public enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = async () => {
      const now = Date.now();
      const waitTime = Math.max(0, this.lastExecutionTime + this.minIntervalMs - now);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.lastExecutionTime = Date.now();
      return fn();
    };

    const nextPromise = this.queueTail.then(run, run);
    // Teniamo la catena viva
    this.queueTail = nextPromise.then(
      () => {},
      () => {}
    );
    return nextPromise;
  }
}

// -------------------------------------------------------------
// Rate Limiter: Sliding Window Token Bucket per Catalog (max 30 req/s)
// -------------------------------------------------------------
class CatalogRateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests = 30;
  private readonly windowMs = 1000;

  public async acquire(): Promise<void> {
    while (true) {
      const now = Date.now();
      // Elimina timestamp più vecchi della finestra di 1 secondo
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(Date.now());
        return;
      }

      // Attendi il tempo necessario affinché scada la richiesta più vecchia
      const oldest = this.timestamps[0];
      const waitTime = Math.max(10, this.windowMs - (now - oldest));
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

const orderLimiter = new OrderQueueLimiter();
const catalogLimiter = new CatalogRateLimiter();

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  category?: CjApiCategory;
  retries?: number;
  skipAuth?: boolean;
}

/**
 * Calcola il backoff esponenziale con jitter per riprovare chiamate rate-limited
 */
function getExponentialBackoffWithJitter(attempt: number, baseMs = 500, maxMs = 5000): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = Math.floor(Math.random() * 300);
  return exp + jitter;
}

/**
 * Client HTTP centralizzato per CJdropshipping API v2.0
 */
export async function cjRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<CjApiResponse<T>> {
  const {
    method = 'GET',
    body,
    category = 'catalog',
    retries = 3,
    skipAuth = false,
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${CJ_API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const executeRequest = async (currentAttempt = 0): Promise<CjApiResponse<T>> => {
    // 1. Rispettiamo il rate limiter della categoria
    if (category === 'order') {
      await new Promise<void>((resolve) => {
        // Assegniamo lo slot nella coda sequenziale
        orderLimiter.enqueue(async () => {
          resolve();
        });
      });
    } else if (category === 'catalog') {
      await catalogLimiter.acquire();
    }

    // 2. Recupero del token di autenticazione
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const { accessToken } = await getValidCjToken();
      headers['CJ-Access-Token'] = accessToken;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      if (currentAttempt < retries) {
        const delay = getExponentialBackoffWithJitter(currentAttempt);
        console.warn(`[CJ Client] Errore di rete su ${endpoint}, retry #${currentAttempt + 1} tra ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeRequest(currentAttempt + 1);
      }
      throw networkError;
    }

    // Gestione status HTTP generico
    if (!response.ok) {
      if (response.status === 429 && currentAttempt < retries) {
        const delay = getExponentialBackoffWithJitter(currentAttempt, 1000);
        console.warn(`[CJ Client] HTTP 429 Too Many Requests, retry tra ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeRequest(currentAttempt + 1);
      }
      const rawError = await response.text();
      throw new Error(`CJ API HTTP Error ${response.status} su ${endpoint}: ${rawError}`);
    }

    const json = (await response.json()) as CjApiResponse<T>;

    // 3. Error Interceptor per specifici codici CJ
    if (json.code !== 200) {
      const code = json.code;
      const message = json.message || 'Errore sconosciuto CJ';

      // 1600200 / 1600201: Too much request -> Exponential backoff con jitter
      if ((code === 1600200 || code === 1600201) && currentAttempt < retries) {
        const delay = getExponentialBackoffWithJitter(currentAttempt);
        console.warn(`[CJ Interceptor] Rate Limit CJ (${code}): ${message}. Retry #${currentAttempt + 1} in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeRequest(currentAttempt + 1);
      }

      // 1600001 - 1600003: Token scaduto o invalido -> Forza refresh e riprova
      if (code >= 1600001 && code <= 1600003) {
        if (currentAttempt < 2) {
          console.warn(`[CJ Interceptor] Token non valido o scaduto (${code}): forzo refresh token e rieseguo...`);
          await getValidCjToken(true);
          return executeRequest(currentAttempt + 1);
        }
      }

      // 1600014: API access disabled -> Blocco di emergenza (Circuit Breaker)
      if (code === 1600014) {
        const criticalMsg = `API access disabled (${code}): ${message}. L'accesso API è stato disattivato nel portale sviluppatori CJ.`;
        await triggerCircuitBreaker(criticalMsg);
        throw new Error(`[CRITICAL] ${criticalMsg}`);
      }

      // 1603003: Order already exists -> Gestione successo idempotente
      if (code === 1603003) {
        console.info(`[CJ Interceptor] Ordine già esistente su CJ (1603003): idempotenza confermata.`);
        return {
          code: 200,
          result: true,
          message: 'Order already exists on CJ (Idempotent success)',
          data: (json.data || {}) as T,
        };
      }

      throw new Error(`CJ API Error [${code}]: ${message}`);
    }

    return json;
  };

  return executeRequest();
}

