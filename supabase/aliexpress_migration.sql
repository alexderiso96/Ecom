-- ==============================================================================
-- ALIEXPRESS DROPSHIPPING INTEGRATION - DATABASE SCHEMA & MIGRATION
-- Piattaforma: Supabase (PostgreSQL + RLS + Service Role Protection)
-- ==============================================================================

-- 1. ENUM PER LO STATO DI FULFILLMENT ORDINE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillment_status') THEN
        CREATE TYPE public.fulfillment_status AS ENUM ('PENDING', 'ORDERED', 'SHIPPED', 'FAILED');
    END IF;
END $$;

-- 2. TABELLA: ALIEXPRESS CREDENTIALS (Ultra protetta, accessibile solo via Service Role)
CREATE TABLE IF NOT EXISTS public.aliexpress_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_key TEXT NOT NULL,
    app_secret TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    seller_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Attivazione RLS su aliexpress_credentials
ALTER TABLE public.aliexpress_credentials ENABLE ROW LEVEL SECURITY;

-- Nessuna policy per anon o authenticated: solo la SUPABASE_SERVICE_ROLE_KEY (backend) può accedervi
DROP POLICY IF EXISTS "Deny all public access to aliexpress_credentials" ON public.aliexpress_credentials;
CREATE POLICY "Deny all public access to aliexpress_credentials"
    ON public.aliexpress_credentials
    FOR ALL
    TO public
    USING (false);

-- 3. TABELLA: ORDERS (Se non ancora esistente, integrata con campi AliExpress)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT,
    shipping_province TEXT,
    shipping_postal_code TEXT,
    shipping_country TEXT NOT NULL DEFAULT 'IT',
    customer_notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Campi Dropshipping AliExpress
    aliexpress_order_id TEXT,
    fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'PENDING',
    tracking_number TEXT,
    carrier_name TEXT,
    error_payload JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABELLA: ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID,
    aliexpress_product_id TEXT,
    aliexpress_sku_id TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELLA: PRODUCT_VARIANTS (Supporto Varianti SKU AliExpress: taglie, colori, ecc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    aliexpress_sku_id TEXT,
    sku_code TEXT,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(10, 2) CHECK (cost_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. AGGIORNAMENTO TABELLA PRODUCTS (Estensione per AliExpress)
DO $$
BEGIN
    -- aliexpress_product_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'aliexpress_product_id') THEN
        ALTER TABLE public.products ADD COLUMN aliexpress_product_id TEXT;
    END IF;

    -- aliexpress_sku_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'aliexpress_sku_id') THEN
        ALTER TABLE public.products ADD COLUMN aliexpress_sku_id TEXT;
    END IF;

    -- cost_price (Prezzo fornitore su AliExpress)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
        ALTER TABLE public.products ADD COLUMN cost_price NUMERIC(10, 2) DEFAULT 0.00;
    END IF;

    -- markup_percentage (Percentuale di ricarico, es. 50% = 1.5x)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'markup_percentage') THEN
        ALTER TABLE public.products ADD COLUMN markup_percentage NUMERIC(5, 2) DEFAULT 50.00;
    END IF;

    -- stock_quantity (Quantità a magazzino AliExpress)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
        ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
    END IF;

    -- last_synced_at (Timestamp ultima sincronizzazione prezzo/stock)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'last_synced_at') THEN
        ALTER TABLE public.products ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 7. INDICI PER PERFORMANCE BATCH SYNC E QUERY RAPIDE
CREATE INDEX IF NOT EXISTS idx_products_last_synced_at ON public.products(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_products_aliexpress_id ON public.products(aliexpress_product_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_aliexpress_order_id ON public.orders(aliexpress_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_ali_sku ON public.product_variants(aliexpress_sku_id);

-- 8. TRIGGER UPDATED_AT PER LE NUOVE TABELLE
CREATE OR REPLACE TRIGGER set_aliexpress_credentials_updated_at
    BEFORE UPDATE ON public.aliexpress_credentials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. ROW LEVEL SECURITY PER ORDERS E ORDER_ITEMS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Product variants sono visibili pubblicamente a tutti i clienti
DROP POLICY IF EXISTS "Permetti lettura varianti a tutti" ON public.product_variants;
CREATE POLICY "Permetti lettura varianti a tutti"
    ON public.product_variants FOR SELECT
    USING (true);

-- Solo admin/superadmin possono modificare le varianti
DROP POLICY IF EXISTS "Permetti gestione varianti ad admin" ON public.product_variants;
CREATE POLICY "Permetti gestione varianti ad admin"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.is_superadmin());

-- Chiunque può creare un ordine (anche guest anonimi)
DROP POLICY IF EXISTS "Permetti creazione ordini" ON public.orders;
CREATE POLICY "Permetti creazione ordini"
    ON public.orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permetti inserimento order_items" ON public.order_items;
CREATE POLICY "Permetti inserimento order_items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

-- I clienti possono leggere i propri ordini
DROP POLICY IF EXISTS "Clienti vedono i propri ordini" ON public.orders;
CREATE POLICY "Clienti vedono i propri ordini"
    ON public.orders FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin() OR public.is_superadmin());

DROP POLICY IF EXISTS "Clienti vedono i propri order_items" ON public.order_items;
CREATE POLICY "Clienti vedono i propri order_items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.user_id = auth.uid() OR public.is_admin() OR public.is_superadmin())
        )
    );

-- Gli Admin e SuperAdmin possono aggiornare e gestire tutti gli ordini
DROP POLICY IF EXISTS "Admin gestiscono tutti gli ordini" ON public.orders;
CREATE POLICY "Admin gestiscono tutti gli ordini"
    ON public.orders FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.is_superadmin());

