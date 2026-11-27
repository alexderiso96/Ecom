# Dream Creation

Un'applicazione e-commerce moderna, scalabile e performante sviluppata con **Next.js (App Router)**, **Tailwind CSS**, **Zustand** e **Supabase** (Database PostgreSQL, Row Level Security, Auth e Storage). 

Nessun gateway di pagamento tradizionale: gli ordini vengono convertiti istantaneamente in un messaggio formattato e inviati dal cliente tramite un link a WhatsApp per una vendita diretta, umana e a zero commissioni di transazione.

---

## 🚀 Stack Tecnologico

- **Frontend Framework**: Next.js 14 (App Router, Server Components & Client Components)
- **Styling**: Tailwind CSS con palette moderna e design system responsive ispirato a shadcn/ui
- **State Management**: Zustand con middleware di persistenza `localStorage` (il carrello non si svuota al refresh)
- **Backend-as-a-Service**: Supabase
  - **Database**: PostgreSQL relazionale con trigger e funzioni `SECURITY DEFINER`
  - **Auth**: Autenticazione email/password integrata con sessioni SSR via `@supabase/ssr`
  - **RLS (Row Level Security)**: Isolamento granulare per ruoli Customer, Admin e SuperAdmin
  - **Storage**: Bucket pubblico `products-images` per upload e gestione foto prodotti
- **Icone**: Lucide React
- **Hosting / Deploy**: Vercel (zero-config)

---

## 🛡️ Gestione Autenticazione & RBAC (3 Ruoli)

L'applicazione implementa un sistema Role-Based Access Control su tabella `public.profiles` sincronizzata con `auth.users`:

| Ruolo | Permessi e Privilegi |
|---|---|
| **Customer** | Naviga il catalogo, filtra per categoria e parola chiave, gestisce il carrello persistente ed effettua il checkout via WhatsApp. |
| **Admin** | Accesso all'area riservata `/admin`: CRUD completo delle Categorie merceologiche, CRUD completo dei Prodotti con upload immagini su Supabase Storage e gestione giacenze magazzino. |
| **SuperAdmin** | Accesso a tutte le funzionalità Admin + area riservata `/superadmin`: visualizzazione tabella utenti registrati, promozione/demozione ruoli (Customer ↔ Admin ↔ SuperAdmin) e revoca accessi. |

---

## 📂 Struttura del Progetto

```text
├── supabase/
│   └── schema.sql             # Script SQL completo: tabelle, RLS, Storage, trigger e seed data
├── src/
│   ├── app/
│   │   ├── admin/             # Dashboard riservata Admin (Categorie & Prodotti)
│   │   │   ├── categories/    # CRUD Categorie
│   │   │   ├── products/      # CRUD Prodotti & Upload Immagini
│   │   │   ├── layout.tsx     # Guard server-side per ruolo Admin/SuperAdmin
│   │   │   └── page.tsx       # Panoramica metriche catalogo
│   │   ├── superadmin/        # Dashboard riservata SuperAdmin
│   │   │   ├── users/         # Gestione e assegnazione ruoli RBAC
│   │   │   ├── layout.tsx     # Guard server-side per ruolo SuperAdmin
│   │   │   └── page.tsx       # Control Room SuperAdmin
│   │   ├── auth/              # Pagine di autenticazione Supabase
│   │   │   ├── login/         # Login
│   │   │   ├── register/      # Registrazione
│   │   │   └── callback/      # Scambio codice token sessione SSR
│   │   ├── catalog/           # Pagina catalogo con filtri e ricerca interattiva
│   │   ├── product/[slug]/    # Dettaglio singolo prodotto con azioni carrello e WhatsApp
│   │   ├── globals.css        # Variabili CSS e utility Tailwind
│   │   ├── layout.tsx         # Layout globale con Navbar, CartDrawer e Footer
│   │   └── page.tsx           # Vetrina Home (Hero, Categorie, In Evidenza)
│   ├── components/
│   │   ├── cart/              # CartDrawer offcanvas & checkout WhatsApp
│   │   ├── home/              # Hero banner e sezioni vetrina
│   │   ├── layout/            # Navbar responsive e Footer
│   │   ├── products/          # ProductCard, ProductGrid, ProductFilters
│   │   └── ui/                # Componenti atomici (Button, Input, Modal, Badge)
│   ├── lib/
│   │   ├── supabase/          # Client Supabase SSR (client, server, middleware)
│   │   └── utils.ts           # Formattazione valuta, generatore link WhatsApp, slugify
│   ├── store/
│   │   └── useCartStore.ts    # Store Zustand con persistenza localStorage
│   ├── types/
│   │   └── database.types.ts  # Tipi TypeScript per Database & Carrello
│   └── middleware.ts          # Next.js Middleware con protezione rotte /admin e /superadmin
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Installazione e configurazione

Usa Node.js 22 e installa le dipendenze con `npm ci`.

### Supabase

Su un progetto nuovo esegui questi file in ordine dal SQL Editor:

1. [schema.sql](supabase/schema.sql)
2. [orders_migration.sql](supabase/orders_migration.sql)
3. [add_multiple_images.sql](supabase/add_multiple_images.sql)
4. [security_hardening.sql](supabase/security_hardening.sql)
5. [dream_creation_checkout.sql](supabase/dream_creation_checkout.sql)

Su un progetto esistente con schema, ordini, galleria e hardening già applicati, aggiungi unicamente `dream_creation_checkout.sql`. La migrazione rimuove la scrittura diretta degli ordini per gli utenti pubblici. Coordinane l’applicazione con l’aggiornamento dell’app affinché il nuovo endpoint usi la funzione SQL abilitata per il server.

Per il primo SuperAdmin, registra l’identità tramite il sito e usa lo SQL Editor con il ruolo database `postgres`:

```sql
UPDATE public.profiles
SET role = 'superadmin'
WHERE id = 'uuid-dell-utente';
```

La migrazione crea le categorie Ombrelli, Pochette, Tazze e Bijoux se mancano. Dal pannello prodotti, assegna gli articoli esistenti alla categoria appropriata e compila le opzioni di personalizzazione. Gli articoli contrassegnati **Richiede un preventivo su WhatsApp** mostrano un pulsante di contatto al posto dell’acquisto. La home mostra le collezioni che contengono articoli attivi. Il bucket `products-images` ospita le foto caricate dal pannello.

### Ambiente

Copia [`.env.example`](.env.example) in `.env.local` e configura URL Supabase, chiave pubblica, numero WhatsApp in formato internazionale senza `+` e `SUPABASE_SERVICE_ROLE_KEY`. Imposta le stesse variabili sull’hosting. La chiave service role serve solo al Route Handler del checkout e va tenuta fuori dalle variabili pubbliche.

Avvia il sito con `npm run dev`.

### Checkout

Il server verifica quantità, disponibilità e prezzi e salva l’ordine con le righe in una singola transazione. Il riepilogo mostra il codice, il totale degli articoli e i comandi per aprire WhatsApp o copiare il messaggio. Gli ordini in attesa di risposta non riservano stock, così il negozio può confermare disponibilità e spedizione in chat.

### Verifiche

Esegui `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`. La CI ripete gli stessi controlli. I test SQL eseguono lo schema su PostgreSQL locale integrato e non richiedono credenziali Supabase.
