-- ==============================================================================
-- CJ DROPSHIPPING INTEGRATION MIGRATION
-- Piattaforma: Supabase (PostgreSQL + RLS + Triggers)
-- ==============================================================================

-- 1. ENUM: STATO FULFILLMENT E ORDINE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillment_status') THEN
        CREATE TYPE public.fulfillment_status AS ENUM (
            'PENDING',
            'ORDERED',
            'PAID',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'FAILED'
        );
    END IF;
END $$;

-- 2. TABELLA: CJ CREDENTIALS & TOKEN CACHE
-- Accessibile esclusivamente tramite la service_role key o funzioni backend protette.
CREATE TABLE IF NOT EXISTS public.cj_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    api_key TEXT,
    password TEXT,
    access_token TEXT,
    refresh_token TEXT,
    open_id TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_circuit_broken BOOLEAN NOT NULL DEFAULT FALSE,
    circuit_break_reason TEXT,
    circuit_broken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ESTENSIONE TABELLA: PRODUCTS
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS cj_product_id TEXT,
    ADD COLUMN IF NOT EXISTS cj_product_sku TEXT,
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC(6, 2) DEFAULT 40.00,
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_cj_product_id_key'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_cj_product_id_key UNIQUE (cj_product_id);
    END IF;
END $$;

-- 4. TABELLA: PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cj_variant_id TEXT UNIQUE,
    cj_sku TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(10, 2) CHECK (cost_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    weight NUMERIC(10, 3) DEFAULT 0 CHECK (weight >= 0),
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELLA: ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_province TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country_code VARCHAR(2) NOT NULL DEFAULT 'IT',
    shipping_country TEXT NOT NULL DEFAULT 'Italy',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'PENDING',
    cj_order_id TEXT,
    cj_order_number TEXT,
    cj_tracking_number TEXT,
    cj_carrier_name TEXT,
    cj_freight_cost NUMERIC(10, 2),
    error_payload JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABELLA: ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    cj_variant_id TEXT,
    cj_sku TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. TABELLA: CJ WEBHOOK EVENTS (Audit & Asynchronous Processing Queue)
CREATE TABLE IF NOT EXISTS public.cj_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 8. INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_cj_product_id ON public.products(cj_product_id);
CREATE INDEX IF NOT EXISTS idx_products_last_synced ON public.products(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_cj_vid ON public.product_variants(cj_variant_id);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_cj_order_id ON public.orders(cj_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_cj_vid ON public.order_items(cj_variant_id);

CREATE INDEX IF NOT EXISTS idx_cj_webhook_events_status ON public.cj_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_cj_webhook_events_created ON public.cj_webhook_events(created_at DESC);

-- 9. TRIGGER PER updated_at
CREATE OR REPLACE TRIGGER set_cj_credentials_updated_at
    BEFORE UPDATE ON public.cj_credentials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.cj_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cj_webhook_events ENABLE ROW LEVEL SECURITY;

-- cj_credentials: Nessuna policy pubblica. Accesso concesso SOLO alla service_role key di Supabase.

-- product_variants: Lettura pubblica, scrittura per admin o service_role
CREATE POLICY "product_variants_public_select"
    ON public.product_variants FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
            AND p.is_active = TRUE
        )
    );

CREATE POLICY "product_variants_admin_all"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- orders: Clienti vedono i propri ordini, admin/superadmin vedono tutto
CREATE POLICY "orders_customer_select"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "orders_customer_insert"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_admin_all"
    ON public.orders FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- order_items: Visibili a chi può vedere l'ordine genitore
CREATE POLICY "order_items_customer_select"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "order_items_customer_insert"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "order_items_admin_all"
    ON public.order_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- cj_webhook_events: Solo admin o superadmin per audit, scrittura delegata a service_role
CREATE POLICY "cj_webhook_events_admin_select"
    ON public.cj_webhook_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

