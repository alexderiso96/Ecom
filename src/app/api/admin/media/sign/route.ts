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
    return NextResponse.json({ error: 'Verifica dei permessi temporaneamente non disponibile.' }, { status: 503 });
  }
  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Caricamento riservato agli amministratori.' }, { status: 403 });
  }

  try {
    const config = getCloudinaryConfig(process.env);
    const target: ImageUploadTarget = config
      ? signProductImageUpload(config, randomUUID(), Math.floor(Date.now() / 1000))
      : { provider: 'supabase' };

    return NextResponse.json(target, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Configurazione Cloudinary incompleta o non valida.' }, { status: 503 });
  }
}
