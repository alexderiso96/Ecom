-- Eseguire nel SQL Editor del progetto Supabase da svuotare.
-- Elimina tutti i prodotti, inclusi quelli inattivi.
-- Lo storico conserva i dettagli degli articoli. I riferimenti ai prodotti
-- eliminati diventano NULL tramite il vincolo ON DELETE SET NULL.
-- Le categorie e i file nel bucket products-images restano disponibili.

BEGIN;

WITH deleted_products AS (
  DELETE FROM public.products
  RETURNING id
)
SELECT count(*) AS prodotti_eliminati
FROM deleted_products;

COMMIT;
