import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkImportCjCategory } from '@/lib/cj/catalog';

export const dynamic = 'force-dynamic';

/**
 * Importazione massiva di una categoria o ricerca da CJdropshipping
 * POST /api/cj/import/bulk
 */
export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const {
      keyword,
      cjCategoryId,
      localCategoryId,
      limit = 20,
      markupPercentage = 40,
    } = body;

    if (!keyword && !cjCategoryId) {
      return NextResponse.json(
        { error: 'Specifica una parola chiave di ricerca o una categoria CJ.' },
        { status: 400 }
      );
    }

    const result = await bulkImportCjCategory({
      keyword: keyword?.trim(),
      cjCategoryId: cjCategoryId?.trim(),
      localCategoryId: localCategoryId || undefined,
      limit: Math.min(Math.max(Number(limit) || 20, 1), 50),
      markupPercentage: Number(markupPercentage) || 40,
    });

    return NextResponse.json({
      success: true,
      message: `Importazione completata: ${result.importedCount} prodotti importati con successo!`,
      result,
    });
  } catch (error: any) {
    console.error('[API CJ Bulk Import] Errore:', error);
    return NextResponse.json(
      { error: error?.message || 'Errore durante l\'importazione di massa.' },
      { status: 500 }
    );
  }
}

