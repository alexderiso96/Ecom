import { createHash } from 'node:crypto';

interface SignedUpload {
  provider: 'cloudinary';
  endpoint: string;
  fields: Record<string, string>;
}

export type ImageUploadTarget = SignedUpload | { provider: 'supabase' };

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
}

export function getCloudinaryConfig(env: Record<string, string | undefined>): CloudinaryConfig | null {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const apiKey = env.CLOUDINARY_API_KEY?.trim() ?? '';
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim() ?? '';
  const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET?.trim() || undefined;

  if (!cloudName && !apiKey && !apiSecret && !uploadPreset) return null;
  const missing = [
    !cloudName && 'CLOUDINARY_CLOUD_NAME',
    !apiKey && 'CLOUDINARY_API_KEY',
    !apiSecret && 'CLOUDINARY_API_SECRET',
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Configurazione Cloudinary incompleta. Variabili mancanti: ${missing.join(', ')}.`);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    throw new Error('CLOUDINARY_CLOUD_NAME non valida. Inserisci solo il nome del cloud, senza URL.');
  }

  return { cloudName, apiKey, apiSecret, uploadPreset };
}

export function signProductImageUpload(config: CloudinaryConfig, id: string, timestamp: number): SignedUpload {
  const params: Record<string, string> = {
    overwrite: 'false',
    public_id: `dream-creation/products/${id}`,
    timestamp: String(timestamp),
  };
  if (config.uploadPreset) params.upload_preset = config.uploadPreset;

  const payload = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  const signature = createHash('sha256').update(payload + config.apiSecret).digest('hex');

  return {
    provider: 'cloudinary',
    endpoint: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    fields: { ...params, api_key: config.apiKey, signature },
  };
}
