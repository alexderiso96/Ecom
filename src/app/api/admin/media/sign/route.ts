import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCloudinaryConfig, signProductImageUpload, type ImageUploadTarget } from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Accedi per caricare immagini.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Ruolo upload immagini non verificabile', { code: profileError.code });
    return NextResponse.json({
      code: 'MEDIA_PROFILE_LOOKUP_FAILED',
      error: 'Supabase non ha potuto verificare il ruolo per il caricamento delle immagini.',
    }, { status: 503 });
  }
  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Caricamento riservato agli amministratori.' }, { status: 403 });
  }

  let config: ReturnType<typeof getCloudinaryConfig>;
  try {
    config = getCloudinaryConfig(process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Configurazione Cloudinary non valida.';
    console.error('Configurazione upload immagini non valida', { message });
    return NextResponse.json({ code: 'MEDIA_CLOUDINARY_CONFIG', error: message }, { status: 503 });
  }

  const target: ImageUploadTarget = config
    ? signProductImageUpload(config, randomUUID(), Math.floor(Date.now() / 1000))
    : { provider: 'supabase' };

  return NextResponse.json(target, { headers: { 'Cache-Control': 'no-store' } });
}
