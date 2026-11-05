import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { importCjProduct } from '@/lib/cj/catalog';

export const dynamic = 'force-dynamic';

/**
 * Estrae il PID da una stringa che può essere un ID numerico o un URL di CJdropshipping
 */
function extractCjProductId(input: string): string {
  const cleaned = input.trim();
  // Se è un URL come https://cjdropshipping.com/product/xxx-p-12345.html o simile
  const match = cleaned.match(/([a-zA-Z0-9_-]{10,})/);
  if (match) {
    return match[1];
  }
  return cleaned;
}

/**
 * Importa un prodotto con varianti da CJdropshipping su Supabase
 * POST /api/cj/import
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verifica che l'utente sia autenticato come admin o superadmin
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profile = profileData as { role?: string } | null;

    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    // 2. Lettura parametri
    const body = await req.json();
    const { cjProductIdOrUrl, categoryId, markupPercentage = 40 } = body;

    if (!cjProductIdOrUrl) {
      return NextResponse.json(
        { error: 'Inserisci il PID o il link del prodotto CJdropshipping.' },
        { status: 400 }
      );
    }

    const pid = extractCjProductId(cjProductIdOrUrl);

    // 3. Importazione del prodotto e delle sue varianti
    const importedProduct = await importCjProduct(
      pid,
      categoryId || undefined,
      Number(markupPercentage) || 40
    );

    return NextResponse.json({
      success: true,
      product: importedProduct,
      message: `Prodotto "${importedProduct.name}" importato con successo da CJdropshipping!`,
    });
  } catch (error: any) {
    console.error('[API CJ Import] Errore:', error);
    return NextResponse.json(
      { error: error?.message || 'Errore durante l\'importazione da CJdropshipping.' },
      { status: 500 }
    );
  }
}

