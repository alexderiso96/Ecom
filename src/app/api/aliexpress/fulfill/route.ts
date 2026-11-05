import { NextResponse } from 'next/server';
import { isAuthorizedCronOrAdmin } from '@/lib/aliexpress/auth';
import { aliExpressClient } from '@/lib/aliexpress/client';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. Verifica autorizzazione (Bearer CRON_SECRET o Admin Session)
  const auth = await isAuthorizedCronOrAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Parametro "orderId" obbligatorio.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 2. Recupera l'ordine con gli articoli collegati
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: `Ordine ${orderId} non trovato nel database.` }, { status: 404 });
    }

    // 3. Controllo Idempotenza: Se l'ordine è già stato inoltrato o spedito, non duplicarlo
    if (order.fulfillment_status === 'ORDERED' || order.fulfillment_status === 'SHIPPED') {
      return NextResponse.json({
        success: true,
        alreadyFulfilled: true,
        message: `L'ordine è già stato inoltrato ad AliExpress con ID: ${order.aliexpress_order_id}`,
        aliexpressOrderId: order.aliexpress_order_id,
        status: order.fulfillment_status,
      });
    }

    const items = order.order_items || [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'L\'ordine non contiene articoli da evadere.' }, { status: 400 });
    }

    // 4. Mappatura payload per AliExpress Open Platform
    const aliItems = items
      .filter((item: any) => item.aliexpress_product_id)
      .map((item: any) => ({
        productId: item.aliexpress_product_id,
        skuId: item.aliexpress_sku_id || undefined,
        quantity: item.quantity,
      }));

    if (aliItems.length === 0) {
      return NextResponse.json(
        { error: 'Nessun articolo nell\'ordine è collegato a un prodotto fornitore AliExpress.' },
        { status: 400 }
      );
    }

    // Parsing indirizzo
    const createReq = {
      outOrderId: order.order_number,
      shippingAddress: {
        contactPerson: order.customer_name,
        mobileNo: order.customer_phone || '393330000000',
        address: order.shipping_address,
        city: order.shipping_city || 'Roma',
        province: order.shipping_province || order.shipping_city || 'RM',
        zip: order.shipping_postal_code || '00100',
        country: order.shipping_country || 'IT',
      },
      items: aliItems,
      buyerNotes: order.customer_notes || undefined,
    };

    // 5. Chiamata API AliExpress Order Create
    const aliResult = await aliExpressClient.createOrder(createReq);

    if (aliResult.success && aliResult.aliexpressOrderId) {
      // Aggiornamento stato su Supabase: ORDERED
      await supabase
        .from('orders')
        .update({
          aliexpress_order_id: aliResult.aliexpressOrderId,
          fulfillment_status: 'ORDERED',
          error_payload: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return NextResponse.json({
        success: true,
        message: 'Ordine inoltrato ad AliExpress con successo!',
        aliexpressOrderId: aliResult.aliexpressOrderId,
        fulfillmentStatus: 'ORDERED',
      });
    } else {
      // Registra errore fornitore
      const errorDetails = {
        code: aliResult.errorCode,
        message: aliResult.errorMessage,
        raw: aliResult.rawPayload,
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from('orders')
        .update({
          fulfillment_status: 'FAILED',
          error_payload: errorDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return NextResponse.json(
        {
          success: false,
          error: aliResult.errorMessage || 'Creazione ordine AliExpress non riuscita',
          details: errorDetails,
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error('Errore fulfillment AliExpress:', err);
    return NextResponse.json({ error: err.message || 'Errore interno fulfillment' }, { status: 500 });
  }
}

