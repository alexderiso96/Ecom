-- ==============================================================================
-- AGGIORNAMENTO CATEGORIE BOUTIQUE DI LUSSO & CATALOGO PRODOTTI
-- Piattaforma: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Inserisci o aggiorna le categorie ufficiali della Boutique
INSERT INTO public.categories (id, name, slug, description, image_url)
VALUES 
    (
        '11111111-aaaa-1111-aaaa-111111111111',
        'Gioielli & Bijoux',
        'gioielli',
        'Anelli scultorei, collane choker e bracciali rifiniti in oro 18k e argento 925.',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85'
    ),
    (
        '22222222-bbbb-2222-bbbb-222222222222',
        'Borse & Pelletteria',
        'borse',
        'Borse tote, tracolle e pelletteria sartoriale in pelle di vitello e pieno fiore.',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
    ),
    (
        '33333333-cccc-3333-cccc-333333333333',
        'Collezione Donna',
        'donna',
        'La selezione esclusiva di gioielli, borse e accessori per il guardaroba femminile.',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85'
    ),
    (
        '44444444-dddd-4444-dddd-444444444444',
        'Accessori Uomo',
        'uomo',
        'Portafogli slim in cuoio spazzolato, cinture sartoriali e orologi in titanio.',
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=85'
    )
ON CONFLICT (slug) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- 2. Aggiorna i prodotti esistenti assegnandoli alle categorie corrispondenti
-- Orologi e gioielli -> Gioielli
UPDATE public.products 
SET category_id = '11111111-aaaa-1111-aaaa-111111111111'
WHERE slug LIKE '%orologio%' OR slug LIKE '%gioiell%' OR name ILIKE '%collana%' OR name ILIKE '%bracciale%' OR name ILIKE '%anello%';

-- Zaini, borse, pelletteria -> Borse
UPDATE public.products 
SET category_id = '22222222-bbbb-2222-bbbb-222222222222'
WHERE slug LIKE '%zaino%' OR slug LIKE '%borsa%' OR name ILIKE '%borsa%' OR name ILIKE '%tote%' OR name ILIKE '%zaino%';

-- Portafogli, accessori maschili -> Uomo
UPDATE public.products 
SET category_id = '44444444-dddd-4444-dddd-444444444444'
WHERE slug LIKE '%portafoglio%' OR slug LIKE '%cintura%' OR name ILIKE '%uomo%' OR name ILIKE '%portafoglio%';

-- 3. Inserisci nuovi prodotti boutique d'esempio (se non già presenti)
INSERT INTO public.products (category_id, name, slug, description, price, image_url, stock, is_featured, is_active)
VALUES
    (
        '11111111-aaaa-1111-aaaa-111111111111',
        'Collana Choker Aurora in Oro 18k',
        'collana-choker-aurora-oro',
        'Design minimale con maglia fluida bagnata in oro 18 carati e chiusura a scomparsa invisibile.',
        320.00,
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
        8,
        true,
        true
    ),
    (
        '22222222-bbbb-2222-bbbb-222222222222',
        'Borsa Tote Sartoriale in Pelle di Vitello',
        'borsa-tote-sartoriale-pelle',
        'Pelle pieno fiore conciata al naturale con fodera in cotone organico e dettagli in oro champagne.',
        460.00,
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85',
        5,
        true,
        true
    ),
    (
        '11111111-aaaa-1111-aaaa-111111111111',
        'Bracciale Rigido Scultoreo in Argento 925',
        'bracciale-rigido-scultoreo',
        'Forma organica forgiata a mano per un riflesso di luce unico, peso calibrato e vestibilità eterea.',
        210.00,
        'https://images.unsplash.com/photo-1611591475155-42e9fba5ce55?auto=format&fit=crop&w=800&q=85',
        12,
        true,
        true
    ),
    (
        '44444444-dddd-4444-dddd-444444444444',
        'Portafoglio Bifold Uomo in Cuoio Nobile',
        'portafoglio-bifold-uomo-cuoio',
        'Cuoio spazzolato a mano, 8 alloggi per carte di credito e doppio scomparto banconote rifinito a cera.',
        135.00,
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=85',
        10,
        true,
        true
    ),
    (
        '33333333-cccc-3333-cccc-333333333333',
        'Borsa a Spalla Mini Baguette in Nappa',
        'borsa-spalla-mini-baguette',
        'Pelle nappa morbidissima color avorio con tracolla rimovibile e chiusura magnetica dorata.',
        340.00,
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=85',
        7,
        true,
        true
    )
ON CONFLICT (slug) DO UPDATE
SET 
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    is_featured = EXCLUDED.is_featured;
