-- ==============================================================================
-- DATABASE SCHEMA: E-COMMERCE CON RBAC (CUSTOMER, ADMIN, SUPERADMIN)
-- Piattaforma: Supabase (PostgreSQL + Auth + Storage + RLS)
-- ==============================================================================

-- 1. ABILITAZIONE ESTENSIONI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPO ENUM RUOLI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'superadmin');
    END IF;
END $$;

-- 3. TABELLA: PROFILES (Collegata ad auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABELLA: CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELLA: PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);

-- 7. FUNZIONE E TRIGGER: AGGIORNAMENTO AUTOMATICO updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. TRIGGER: CREAZIONE AUTOMATICA PROFILO SU SIGN-UP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.user_role := 'customer';
BEGIN
    -- Se il primo utente in assoluto si registra, è possibile renderlo superadmin (opzionale),
    -- oppure impostare 'customer' per tutti di default.
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        assigned_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Collega il trigger su auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. FUNZIONI DI SUPPORTO PER IL CONTROLLO RUOLI (SECURITY DEFINER)
-- Evitano ricorsione infinita nelle policy RLS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Attivazione RLS su tutte le tabelle
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. POLICY PER TABELLA PROFILES
-- ------------------------------------------------------------------------------
-- Lettura: l'utente loggato vede il proprio profilo, Admin/SuperAdmin vedono tutti i profili
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id OR public.is_admin()
    );

-- Modifica: L'utente modifica il proprio profilo (nome, telefono), SuperAdmin modifica tutto (inclusi ruoli)
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id OR public.is_superadmin()
    )
    WITH CHECK (
        -- Se non è superadmin, non può modificare il proprio campo role
        CASE 
            WHEN public.is_superadmin() THEN TRUE
            ELSE (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
        END
    );

-- Inserimento: consentito dal trigger SECURITY DEFINER o per il proprio id
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_superadmin());

-- Cancellazione profili: riservata a SuperAdmin
DROP POLICY IF EXISTS "profiles_delete_superadmin" ON public.profiles;
CREATE POLICY "profiles_delete_superadmin" ON public.profiles
    FOR DELETE
    USING (public.is_superadmin());

-- ------------------------------------------------------------------------------
-- B. POLICY PER TABELLA CATEGORIES
-- ------------------------------------------------------------------------------
-- Lettura: Aperta a tutti (pubblica)
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
    FOR SELECT
    USING (TRUE);

-- Scrittura (Insert, Update, Delete): Solo Admin e SuperAdmin
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin" ON public.categories
    FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin" ON public.categories
    FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin" ON public.categories
    FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- C. POLICY PER TABELLA PRODUCTS
-- ------------------------------------------------------------------------------
-- Lettura: Il pubblico e i customer vedono solo i prodotti attivi (is_active = true).
-- Gli Admin e SuperAdmin vedono sia attivi che inattivi.
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products
    FOR SELECT
    USING (
        is_active = TRUE OR public.is_admin()
    );

-- Scrittura (Insert, Update, Delete): Solo Admin e SuperAdmin
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin" ON public.products
    FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products
    FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products
    FOR DELETE
    USING (public.is_admin());

-- ==============================================================================
-- 11. STORAGE BUCKET: PRODOTTI & IMMAGINI
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products-images', 'products-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Policy di lettura pubblica per le immagini dei prodotti
DROP POLICY IF EXISTS "Storage Public Read" ON storage.objects;
CREATE POLICY "Storage Public Read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products-images');

-- Policy di upload/modifica per Admin e SuperAdmin
DROP POLICY IF EXISTS "Storage Admin Insert" ON storage.objects;
CREATE POLICY "Storage Admin Insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'products-images' AND public.is_admin()
    );

DROP POLICY IF EXISTS "Storage Admin Update" ON storage.objects;
CREATE POLICY "Storage Admin Update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'products-images' AND public.is_admin()
    );

DROP POLICY IF EXISTS "Storage Admin Delete" ON storage.objects;
CREATE POLICY "Storage Admin Delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'products-images' AND public.is_admin()
    );

-- ==============================================================================
-- 12. SEED DATA (DATI DI ESEMPIO)
-- ==============================================================================
INSERT INTO public.categories (id, name, slug, description, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Abbigliamento', 'abbigliamento', 'Capi di tendenza, materiali sostenibili e comfort assoluto', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'),
('22222222-2222-2222-2222-222222222222', 'Accessori & Pelletteria', 'accessori', 'Borse in pelle, orologi di precisione e occhiali di design', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'),
('33333333-3333-3333-3333-333333333333', 'Tech & Audio', 'tech-audio', 'Cuffie wireless, accessori da scrivania e gadget smart premium', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'),
('44444444-4444-4444-4444-444444444444', 'Home & Living', 'home-living', 'Elementi di arredo minimal, candele aromatiche e complementi moderni', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (category_id, name, slug, description, price, image_url, stock, is_featured, is_active) VALUES
('33333333-3333-3333-3333-333333333333', 'Cuffie Wireless Hi-Fi Studio Pro', 'cuffie-wireless-hi-fi-studio-pro', 'Cancellazione attiva del rumore (ANC), autonomia 40 ore e driver in grafene per bassi profondi e alti cristallini.', 249.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 25, TRUE, TRUE),
('22222222-2222-2222-2222-222222222222', 'Zaino Minimalista Urban Waterproof', 'zaino-minimalista-urban', 'Tessuto idrorepellente riciclato, scomparto imbottito per laptop fino a 16 pollici e porta USB-C integrata.', 119.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', 40, TRUE, TRUE),
('22222222-2222-2222-2222-222222222222', 'Orologio Cronografo Titanio Stealth', 'orologio-cronografo-titanio', 'Cassa in titanio grado aeronautico, vetro zaffiro antigraffio e cinturino in pelle pieno fiore conciata al vegetale.', 340.00, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80', 12, TRUE, TRUE),
('11111111-1111-1111-1111-111111111111', 'Giacca a Vento Modulare Techwear', 'giacca-vento-modulare', 'Impermeabilità 20k mm, traspirabilità eccellente e cappuccio termonastrato rimovibile.', 189.50, 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80', 18, TRUE, TRUE),
('44444444-4444-4444-4444-444444444444', 'Lampada da Tavolo Architettonica LED', 'lampada-tavolo-led', 'Corpo in alluminio spazzolato con dimmer touch continuo e selezione della temperatura colore da 2700K a 6000K.', 89.00, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80', 30, FALSE, TRUE),
('11111111-1111-1111-1111-111111111111', 'Felpa Organica Oversize Essential', 'felpa-organica-oversize', '100% cotone organico pettinato certificato GOTS (450 gsm), comfort termico e taglio moderno contemporaneo.', 75.00, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80', 50, FALSE, TRUE)
ON CONFLICT (slug) DO NOTHING;

