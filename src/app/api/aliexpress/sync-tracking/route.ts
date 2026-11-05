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

    // 2. Preleva gli ordini con stato ORDERED in attesa di spedizione
    const BATCH_SIZE = 10;
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, aliexpress_order_id, fulfillment_status, updated_at')
      .eq('fulfillment_status', 'ORDERED')
      .not('aliexpress_order_id', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      throw error;
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'Nessun ordine in attesa di tracking.',
        checkedCount: 0,
        shippedCount: 0,
        durationMs: Date.now() - startTime,
      });
    }

    let shippedCount = 0;
    const trackingLogs: Array<{ orderNumber: string; aliexpressOrderId: string; trackingNumber?: string }> = [];

    // 3. Controlla lo stato logistico su AliExpress per ciascun ordine
    for (const order of orders) {
      if (!order.aliexpress_order_id) continue;

      try {
        const trackingInfo = await aliExpressClient.getOrderInfo(order.aliexpress_order_id);

        if (trackingInfo.isShipped && trackingInfo.trackingNumber) {
          await supabase
            .from('orders')
            .update({
              fulfillment_status: 'SHIPPED',
              tracking_number: trackingInfo.trackingNumber,
              carrier_name: trackingInfo.carrierName || 'AliExpress Standard Shipping',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          shippedCount++;
          trackingLogs.push({
            orderNumber: order.order_number,
            aliexpressOrderId: order.aliexpress_order_id,
            trackingNumber: trackingInfo.trackingNumber,
          });
        } else {
          // Tocca updated_at per ruotare la coda FIFO
          await supabase
            .from('orders')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', order.id);
        }
      } catch (orderErr: any) {
        console.warn(`Errore tracking ordine ${order.order_number}:`, orderErr.message);
      }
    }

    return NextResponse.json({
      status: 'success',
      checkedCount: orders.length,
      shippedCount,
      durationMs: Date.now() - startTime,
      shippedOrders: trackingLogs,
    });
  } catch (err: any) {
    console.error('Errore cron sync tracking:', err);
    return NextResponse.json(
      { error: err.message || 'Errore durante la sincronizzazione del tracking' },
      { status: 500 }
    );
  }
}

