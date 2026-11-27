import type { ImageUploadTarget } from './cloudinary';

type SignedUpload = Extract<ImageUploadTarget, { provider: 'cloudinary' }>;

export async function uploadCloudinaryImage(file: File, target: SignedUpload): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  Object.entries(target.fields).forEach(([key, value]) => form.append(key, value));

  let response: Response;
  try {
    response = await fetch(target.endpoint, { method: 'POST', body: form });
  } catch {
    throw new Error('Il browser non è riuscito a contattare Cloudinary. Controlla la connessione e riprova.');
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = result?.error?.message ?? response.headers.get('x-cld-error');
    // Some signature errors include the entire string used to sign the request.
    const reason = typeof detail === 'string'
      ? detail.split(/\s*string to sign/i)[0].trim().slice(0, 220)
      : '';
    throw new Error(reason
      ? `Cloudinary (HTTP ${response.status}): ${reason}`
      : `Cloudinary ha rifiutato il file (HTTP ${response.status}).`);
  }

  if (typeof result?.secure_url !== 'string' || !result.secure_url.startsWith('https://')) {
    throw new Error('Cloudinary ha risposto senza un URL immagine HTTPS.');
  }
  return result.secure_url;
}
