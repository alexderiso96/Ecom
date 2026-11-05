# 🛍️ Aura Store - E-Commerce Next.js & Supabase con Checkout WhatsApp

Un'applicazione e-commerce moderna, scalabile e performante sviluppata con **Next.js (App Router)**, **Tailwind CSS**, **Zustand** e **Supabase** (Database PostgreSQL, Row Level Security, Auth e Storage). 

Nessun gateway di pagamento tradizionale: gli ordini vengono convertiti istantaneamente in un messaggio formattato e instradati tramite le API ufficiali di WhatsApp per una vendita diretta, umana e a zero commissioni di transazione.

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

## ⚡ Installazione e Configurazione Rapida

### 1. Configurazione Supabase
1. Accedi alla dashboard di [Supabase](https://supabase.com) e crea un nuovo progetto.
2. Vai nella sezione **SQL Editor** del tuo progetto.
3. Copia l'intero contenuto del file [`supabase/schema.sql`](supabase/schema.sql) ed eseguilo. Lo script configurerà automaticamente:
   - Tabelle `profiles`, `categories`, `products`
   - Trigger di auto-creazione profilo su registrazione (`auth.users`)
   - Funzioni `is_admin()` e `is_superadmin()` `SECURITY DEFINER`
   - Tutte le policy RLS per isolare l'accesso ai dati
   - Il bucket storage pubblico `products-images`
   - Alcuni dati di esempio (categorie e prodotti con immagini Unsplash)

### 2. Promuovere il primo utente a SuperAdmin
Dopo esserti registrato tramite l'app alla pagina `/auth/register`:
Nel SQL Editor di Supabase esegui:
```sql
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE email = 'tua-email@esempio.com';
```
Da quel momento potrai accedere liberamente a `/admin` e `/superadmin` e gestire gli altri utenti direttamente dall'interfaccia web!

### 3. Configurazione Variabili d'Ambiente
Copia `.env.example` in `.env.local`:
```bash
cp .env.example .env.local
```
Compila i campi:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-chiave-anon-pubblica
NEXT_PUBLIC_WHATSAPP_NUMBER=393400000000
```
*(Il numero WhatsApp deve essere inserito in formato internazionale senza il prefisso `+`, es. `393401234567` per l'Italia).*

### 4. Avvio in Sviluppo Locale
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## 📲 Come Funziona il Checkout WhatsApp

Quando il cliente clicca su **"Procedi all'Ordine su WhatsApp"** nel carrello offcanvas, l'app genera istantaneamente una richiesta tramite l'URL standard `https://wa.me/<NUMERO>?text=...`:

Esempio di messaggio autogenerato e formattato:
```text
🛒 *NUOVO ORDINE E-COMMERCE*
📅 Data: 03/11/2026, 11:30

*DETTAGLI ARTICOLI:*
1. *Cuffie Wireless Hi-Fi Studio Pro*
   Quantità: 1 x €249.99 = €249.99
2. *Zaino Minimalista Urban Waterproof*
   Quantità: 2 x €119.00 = €238.00

💰 *TOTALE ORDINE: €487.99*

*DATI CLIENTE:*
👤 Nome: Mario Rossi
✉️ Email: mario.rossi@example.com
📞 Telefono: +39 333 1234567
📍 Indirizzo spedizione: Via Roma 10, 00100 Roma (RM)
📝 Note ordine: Consegna preferibilmente nel pomeriggio

_Resto in attesa di conferma disponibilità e dettagli per la spedizione._
```

---

## 🚀 Deploy su Vercel

1. Fai il push del codice sulla tua repository Git (GitHub, GitLab o Bitbucket).
2. Vai sulla dashboard di [Vercel](https://vercel.com) e clicca **"Add New Project"**.
3. Importa la repository.
4. Nelle **Environment Variables**, aggiungi le 3 variabili d'ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
5. Clicca **"Deploy"**. Vercel compilerà e pubblicherà la tua applicazione con CDN globale e certificati SSL automatici!

