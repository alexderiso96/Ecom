-- ==============================================================================
-- SEED DATA BULK: E-COMMERCE AURA STORE
-- Piattaforma: Supabase (PostgreSQL)
-- Descrizione: Popolamento massivo di Categorie e Prodotti realistici
-- Istruzioni: Incolla ed esegui nel SQL Editor di Supabase
-- ==============================================================================

-- 1. POPOLAMENTO CATEGORIE (8 Categorie distinte)
INSERT INTO public.categories (id, name, slug, description, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Abbigliamento & Streetwear', 'abbigliamento', 'Capi contemporanei realizzati in cotone biologico e tessuti tecnici ad alte prestazioni.', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'),
('22222222-2222-2222-2222-222222222222', 'Accessori & Pelletteria', 'accessori', 'Borse, zaini e piccoli accessori in pelle pregiata e materiali sostenibili di altissima finitura.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'),
('33333333-3333-3333-3333-333333333333', 'Tech & Audio Hi-Fi', 'tech-audio', 'Dispositivi audio professionali, periferiche ergonomiche e gadget dal design industriale minimalista.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'),
('44444444-4444-4444-4444-444444444444', 'Home & Living Design', 'home-living', 'Elementi di illuminazione, complementi d’arredo moderni e oggetti d’autore per la casa contemporanea.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'),
('55555555-5555-5555-5555-555555555555', 'Orologi & Gioielleria', 'orologi-gioielli', 'Orologeria di precisione con casse in titanio, movimenti automatici e gioielli in argento 925.', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'),
('66666666-6666-6666-6666-666666666666', 'Sport & Outdoor', 'sport-outdoor', 'Attrezzatura performante per trekking, fitness e vita all’aria aperta resistente alle intemperie.', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'),
('77777777-7777-7777-7777-777777777777', 'Beauty & Cura Personale', 'beauty-care', 'Fragranze di nicchia e formule botaniche organiche per la cura quotidiana di pelle e barba.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'),
('88888888-8888-8888-8888-888888888888', 'Gourmet & Specialty Coffee', 'gourmet-coffee', 'Accessori per l’estrazione del caffè artigianale e selezioni di monorigini arabica premium.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- 2. POPOLAMENTO PRODOTTI (30 Prodotti suddivisi per categoria con prezzi, stock e immagini)
INSERT INTO public.products (category_id, name, slug, description, price, image_url, stock, is_featured, is_active) VALUES

-- Categoria 1: Abbigliamento & Streetwear
('11111111-1111-1111-1111-111111111111', 
 'Giacca a Vento Modulare Techwear', 
 'giacca-vento-modulare', 
 'Impermeabilità 20.000 mm colonne d''acqua, membrana antivento a 3 strati traspirante e cappuccio ergonomico termonastrato rimovibile.', 
 189.50, 
 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80', 
 18, TRUE, TRUE),

('11111111-1111-1111-1111-111111111111', 
 'Felpa Organica Oversize Heavyweight', 
 'felpa-organica-oversize', 
 '100% cotone organico pettinato certificato GOTS con grammatura 450 GSM. Vestibilità boxy contemporanea con finiture a costine rinforzate.', 
 85.00, 
 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80', 
 45, FALSE, TRUE),

('11111111-1111-1111-1111-111111111111', 
 'T-Shirt Essential Cotone Pima Mercerizzato', 
 't-shirt-essential-cotone-pima', 
 'Fibra di cotone Pima a fibra extra-lunga dalla mano setosa e brillantezza naturale. Resistente ai lavaggi frequenti senza restringimento.', 
 39.00, 
 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 
 60, FALSE, TRUE),

('11111111-1111-1111-1111-111111111111', 
 'Pantalone Cargo Tapered Idrorepellente', 
 'pantalone-cargo-tapered', 
 'Tessuto ripstop elasticizzato in 4 direzioni trattato DWR. 6 tasche multifunzione con zip coperte e caviglie regolabili con coulisse.', 
 129.00, 
 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80', 
 22, FALSE, TRUE),

-- Categoria 2: Accessori & Pelletteria
('22222222-2222-2222-2222-222222222222', 
 'Zaino Minimalista Urban Waterproof', 
 'zaino-minimalista-urban', 
 'Tessuto in poliestere riciclato impermeabile, scomparto imbottito per laptop fino a 16" e tasca posteriore antifurto con schermatura RFID.', 
 119.00, 
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', 
 35, TRUE, TRUE),

('22222222-2222-2222-2222-222222222222', 
 'Portafoglio Slim in Pelle Saffiano', 
 'portafoglio-slim-saffiano', 
 'Vera pelle conciata al vegetale con texture Saffiano antigraffio. Alloggio rapido per 8 carte di credito e banconote.', 
 59.00, 
 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80', 
 28, FALSE, TRUE),

('22222222-2222-2222-2222-222222222222', 
 'Occhiali da Sole Polarizzati Tartaruga', 
 'occhiali-sole-polarizzati', 
 'Montatura artigianale in bio-acetato italiano di cellulosa con lenti Carl Zeiss polarizzate categoria 3 e protezione UV400 completa.', 
 145.00, 
 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80', 
 14, TRUE, TRUE),

('22222222-2222-2222-2222-222222222222', 
 'Borsa Duffle Weekend Canvas & Cuoio', 
 'borsa-duffle-weekend', 
 'Capacità 45 litri, tela pesante di cotone cerato da 18oz e rinforzi in cuoio pieno fiore. Perfetta per viaggi brevi o cabina aereo.', 
 179.00, 
 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80', 
 8, FALSE, TRUE),

-- Categoria 3: Tech & Audio Hi-Fi
('33333333-3333-3333-3333-333333333333', 
 'Cuffie Wireless Hi-Fi Studio Pro', 
 'cuffie-wireless-hi-fi-studio-pro', 
 'Cancellazione attiva del rumore ibrida (ANC a -42dB), codec aptX HD a bassa latenza, driver da 40mm in berillio e autonomia di 40 ore.', 
 249.99, 
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 
 25, TRUE, TRUE),

('33333333-3333-3333-3333-333333333333', 
 'Diffusore Bluetooth Portatile Alluminio IP67', 
 'diffusore-bluetooth-alluminio', 
 'Scocca unibody in alluminio sabbiato con radiatori passivi doppi per bassi potenti a 360 gradi. Impermeabile totale e galleggiante.', 
 139.00, 
 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80', 
 19, FALSE, TRUE),

('33333333-3333-3333-3333-333333333333', 
 'Tastiera Meccanica Wireless 75% Custom', 
 'tastiera-meccanica-wireless-75', 
 'Switch lineari lubrificati a mano, keycaps PBT doubleshot a profilo Cherry, connessione tri-mode (2.4GHz, Bluetooth 5.2 e cavo Type-C).', 
 169.00, 
 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80', 
 12, TRUE, TRUE),

('33333333-3333-3333-3333-333333333333', 
 'Supporto Ergonomico per Laptop in Alluminio Anodizzato', 
 'supporto-laptop-alluminio', 
 'Design ventilato ripiegabile con cuscinetti in silicone antiscivolo. Compatibile con MacBook e portatili da 11 a 17 pollici.', 
 49.90, 
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80', 
 50, FALSE, TRUE),

('33333333-3333-3333-3333-333333333333', 
 'Microfono USB a Condensatore Studio Broadcast', 
 'microfono-usb-condensatore', 
 'Capsula cardioide a 24-bit/96kHz per podcast, streaming e registrazioni vocali con monitoraggio cuffie a latenza zero.', 
 109.00, 
 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80', 
 3, FALSE, TRUE), -- Esempio prodotto con scorte quasi esaurite

-- Categoria 4: Home & Living Design
('44444444-4444-4444-4444-444444444444', 
 'Lampada da Tavolo Architettonica LED Dimmerabile', 
 'lampada-tavolo-led-dimmerabile', 
 'Braccio snodabile in alluminio estruso con dimmer touch a sfioramento continuo e selezione gradazione luce da 2700K a 5000K.', 
 89.00, 
 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80', 
 24, TRUE, TRUE),

('44444444-4444-4444-4444-444444444444', 
 'Diffusore di Aromi ad Ultrasuoni in Ceramica e Legno', 
 'diffusore-aromi-ultrasuoni', 
 'Copertura artigianale in ceramica opaca con base in legno massello di rovere. Timer programmabile e luce calda d''atmosfera.', 
 65.00, 
 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80', 
 17, FALSE, TRUE),

('44444444-4444-4444-4444-444444444444', 
 'Set Tazze in Ceramica Raku Fatte a Mano (4pz)', 
 'set-tazze-ceramica-raku', 
 'Pezzi unici cotti a legna con smalti minerali reattivi. Resistenti a lavastoviglie e microonde, perfette per tè e cappuccini.', 
 52.00, 
 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80', 
 15, FALSE, TRUE),

('44444444-4444-4444-4444-444444444444', 
 'Vaso Scultoreo Geometrico in Resina Materica', 
 'vaso-scultoreo-geometrico', 
 'Silhouette audace d''ispirazione brutalista con finitura grezza al tatto. Adatto a composizioni floreali secche o fresche.', 
 74.00, 
 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=900&q=80', 
 0, FALSE, TRUE), -- Esempio prodotto esaurito (stock = 0) per testare il badge Esaurito

-- Categoria 5: Orologi & Gioielleria
('55555555-5555-5555-5555-555555555555', 
 'Orologio Cronografo Titanio Stealth', 
 'orologio-cronografo-titanio-stealth', 
 'Cassa da 41mm in titanio grado aerospaziale 5 sabbiato, vetro zaffiro antiriflesso a doppia curvatura e movimento al quarzo ad alta precisione.', 
 340.00, 
 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80', 
 11, TRUE, TRUE),

('55555555-5555-5555-5555-555555555555', 
 'Orologio Automatico Subacqueo 200m Diver', 
 'orologio-automatico-subacqueo-200m', 
 'Calibro meccanico a carica automatica con riserva di carica di 41 ore. Lunetta girevole unidirezionale in ceramica lucida e indici Super-LumiNova.', 
 420.00, 
 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80', 
 6, TRUE, TRUE),

('55555555-5555-5555-5555-555555555555', 
 'Bracciale Minimal Maglia Veneziana Acciaio 316L', 
 'bracciale-maglia-acciaio-316l', 
 'Acciaio inossidabile anallergico chirurgico con trattamento PVD nero opaco resistente a graffi e usura quotidiana.', 
 45.00, 
 'https://images.unsplash.com/photo-1611591475155-4282feedba29?auto=format&fit=crop&w=900&q=80', 
 30, FALSE, TRUE),

-- Categoria 6: Sport & Outdoor
('66666666-6666-6666-6666-666666666666', 
 'Borraccia Termica Sottovuoto in Acciaio 750ml', 
 'borraccia-termica-acciaio-750ml', 
 'Doppia parete coibentata con isolamento sottovuoto: mantiene fredde le bevande per 24 ore e calde per 12 ore. Tappo a tenuta stagna al 100%.', 
 34.90, 
 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80', 
 42, FALSE, TRUE),

('66666666-6666-6666-6666-666666666666', 
 'Tappetino Yoga Professionale Gomma Naturale', 
 'tappetino-yoga-gomma-naturale', 
 'Spessore 5mm ad alta densità per protezione articolare e superficie testurizzata ultra-grippante anti-sudore non tossica biodegradabile.', 
 69.00, 
 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=900&q=80', 
 20, FALSE, TRUE),

('66666666-6666-6666-6666-666666666666', 
 'Torcia Frontale LED Ricaricabile 1200 Lumen', 
 'torcia-frontale-led-1200', 
 'Fascio luminoso fino a 150 metri, ricarica rapida USB-C, 5 modalità d''illuminazione con luce rossa di sicurezza per trail e campeggio notturno.', 
 55.00, 
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 
 16, FALSE, TRUE),

-- Categoria 7: Beauty & Cura Personale
('77777777-7777-7777-7777-777777777777', 
 'Eau de Parfum Botanico "Velvet Cedar" 100ml', 
 'eau-de-parfum-velvet-cedar', 
 'Composizione olfattiva artigianale con note di testa di bergamotto calabrese, cuore di pepe nero e fondo di legno di cedro e vetiver affumicato.', 
 95.00, 
 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80', 
 18, TRUE, TRUE),

('77777777-7777-7777-7777-777777777777', 
 'Olio da Barba Biologico Nutriente 50ml', 
 'olio-barba-biologico-50ml', 
 'Miscela ricca di olio di argan marocchino, jojoba e mandorle dolci arricchita con vitamina E naturale per una barba morbida e pelle idratata.', 
 26.50, 
 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=900&q=80', 
 35, FALSE, TRUE),

('77777777-7777-7777-7777-777777777777', 
 'Siero Idratante Viso con Acido Ialuronico & Niacinamide', 
 'siero-idratante-viso-acido-ialuronico', 
 'Formula idratante ad assorbimento immediato ad azione rimpolpante per migliorare la luminosità e l''elasticità cutanea.', 
 42.00, 
 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80', 
 25, FALSE, TRUE),

-- Categoria 8: Gourmet & Specialty Coffee
('88888888-8888-8888-8888-888888888888', 
 'Caffettiera Manuale Pour-Over in Vetro Borosilicato', 
 'caffettiera-pour-over-vetro', 
 'Brocca in vetro termico graduata da 800ml con collare in legno naturale e filtro riutilizzabile a doppio strato in acciaio inox micro-traforato.', 
 38.00, 
 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80', 
 21, TRUE, TRUE),

('88888888-8888-8888-8888-888888888888', 
 'Chicchi di Caffè Monorigine Etiopia Yirgacheffe 250g', 
 'caffe-monorigine-etiopia-yirgacheffe', 
 '100% Arabica Specialty tostato artigianale per filtro ed espresso. Note floreali di gelsomino, bergamotto e miele d''agrumi.', 
 16.50, 
 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=900&q=80', 
 40, FALSE, TRUE),

('88888888-8888-8888-8888-888888888888', 
 'Macinacaffè Manuale con Macine Coniche in Ceramica', 
 'macinacaffe-manuale-ceramica', 
 'Corpo in alluminio spazzolato con selettore micrometrico per regolare con precisione la macinatura da moka a cold brew.', 
 62.00, 
 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=900&q=80', 
 15, FALSE, TRUE)

ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  stock = EXCLUDED.stock,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

