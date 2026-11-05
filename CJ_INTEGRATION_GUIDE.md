# Guida all'Integrazione Nativa CJdropshipping API v2.0

Questa guida documenta l'architettura, la configurazione e le best practice per l'integrazione nativa delle **API v2.0 di CJdropshipping** nell'e-commerce Next.js & Supabase.

---

## 1. Architettura del Sistema

```
[ Cliente / Browser ]
        │
        ├─► [ Cart Drawer & Checkout ]
        │         │
        │         ├─► POST /api/cj/freight (POST /logistic/freightCalculate)
        │         └─► POST /api/orders/create (Salvataggio Ordine Locale)
        │                   │
        │                   └─► POST /shopping/order/createOrderV2 (Idempotente)
        │                             │
        │                             └─► Wallet Auto-Pay (payType: 2 o /payBalanceV2)
        │
[ CJdropshipping Platform ]
        │
        └─► POST /api/webhooks/cj (SLA < 3s, Risposta HTTP 200 < 50ms)
                  │
                  ├─► Verifica HMAC-SHA256 con openId (Base64)
                  ├─► Inserimento cj_webhook_events
                  └─► Dispatcher Asincrono: STOCK, VARIANT, ORDER, LOGISTICS
```

---

## 2. Moduli Implementati

### 2.1 Autenticazione & Token Caching (`src/lib/cj/auth.ts`)
- **Endpoint:** `POST https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken`.
- **Rate Limit:** Rispetta rigidamente il limite di **max 1 richiesta al secondo** con lock di concorrenza in memoria.
- **Token Storage:** I token `accessToken` e `refreshToken` (fino a 1024 caratteri) vengono memorizzati su Supabase nella tabella protetta `cj_credentials` con TTL di 24 ore.
- **OpenId:** L'`openId` restituito dall'autenticazione viene salvato ed utilizzato come chiave crittografica segreta HMAC per validare i webhook di CJ.

### 2.2 Client HTTP & Rate Limiter Centralizzato (`src/lib/cj/client.ts`)
- **Rate Limiting Differenziato:**
  - **Catalog/Search:** max 30 richieste/secondo (Token Bucket con finestra temporale da 1000ms).
  - **Orders/Payments:** max 2 richieste/secondo (Coda sequenziale asincrona garantita con intervallo minimo di 500ms).
- **Error Interceptor Integrato:**
  - `1600200` / `1600201` (*Too much request*): Exponential backoff con Jitter casuale e retry automatico.
  - `1600001` - `1600003` (*Token scaduto/invalido*): Invalidamento cache, refresh del token e retry immediato.
  - `1600014` (*API access disabled*): Attivazione del **Circuit Breaker** nel DB (`is_circuit_broken = true`), blocco delle chiamate successive e log di notifica per la riattivazione sul portale sviluppatori CJ.
  - `1603003` (*Order already exists*): Gestito con successo idempotente evitando duplicazioni.

### 2.3 Ricevitore Webhook Ultra-Veloce (`src/app/api/webhooks/cj/route.ts`)
- **SLA di risposta:** Risponde ad HTTP 200 in **< 50ms** (rispettando ampiamente il vincolo restrittivo di 3 secondi di CJ che non applica retry).
- **Verifica HMAC-SHA256:**
  - Cattura il **Raw Body** (`req.text()`).
  - Calcola l'HMAC-SHA256 con l'`openId` in digest Base64.
  - Confronta in tempo costante (`crypto.timingSafeEqual`) con l'header `sign`.
- **Accodamento ed Esecuzione Asincrona:**
  - Evento salvato su `cj_webhook_events`.
  - Dispatching in background per gli eventi:
    - `STOCK`: Aggiorna giacenze varianti e ricalcola stock aggregato del prodotto.
    - `VARIANT`: Aggiorna prezzi di fornitura e ricalcola i prezzi di vendita con il ricarico percentuale (`markup_percentage`).
    - `ORDER`: Aggiorna lo stato di avanzamento ordine (`ORDERED`, `PAID`, `SHIPPED`, `CANCELLED`).
    - `LOGISTICS`: Aggiorna numero di tracciamento (`cj_tracking_number`) e corriere (`cj_carrier_name`).

### 2.4 Flusso Ordini & Calcolo Spedizioni (`src/lib/cj/orders.ts`)
- **Calcolo Spedizione Pre-Checkout:** `calculateFreight` interroga `/logistic/freightCalculate` restituendo i corrieri disponibili (es. *CJ Packet Ordinary*, *CJ Express*), tempi di resa stimati e costi.
- **Creazione Idempotente dell'Ordine:** `fulfillOrderToCj` genera l'ordine su `/shopping/order/createOrderV2` passando il codice ordine univoco locale in `orderNumber`.
- **Pagamento:** Supporta sia `payType: 2` (addebito istantaneo da Wallet CJ alla creazione) sia `payType: 3` con chiamata `/shopping/pay/payBalanceV2`.

---

## 3. Configurazione Supabase

Esegui il file di migrazione SQL su Supabase SQL Editor:
```sql
-- File: supabase/cj_migration.sql
```
Questo creerà:
- Tabella protetta `cj_credentials` (accesso ristretto alla sola `service_role` key).
- Tabella `orders` e `order_items` con tracciamento CJ e stati di fulfillment (`PENDING`, `ORDERED`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `FAILED`).
- Tabella `product_variants` con `cj_variant_id`, stock, peso e attributi JSONB.
- Tabella di audit e background queue `cj_webhook_events`.
- Estensioni colonne su `products` (`cj_product_id`, `cost_price`, `markup_percentage`, `last_synced_at`).

---

## 4. Variabili d'Ambiente (`.env.local` / Vercel)

Configura le seguenti variabili nel tuo ambiente di sviluppo e nelle impostazioni di produzione di Vercel:

| Variabile | Descrizione | Obbligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del progetto Supabase | Sì |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anon pubblica Supabase | Sì |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave Service Role (bypass RLS lato server) | Sì |
| `CJ_EMAIL` | Email dell'account CJdropshipping | Sì |
| `CJ_API_KEY` | API Key generata nel CJ Developer Portal | Sì (o `CJ_PASSWORD`) |
| `CJ_OPEN_ID` | Open ID dell'account CJ (per validazione Webhook HMAC) | Consigliata (o ricavata da auth) |
| `CJ_SANDBOX` | `true` per test in ambiente protetto, `false` per ordini reali | Sì |
| `CJ_DEFAULT_LOGISTIC` | Corriere di default (es. `CJ Packet Ordinary`) | No |
| `CJ_IOSS_TYPE` | Tipo IOSS per spedizioni in Unione Europea (`1` = CJ platform) | No |
| `CRON_SECRET` | Chiave segreta per triggerare sync periodici | Sì |

---

## 5. Come Testare l'Integrazione

### 5.1 Test Calcolo Spedizioni (Freight API)
Invia una richiesta `POST` a `/api/cj/freight`:
```bash
curl -X POST http://localhost:3000/api/cj/freight \
  -H "Content-Type: application/json" \
  -d '{
    "destinationCountryCode": "IT",
    "postalCode": "00100",
    "city": "Roma",
    "items": [
      { "cjVariantId": "EXAMPLE_VID_123", "quantity": 1 }
    ]
  }'
```

### 5.2 Test Simulazione Webhook CJ
Per simulare un webhook CJ di notifica spedizione con firma HMAC:
```bash
curl -X POST http://localhost:3000/api/webhooks/cj \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "LOGISTICS",
    "data": {
      "orderNumber": "ORD-20261105-ABCDE",
      "trackingNumber": "CJIT1234567890",
      "logisticName": "CJ Packet Ordinary"
    }
  }'
```

### 5.3 Pannello Gestionale Admin
Accedi a `/admin/orders` autenticato come amministratore per visualizzare l'elenco degli ordini, lo stato di fulfillment e i codici di tracking sincronizzati da CJ.

