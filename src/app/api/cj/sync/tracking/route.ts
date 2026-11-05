import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cjRequest } from '@/lib/cj/client';

export const dynamic = 'force-dynamic';

/**
 * Sync tracking number e stato per ordini in stato ORDERED o PAID
 * GET /api/cj/sync/tracking
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const supabase = getAdminClient();

    // Recupera ordini evasi o pagati ma non ancora spediti
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('id, order_number, cj_order_id, fulfillment_status')
      .in('fulfillment_status', ['ORDERED', 'PAID'])
      .not('cj_order_id', 'is', null)
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const orders = (ordersData || []) as any[];

    if (orders.length === 0) {
      return NextResponse.json({ message: 'Nessun ordine in attesa di tracking' });
    }

    const updatedOrders: string[] = [];

    for (const ord of orders) {
      try {
        const res = await cjRequest<any>(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(ord.cj_order_id!)}`, {
          method: 'GET',
          category: 'order',
        });

        const orderInfo = res.data;
        if (orderInfo && (orderInfo.trackNumber || orderInfo.trackingNumber)) {
          const trackingNumber = orderInfo.trackNumber || orderInfo.trackingNumber;
          const carrier = orderInfo.logisticName || orderInfo.carrierName || null;

          await supabase
            .from('orders')
            .update({
              cj_tracking_number: trackingNumber,
              cj_carrier_name: carrier,
              fulfillment_status: 'SHIPPED',
            })
            .eq('id', ord.id);

          updatedOrders.push(ord.order_number);
        }
      } catch (ordErr: any) {
        console.warn(`[Sync Tracking] Errore verifica ordine ${ord.order_number}:`, ordErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedOrders.length,
      orders: updatedOrders,
    });
  } catch (err: any) {
    console.error('[Sync Tracking] Errore imprevisto:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
