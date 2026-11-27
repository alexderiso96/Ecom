/**
 * Modulo di validazione rigoroso e type-safe per input, form e file upload.
 * Protegge da injection, payload sovradimensionati e file malevoli.
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidatedProductInput {
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
}

export interface ValidatedCategoryInput {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Valida i dati di creazione/modifica di un prodotto.
 */
export function validateProductInput(input: {
  name: string;
  slug: string;
  category_id?: string | null;
  description?: string | null;
  price: string | number;
  allowZeroPrice?: boolean;
  stock: string | number;
  image_url?: string | null;
  images?: string[] | null;
  is_featured?: boolean;
  is_active?: boolean;
}): ValidationResult<ValidatedProductInput> {
  const name = (input.name || '').trim();
  if (name.length < 2 || name.length > 120) {
    return {
      success: false,
      error: 'Il nome del prodotto deve contenere tra 2 e 120 caratteri.',
    };
  }

  const slug = (input.slug || '').trim().toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) {
    return {
      success: false,
      error: 'Lo slug non è valido. Usa solo lettere minuscole, numeri e trattini (es. sneakers-urban-black).',
    };
  }
  if (slug.length > 150) {
    return {
      success: false,
      error: 'Lo slug non può superare 150 caratteri.',
    };
  }

  const numericPrice = typeof input.price === 'number' ? input.price : parseFloat(input.price);
  if (isNaN(numericPrice) || !isFinite(numericPrice) || numericPrice < 0 || (!input.allowZeroPrice && numericPrice === 0)) {
    return {
      success: false,
      error: 'Il prezzo deve essere un numero positivo maggiore di zero (es. 29.99).',
    };
  }
  if (numericPrice > 999999) {
    return {
      success: false,
      error: 'Il prezzo supera l\'importo massimo consentito (€999.999).',
    };
  }

  const numericStock = typeof input.stock === 'number' ? input.stock : parseInt(String(input.stock), 10);
  if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
    return {
      success: false,
      error: 'La giacenza (stock) deve essere un numero intero maggiore o uguale a zero.',
    };
  }
  if (numericStock > 100000) {
    return {
      success: false,
      error: 'La giacenza supera la quantità massima consentita (100.000 pezzi).',
    };
  }

  const description = (input.description || '').trim();
  if (description.length > 5000) {
    return {
      success: false,
      error: 'La descrizione non può superare 5.000 caratteri.',
    };
  }

  // Validazione e sanitizzazione della galleria immagini
  const rawImages: string[] = Array.isArray(input.images)
    ? input.images
    : (input.image_url ? [input.image_url] : []);

  const sanitizedImages = rawImages
    .map((img) => (img || '').trim())
    .filter((img) => {
      if (!img || img.length > 2000) return false;
      return (
        img.startsWith('https://') ||
        img.startsWith('/') ||
        img.startsWith('http://localhost')
      );
    });

  let imageUrl = (input.image_url || '').trim();
  if (imageUrl) {
    if (imageUrl.length > 2000) {
      return {
        success: false,
        error: 'L\'URL dell\'immagine è troppo lungo.',
      };
    }
    // Verifica che l'URL sia sicuro (https://, http://localhost o path relativo /...)
    const isSafeUrl =
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('/') ||
      imageUrl.startsWith('http://localhost');
    if (!isSafeUrl) {
      return {
        success: false,
        error: 'L\'URL dell\'immagine deve utilizzare protocollo sicuro HTTPS.',
      };
    }
  } else if (sanitizedImages.length > 0) {
    imageUrl = sanitizedImages[0];
  }

  // Se l'immagine principale non è nell'array galleria, inseriscila come prima
  if (imageUrl && !sanitizedImages.includes(imageUrl)) {
    sanitizedImages.unshift(imageUrl);
  }

  return {
    success: true,
    data: {
      name,
      slug,
      category_id: input.category_id?.trim() || null,
      description: description || null,
      price: Math.round(numericPrice * 100) / 100, // Arrotonda a 2 decimali
      stock: numericStock,
      image_url: imageUrl || null,
      images: sanitizedImages,
      is_featured: Boolean(input.is_featured),
      is_active: Boolean(input.is_active),
    },
  };
}

/**
 * Valida i dati di creazione/modifica di una categoria.
 */
export function validateCategoryInput(input: {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
}): ValidationResult<ValidatedCategoryInput> {
  const name = (input.name || '').trim();
  if (name.length < 2 || name.length > 80) {
    return {
      success: false,
      error: 'Il nome della categoria deve contenere tra 2 e 80 caratteri.',
    };
  }

  const slug = (input.slug || '').trim().toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) {
    return {
      success: false,
      error: 'Lo slug della categoria non è valido. Usa solo lettere minuscole, numeri e trattini.',
    };
  }

  const description = (input.description || '').trim();
  if (description.length > 1000) {
    return {
      success: false,
      error: 'La descrizione non può superare 1.000 caratteri.',
    };
  }

  let imageUrl = (input.image_url || '').trim();
  if (imageUrl && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
    return {
      success: false,
      error: 'L\'URL dell\'immagine della categoria deve utilizzare HTTPS.',
    };
  }

  return {
    success: true,
    data: {
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
    },
  };
}

/**
 * Valida un file immagine prima dell'upload per evitare malware, file sovradimensionati o MIME errati.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Nessun file selezionato.' };
  }

  // 1. Controllo dimensione massima
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Il file selezionato pesa ${sizeMb} MB. La dimensione massima consentita è 5 MB.`,
    };
  }

  // 2. Controllo MIME type reale
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Formato file non supportato. Sono ammesse solo immagini JPG, PNG, WebP o AVIF.',
    };
  }

  // 3. Controllo estensione del file per prevenire spoofing (es: script.php.jpg)
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Estensione del file non valida. Usa file con estensione .jpg, .jpeg, .png, .webp o .avif.',
    };
  }

  return { valid: true };
}
