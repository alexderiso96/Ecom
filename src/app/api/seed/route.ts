import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/seed-data';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Devi essere autenticato' }, { status: 401 });
    }

    // Verifica ruolo admin/superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Permessi non sufficienti. Ruolo Admin richiesto.' }, { status: 403 });
    }

    // 1. Inserisci categorie
    const { error: catError } = await supabase
      .from('categories')
      .upsert(DEMO_CATEGORIES, { onConflict: 'id' });

    if (catError) {
      return NextResponse.json({ error: `Errore categorie: ${catError.message}` }, { status: 500 });
    }

    // 2. Inserisci prodotti
    const { error: prodError } = await supabase
      .from('products')
      .upsert(DEMO_PRODUCTS, { onConflict: 'slug' });

    if (prodError) {
      return NextResponse.json({ error: `Errore prodotti: ${prodError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Caricate con successo ${DEMO_CATEGORIES.length} categorie e ${DEMO_PRODUCTS.length} prodotti!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

