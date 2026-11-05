import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cjRequest } from '@/lib/cj/client';

export const dynamic = 'force-dynamic';

/**
 * Batch inventory and price sync per varianti collegate a CJdropshipping
 * GET /api/cj/sync/inventory
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const supabase = getAdminClient();

    // Recupera le varianti più vecchie da sincronizzare (chunk di 25 per evitare timeout serverless)
    const { data: variantsData, error } = await supabase
      .from('product_variants')
      .select('id, cj_variant_id, cost_price, stock, product_id, products (markup_percentage)')
      .not('cj_variant_id', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(25);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const variants = (variantsData || []) as any[];

    if (variants.length === 0) {
      return NextResponse.json({ message: 'Nessuna variante da sincronizzare' });
    }

    const updatedVariants: string[] = [];

    for (const v of variants) {
      try {
        // Query stock su CJ
        const res = await cjRequest<any>(`/product/stock/query?vid=${encodeURIComponent(v.cj_variant_id!)}`, {
          method: 'GET',
          category: 'catalog',
        });

        if (res.data && (res.data.inventory !== undefined || res.data.stock !== undefined)) {
          const newStock = Number(res.data.inventory ?? res.data.stock) || 0;
          await supabase
            .from('product_variants')
            .update({
              stock: newStock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', v.id);

          updatedVariants.push(v.cj_variant_id!);
        }
      } catch (syncErr: any) {
        console.warn(`[Sync Inventory] Errore sync per vid ${v.cj_variant_id}:`, syncErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: updatedVariants.length,
      syncedVids: updatedVariants,
    });
  } catch (err: any) {
    console.error('[Sync Inventory] Errore imprevisto:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
