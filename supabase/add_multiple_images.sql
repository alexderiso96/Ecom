-- ==============================================================================
-- MIGRAZIONE: SUPPORTO FOTO MULTIPLE (GALLERIA PRODOTTI)
-- ==============================================================================

-- 1. Aggiungi colonna array 'images' alla tabella products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. Popola retroattivamente 'images' per i prodotti esistenti usando 'image_url' come prima foto
UPDATE public.products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR cardinality(images) = 0);

-- 3. Commento documentale
COMMENT ON COLUMN public.products.images IS 'Galleria completa di immagini del prodotto in formato array di URL';
