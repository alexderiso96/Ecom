# Foto del catalogo su Cloudinary

Dream Creation supporta il caricamento firmato su Cloudinary da **Admin → Prodotti**. Il server controlla la sessione e il ruolo Supabase, poi firma il caricamento. Il browser invia il file direttamente a Cloudinary. Quando salvi il prodotto, Supabase conserva gli URL HTTPS in `products.image_url` e `products.images`.

## Configurazione

1. Nella console Cloudinary apri **Settings → API Keys**. Recupera **Cloud Name**, **API Key** e **API Secret** per l’ambiente che deve ospitare le immagini.
2. Imposta le tre variabili in `.env.local` per lo sviluppo oppure nelle variabili server dell’hosting per il sito online.

   ```dotenv
   CLOUDINARY_CLOUD_NAME=il-tuo-cloud-name
   CLOUDINARY_API_KEY=la-tua-api-key
   CLOUDINARY_API_SECRET=il-tuo-api-secret
   ```

3. Facoltativamente, in **Settings → Upload → Upload presets** crea un preset **Signed** e impostane il nome in `CLOUDINARY_UPLOAD_PRESET`. Puoi usarlo per definire i formati ammessi e le trasformazioni di ingresso. L’app accetta JPG, PNG, WebP e AVIF fino a 5 MB per file. Gli upload usano identificativi univoci con prefisso `dream-creation/products/`.
4. Riavvia il server locale o esegui un nuovo deploy. Da **Admin → Prodotti** carica una foto, salva il prodotto e controlla che lo stesso URL `https://res.cloudinary.com/…` compaia nella galleria.

L’API Secret resta sul server. Mantienilo fuori da Git e dalle variabili con prefisso `NEXT_PUBLIC_`. [Documentazione Cloudinary sugli upload](https://cloudinary.com/documentation/upload_images)

## Foto esistenti e caricamenti

- Senza configurazione Cloudinary, gli upload passano dal bucket Supabase `products-images`. Una configurazione parziale mostra un errore nel pannello.
- Gli URL già salvati e i percorsi delle immagini pubblicate con il sito continuano a funzionare. Per spostare una foto esistente, caricala su Cloudinary e sostituisci il suo URL nella galleria.
- Rimuovere una foto dal prodotto scollega l’URL. Gli asset restano disponibili nella Media Library di Cloudinary o nel bucket originale.
