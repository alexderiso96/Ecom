# 📸 Guida: Hosting Immagini Esterno su Cloudinary (Zero Memoria su Supabase)

Questo documento descrive l'architettura, la configurazione e i passaggi di codice per salvare le foto dei prodotti su **Cloudinary** invece che su Supabase Storage.

---

## 🎯 1. Perché Questa Integrazione?

### Il Problema
Sul piano gratuito di **Supabase**:
* Lo **Storage totale è limitato a 1 GB**.
* La **Banda in uscita è limitata a 5 GB/mese**.
Con foto catalogo ad alta risoluzione (1–3 MB l'una), lo spazio e la banda si esauriscono in pochissimo tempo.

### La Soluzione
Spostare il salvataggio dei file binari delle foto su un servizio esterno specializzato (**Cloudinary**) e salvare nel database Supabase **esclusivamente la stringa URL dell'immagine** (`https://res.cloudinary.com/...`).

* **Spazio occupato su Supabase Storage**: **0 MB** (azzerato!).
* **Spazio occupato su Postgres**: ~60 byte per riga (un normale campo di testo).
* **Piano gratuito Cloudinary**: **25 crediti al mese gratuiti** (~25 GB di spazio o banda), con conversione automatica e gratuita in formati moderni e leggeri (**WebP** e **AVIF**).

---

## 🏗️ 2. Architettura del Flusso

```
[ 1. Admin - Selezione File ]
             │
             ├─► Invia il file direttamente a Cloudinary (via Unsigned Upload Preset)
             │
             ▼
[ 2. Cloudinary Global CDN ]
             │
             ├─► Salva e comprime la foto in WebP/AVIF
             ├─► Restituisce l'URL sicuro HTTPS (es. https://res.cloudinary.com/.../scarpa.webp)
             │
             ▼
[ 3. Admin Panel Next.js ]
             │
             ├─► Invia la query a Supabase:
             │   INSERT INTO products (name, price, image_url)
             │   VALUES ('Sneakers', 99.00, 'https://res.cloudinary.com/.../scarpa.webp');
             │
             ▼
[ 4. Database Supabase ]
             │
             └─► Memorizza solo la stringa di testo nel campo `image_url` (0 MB Storage)
```

---

## ⚙️ 3. Passaggi di Configurazione su Cloudinary (Una Tantum)

### Passo 1: Registrazione Gratuita
1. Vai su [cloudinary.com](https://cloudinary.com) e crea un account gratuito.
2. Dalla **Dashboard principale**, individua e copia il tuo **Cloud Name** (es. `dxy123abc`).

### Passo 2: Creare l'Upload Preset "Unsigned"
L'upload preset non firmato (Unsigned) permette al browser dell'admin di caricare le foto direttamente a Cloudinary in totale sicurezza senza esporre le chiavi segrete API secret:
1. In Cloudinary, clicca sull'icona a forma di ingranaggio (**Settings**) in basso a sinistra.
2. Vai nella scheda **Upload** (nel menu laterale).
3. Scorri fino alla sezione **Upload presets** e clicca su **Add upload preset**.
4. Configura i seguenti parametri:
   * **Upload preset name**: inserisci `aura_products` (o un nome a piacere).
   * **Signing Mode**: seleziona **Unsigned** (⚠️ fondamentale!).
   * **Folder**: inserisci `products` (per organizzare tutte le foto in una cartella pulita).
   * **Incoming Transformation** *(opzionale ma consigliato)*: puoi impostare qualità automatica (`q_auto`) e formato automatico (`f_auto`).
5. Clicca sul pulsante **Save** in alto a destra.

---

## 🔑 4. Variabili d'Ambiente (`.env.local`)

Aggiungere al file `.env.local` del progetto:

```env
# Cloudinary Media Storage (Free tier - 0 MB usati su Supabase)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tuo_cloud_name_qui
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=aura_products
```

---

## 💻 5. Codice dell'Integrazione (Da applicare in futuro)

### A. File Helper: `src/lib/cloudinary.ts`

Creare il file [src/lib/cloudinary.ts](src/lib/cloudinary.ts):

```typescript
export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  error?: string;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  return Boolean(cloudName && uploadPreset && cloudName.trim() !== '' && uploadPreset.trim() !== '');
}

/**
 * Carica un file immagine direttamente dal browser a Cloudinary
 */
export async function uploadToCloudinary(file: File, folder = 'products'): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    return {
      success: false,
      error: 'Variabili Cloudinary non configurate in .env.local',
    };
  }

  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Il file selezionato non è un\'immagine valida.',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || `Errore HTTP durante upload (${response.status})`,
      };
    }

    return {
      success: true,
      url: data.secure_url || data.url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore di rete durante upload su Cloudinary.',
    };
  }
}
```

---

### B. Modifica in `src/app/admin/products/page.tsx`

Nel componente admin dei prodotti, sostituire la funzione `handleFileUpload`:

```typescript
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

// ... all'interno del componente:

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingFile(true);
  setErrorMsg(null);

  try {
    if (isCloudinaryConfigured()) {
      // 1. Carica su Cloudinary (0 MB su Supabase Storage)
      const result = await uploadToCloudinary(file);
      if (!result.success || !result.secureUrl) {
        throw new Error(result.error || 'Errore caricamento su Cloudinary');
      }
      setImageUrl(result.secureUrl);
    } else {
      // 2. Fallback su Supabase Storage se le env non sono ancora impostate
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('products-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrlData.publicUrl);
    }
  } catch (err: any) {
    setErrorMsg(`Errore upload file: ${err.message}`);
  } finally {
    setUploadingFile(false);
  }
};
```

---

## 🌐 6. Compatibilità con Next.js Image

Il file [next.config.mjs](next.config.mjs) del progetto include già la direttiva:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',
    },
  ],
}
```
Pertanto, **tutte le immagini caricate su Cloudinary vengono automaticamente renderizzate e ottimizzate da `<Image />` senza dover modificare nulla nel frontend o nelle pagine catalogo**.

---

## 🗑️ 7. Gestione Eliminazione Immagini (Opzionale)

Quando un prodotto viene eliminato da Supabase:
* Con **25 GB gratuiti** su Cloudinary, non è obbligatorio cancellare subito il file fisico.
* Se si desidera la pulizia istantanea dei file obsoleti, è sufficiente creare una route API protetta Next.js `/api/admin/media/delete` che, tramite le credenziali private `CLOUDINARY_API_SECRET`, esegua la chiamata:
  ```typescript
  import { v2 as cloudinary } from 'cloudinary';
  await cloudinary.uploader.destroy(publicId);
  ```

---

## 📌 Riepilogo

| Caratteristica | Con Supabase Storage | Con Integrazione Cloudinary |
| :--- | :--- | :--- |
| **Spazio Storage su Supabase** | Si consuma rapidamente (max 1 GB) | **0 MB consumati** |
| **Banda utilizzata su Supabase** | Max 5 GB/mese | **0 GB utilizzati** |
| **Compressione WebP/AVIF** | Manuale | **Automatica e istantanea** |
| **Costo** | Gratuito fino a 1 GB, poi a pagamento | **100% Gratuito (fino a 25 GB/mese)** |
