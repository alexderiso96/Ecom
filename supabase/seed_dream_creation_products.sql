-- Catalogo dimostrativo Dream Creation. Eseguire dopo dream_creation_checkout.sql.
-- Prezzi, disponibilità e opzioni sono esempi da verificare prima di usare il catalogo pubblico.
-- Il prefisso demo-dream-creation- identifica gli esempi. Una nuova esecuzione
-- aggiunge gli esempi mancanti e aggiorna le copertine della versione precedente.
-- Le copertine personalizzate e gli altri dati già modificati vengono conservati.

BEGIN;

INSERT INTO public.categories (name, slug, description) VALUES
  ('Ombrelli', 'ombrelli', 'Ombrelli da personalizzare con iniziali.'),
  ('Pochette', 'pochette', 'Pochette e idee regalo personalizzate.'),
  ('Bijoux', 'gioielli', 'Orecchini, collane e bracciali.'),
  ('Tazze', 'tazze', 'Tazze da personalizzare.')
ON CONFLICT (slug) DO NOTHING;

WITH examples (
  category_slug, name, slug, description, personalization, image_url, previous_image_url,
  price, stock, is_featured, quote_required
) AS (
  VALUES
    ('ombrelli', 'Ombrello con iniziali dorate', 'demo-dream-creation-ombrello-iniziali',
      'Ombrello pieghevole con iniziali ricamate, da portare in borsa o regalare.',
      'Indica le iniziali nelle note. Chiedici su WhatsApp quali colori sono disponibili.',
      '/dream-creation/demo/ombrello.jpg', '/dream-creation/ombrelli.jpg', 29.00, 8, true, false),
    ('pochette', 'Pochette nera con monogramma', 'demo-dream-creation-pochette-monogramma',
      'Pochette nera con cerniera e un’iniziale dorata. Ideale per raccogliere piccoli accessori.',
      'Scegli l’iniziale e scrivila nelle note dell’ordine.',
      '/dream-creation/demo/pochette.jpg', '/dream-creation/ricami.jpg', 19.00, 12, true, false),
    ('gioielli', 'Orecchini ovali colorati', 'demo-dream-creation-orecchini-ovali',
      'Orecchini ovali con finitura dorata e inserto colorato.',
      'Scrivici per verificare la disponibilità delle tonalità prima di ordinare.',
      '/dream-creation/demo/orecchini.jpg', '/dream-creation/bijoux.jpg', 16.00, 10, true, false),
    ('tazze', 'Tazza con dedica', 'demo-dream-creation-tazza-dedica',
      'Tazza chiara da regalare con una breve frase o con il nome di chi la riceve.',
      'Inserisci il nome o la dedica nelle note. Confermeremo l’impaginazione su WhatsApp.',
      '/dream-creation/demo/tazza.jpg', '/dream-creation/tazze.jpg', 15.00, 10, true, false),
    ('pochette', 'Pochette coordinate per cerimonia', 'demo-dream-creation-pochette-cerimonia',
      'Un set di pochette abbinate per testimoni, damigelle o invitate.',
      'Indicaci il numero di pezzi, le iniziali e la data della cerimonia.',
      '/dream-creation/demo/cerimonia.jpg', NULL, 0.00, 0, false, true),
    ('tazze', 'Tazze personalizzate per eventi', 'demo-dream-creation-tazze-evento',
      'Una serie di tazze personalizzate per una festa, un gruppo o un piccolo evento.',
      'Indicaci il numero di tazze, i nomi o la frase da ripetere e la data di consegna desiderata.',
      '/dream-creation/demo/evento.jpg', NULL, 0.00, 0, false, true)
),
inserted AS (
  INSERT INTO public.products (
    category_id, name, slug, description, personalization, image_url, images,
    price, stock, is_featured, is_active, quote_required
  )
  SELECT categories.id, examples.name, examples.slug, examples.description,
    examples.personalization, examples.image_url,
    ARRAY[examples.image_url],
    examples.price, examples.stock, examples.is_featured, true, examples.quote_required
  FROM examples
  JOIN public.categories ON categories.slug = examples.category_slug
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
),
updated AS (
  UPDATE public.products AS products
  SET image_url = examples.image_url,
      images = CASE
        WHEN examples.previous_image_url = ANY(products.images)
          THEN array_replace(products.images, examples.previous_image_url, examples.image_url)
        ELSE array_prepend(examples.image_url, COALESCE(products.images, ARRAY[]::text[]))
      END
  FROM examples
  WHERE products.slug = examples.slug
    AND products.image_url IS NOT DISTINCT FROM examples.previous_image_url
    AND (examples.previous_image_url IS NOT NULL OR COALESCE(cardinality(products.images), 0) = 0)
  RETURNING products.id
)
SELECT
  (SELECT count(*) FROM inserted) AS prodotti_demo_inseriti,
  (SELECT count(*) FROM updated) AS immagini_demo_aggiornate;

COMMIT;
