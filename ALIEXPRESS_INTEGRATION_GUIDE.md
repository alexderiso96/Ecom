# 📦 Guida Integrazione Dropshipping AliExpress (Zero-Cost Serverless)

Questa guida documenta l'architettura, la configurazione e le procedure operative per gestire il dropshipping automatizzato con **AliExpress Open Platform** a **costo zero**, sfruttando **Next.js (App Router)**, **Vercel (Hobby Tier)**, **Supabase** e **GitHub Actions Workflows**.

---

## 🏛️ 1. Architettura & Flusso Logico

L'infrastruttura è progettata per operare interamente all'interno dei limiti del **Tier Gratuito di Vercel** (timeout massimo di 10 secondi per le Serverless Function) e **senza utilizzare Vercel Cron a pagamento**, delegando la schedulazione periodica ai container gratuiti di **GitHub Actions**.

### Diagramma di Flusso End-to-End

```mermaid
flowchart TD
    subgraph Cliente & Storefront
        A[Cliente aggiunge articoli al carrello] --> B[Click 'Procedi all'Ordine']
        B --> C[Salvataggio automatico Ordine su Supabase #ORD-XXXXXX]
        C --> D[Apertura WhatsApp con riepilogo e Codice Ordine]
    end

    subgraph Gestione Ordini & Fulfillment
        E[Admin verifica ordine su /admin/orders]
        E --> F[Click 'Invia ad AliExpress' o Webhook automatico]
        F --> G[POST /api/aliexpress/fulfill]
        G --> H[AliExpress Open Platform: aliexpress.solution.order.create]
        H --> I[Supabase: Salva aliexpress_order_id & stato 'ORDERED']
    end

    subgraph GitHub Actions Cron 0-Cost
        J[Cron Sync Inventory ogni 6h] --> K[GET /api/aliexpress/sync-inventory]
        K --> L[Verifica variazione prezzi & out-of-stock fornitore a piccoli chunk]

        M[Cron Sync Tracking ogni 2h] --> N[GET /api/aliexpress/sync-tracking]
        N --> O[AliExpress Open Platform: getOrderInfo]
        O --> P[Supabase: Aggiorna tracking_number & stato 'SHIPPED']
    end
```

---

## 🔑 2. Come ottenere App Key e App Secret su AliExpress Open Platform

Per comunicare direttamente con le API ufficiali di AliExpress, segui questi passaggi:

### Passo 1: Registrazione Developer
1. Accedi al portale sviluppatori: [AliExpress Open Platform](https://open.aliexpress.com/).
2. Registrati come Developer (o accedi con il tuo account AliExpress Buyer/Seller).
3. Completa la verifica dell'identità richiesta da Alibaba Group.

### Passo 2: Creazione dell'Applicazione
1. Entra nella **Console di Sviluppo** -> sezione **App Management**.
2. Clicca su **Create App** e seleziona la categoria:
   * **Dropshipper / Self-developer / ERP Solution**.
3. Compila i dettagli richiesti (Nome dell'App: es. `AuraStore Dropshipping`, Callback URL: `https://tuo-dominio.vercel.app/api/auth/aliexpress/callback`).
4. Al termine della creazione, ti verranno rilasciati:
   * **App Key** (es. `50123456`)
   * **App Secret** (es. `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Passo 3: Autorizzazione OAuth (Access Token & Refresh Token)
1. AliExpress richiede un token di accesso iniziale per effettuare ordini a tuo nome.
2. Componi l'URL di autorizzazione nel browser:
   ```text
   https://oauth.aliexpress.com/authorize?response_type=code&force_auth=true&redirect_uri=https://tuo-dominio.vercel.app/api/auth/aliexpress/callback&client_id=TUO_APP_KEY
   ```
3. Effettua il login con l'account AliExpress acquirente con cui intendi comprare gli articoli dai fornitori.
4. Una volta autorizzato, riceverai un codice `code` nel redirect.
5. Scambia il `code` con l'Access Token chiamando l'endpoint token:
   ```bash
   curl -X POST "https://api-sg.aliexpress.com/rest/auth/token/create" \
     -d "code=CODICE_RICEVUTO" \
     -d "app_key=TUO_APP_KEY" \
     -d "app_secret=TUO_APP_SECRET"
   ```
6. Salva l'`access_token` e il `refresh_token` ottenuto nella tabella `aliexpress_credentials` di Supabase (o nelle variabili d'ambiente). Il nostro client eseguirà il **refresh automatico** prima della scadenza!

---

## ⚙️ 3. Configurazione Variabili d'Ambiente e Secrets

### A. File Locale (`.env.local`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://plrryrcjytaryughxkya.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Richiesta per bypassare RLS nei cron job e per aliexpress_credentials

# Sicurezza Cron & Route Handlers
CRON_SECRET=un_token_segreto_molto_lungo_e_casuale_32_caratteri

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=393400000000

# AliExpress (Opzionali se configurati nella tabella DB aliexpress_credentials)
ALIEXPRESS_APP_KEY=50123456
ALIEXPRESS_APP_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
ALIEXPRESS_ACCESS_TOKEN=tuo_access_token
ALIEXPRESS_REFRESH_TOKEN=tuo_refresh_token
```

### B. Variabili su Vercel (Project Settings -> Environment Variables)
Inserisci le stesse variabili in produzione:
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `CRON_SECRET`
* `NEXT_PUBLIC_WHATSAPP_NUMBER`
* `ALIEXPRESS_APP_KEY`
* `ALIEXPRESS_APP_SECRET`
* `ALIEXPRESS_ACCESS_TOKEN`
* `ALIEXPRESS_REFRESH_TOKEN`

### C. GitHub Repository Secrets (GitHub -> Settings -> Secrets and variables -> Actions)
Per consentire l'esecuzione automatica dei workflow gratuiti, aggiungi questi **Repository Secrets**:
1. `APP_URL`: Il dominio pubblico della tua app (es. `https://aura-store.vercel.app` o il dominio di produzione senza slash finale).
2. `CRON_SECRET`: La stessa stringa impostata su Vercel (es. `un_token_segreto_molto_lungo_e_casuale_32_caratteri`).

---

## 🧪 4. Istruzioni per Testare Localmente gli Endpoint

Avvia l'app locale con:
```bash
npm run dev
```

### 1. Test Import Prodotto da AliExpress
Puoi importare un articolo tramite URL o ID.
```bash
curl -X POST "http://localhost:3000/api/aliexpress/import" \
  -H "Authorization: Bearer un_token_segreto_molto_lungo_e_casuale_32_caratteri" \
  -H "Content-Type: application/json" \
  -d '{
    "aliexpressUrlOrId": "https://it.aliexpress.com/item/1005006234567890.html",
    "markupPercentage": 60
  }'
```
*Se le credenziali non sono ancora collegate, il sistema si avvierà in **Modalità Simulazione Mock**, restituendo un prodotto di prova completo di varianti SKU e salvandolo su Supabase!*

---

### 2. Test Inoltro Ordine (Fulfillment)
Dato un ID ordine registrato su Supabase (es. visualizzabile nella colonna ID di `/admin/orders`):
```bash
curl -X POST "http://localhost:3000/api/aliexpress/fulfill" \
  -H "Authorization: Bearer un_token_segreto_molto_lungo_e_casuale_32_caratteri" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "UUID_DEL_TUO_ORDINE_SUPABASE"
  }'
```
*L'endpoint è **idempotente**: se richiamato più volte sullo stesso ordine, non duplicherà l'acquisto su AliExpress.*

---

### 3. Test Sincronizzazione Inventario (Simulazione GitHub Action)
```bash
curl -X GET "http://localhost:3000/api/aliexpress/sync-inventory" \
  -H "Authorization: Bearer un_token_segreto_molto_lungo_e_casuale_32_caratteri"
```
**Risposta attesa (HTTP 200)**:
```json
{
  "status": "success",
  "syncedCount": 10,
  "updatedCount": 1,
  "durationMs": 420,
  "logs": [
    {
      "id": "...",
      "name": "Smart Gadget Dropshipping",
      "changes": "Nessuna variazione"
    }
  ]
}
```

---

### 4. Test Sincronizzazione Tracking Spedizioni
```bash
curl -X GET "http://localhost:3000/api/aliexpress/sync-tracking" \
  -H "Authorization: Bearer un_token_segreto_molto_lungo_e_casuale_32_caratteri"
```

---

## 🚀 5. Come monitorare ed eseguire i Workflow su GitHub Actions

1. Esegui il push del branch `Drop` su GitHub.
2. Apri la tua repository: [github.com/alexderiso96/Ecom](https://github.com/alexderiso96/Ecom).
3. Clicca sulla scheda **Actions** in alto.
4. Troverai i due workflow schedulati:
   * **`AliExpress Sync Inventory Cron`** (schedulato ogni 6 ore).
   * **`AliExpress Sync Tracking Cron`** (schedulato ogni 2 ore).
5. Per testarli subito senza attendere l'orario del cron:
   * Clicca sul workflow nella barra laterale sinistra.
   * Clicca sul pulsante **Run workflow** -> seleziona il branch `Drop` -> clicca **Run workflow**.
   * Il job eseguirà la chiamata cURL e potrai visualizzare i log di esecuzione in tempo reale con lo status HTTP 200.

---

## 🛡️ 6. Applicazione Migrazione Database su Supabase
Per applicare le nuove tabelle e colonne:
1. Accedi alla dashboard di Supabase sul tuo progetto.
2. Vai su **SQL Editor** -> clicca **New query**.
3. Incolla il contenuto del file [`supabase/aliexpress_migration.sql`](file:///c:/Users/alessandro.de.riso/PersonalProject/EC/supabase/aliexpress_migration.sql).
4. Clicca su **Run**.

