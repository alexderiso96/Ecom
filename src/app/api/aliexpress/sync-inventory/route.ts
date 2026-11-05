import { NextResponse } from 'next/server';
import { isAuthorizedCronOrAdmin } from '@/lib/aliexpress/auth';
import { aliExpressClient } from '@/lib/aliexpress/client';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby tier timeout

export async function GET(req: Request) {
  const startTime = Date.now();

  // 1. Verifica autenticazione (Header Bearer CRON_SECRET)
  const auth = await isAuthorizedCronOrAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 2. Chunking strategico: preleva i 10 prodotti AliExpress sincronizzati meno di recente
    // per garantire l'esecuzione ampiamente sotto il timeout di 10 secondi di Vercel Hobby
    const BATCH_SIZE = 10;
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, cost_price, markup_percentage, stock, aliexpress_product_id, last_synced_at')
      .not('aliexpress_product_id', 'is', null)
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    if (error) {
      throw error;
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'Nessun prodotto AliExpress trovato da sincronizzare.',
        syncedCount: 0,
        updatedCount: 0,
        durationMs: Date.now() - startTime,
      });
    }

    let updatedCount = 0;
    const syncLogs: Array<{ id: string; name: string; changes: string }> = [];

    // 3. Esegui la verifica per ciascun prodotto
    for (const prod of products) {
      if (!prod.aliexpress_product_id) continue;

      try {
        const info = await aliExpressClient.getProductInfo(prod.aliexpress_product_id);
        const currentCost = Number(prod.cost_price) || 0;
        const newCost = Number(info.costPrice) || currentCost;
        const currentStock = Number(prod.stock) || 0;
        const newStock = Number(info.totalStock) || 0;
        const markup = Number(prod.markup_percentage) || 50;

        const priceChanged = Math.abs(currentCost - newCost) > 0.01;
        const stockChanged = (currentStock > 0 && newStock <= 0) || (currentStock === 0 && newStock > 0);

        const updateData: Record<string, any> = {
          last_synced_at: new Date().toISOString(),
          stock_quantity: newStock,
        };

        let changeDescription = 'Nessuna variazione';

        if (priceChanged) {
          const newRetailPrice = parseFloat((newCost * (1 + markup / 100)).toFixed(2));
          updateData.cost_price = newCost;
          updateData.price = newRetailPrice;
          changeDescription = `Prezzo aggiornato da €${prod.price} a €${newRetailPrice} (costo fornitore: €${newCost})`;
          updatedCount++;
        }

        if (stockChanged) {
          updateData.stock = newStock <= 0 ? 0 : Math.min(newStock, 50);
          changeDescription += ` • Stock aggiornato a ${updateData.stock}`;
          updatedCount++;
        }

        await supabase.from('products').update(updateData).eq('id', prod.id);

        syncLogs.push({
          id: prod.id,
          name: prod.name,
          changes: changeDescription,
        });
      } catch (prodErr: any) {
        console.warn(`Errore sync prodotto ${prod.id} (${prod.name}):`, prodErr.message);
        // Aggiorna comunque last_synced_at per evitare che blocchi sempre il batch
        await supabase
          .from('products')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', prod.id);
      }
    }

    return NextResponse.json({
      status: 'success',
      syncedCount: products.length,
      updatedCount,
      durationMs: Date.now() - startTime,
      logs: syncLogs,
    });
  } catch (err: any) {
    console.error('Errore cron sync inventory:', err);
    return NextResponse.json(
      { error: err.message || 'Errore durante la sincronizzazione dell\'inventario' },
      { status: 500 }
    );
  }
}

