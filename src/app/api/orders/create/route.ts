import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      customerNotes,
      items,
      totalPrice,
      userId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nessun articolo nel carrello.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Inserisci l'ordine principale
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        customer_name: customerName || 'Cliente WhatsApp',
        customer_email: customerEmail || 'guest@aurastore.com',
        customer_phone: customerPhone || null,
        shipping_address: shippingAddress || 'Concordato via WhatsApp',
        customer_notes: customerNotes || null,
        total_amount: Number(totalPrice) || 0,
        currency: 'EUR',
        fulfillment_status: 'PENDING',
      })
      .select()
      .single();

    if (orderErr) {
      console.error('Errore inserimento ordine:', orderErr);
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    // Inserisci gli order_items
    const orderItemsPayload = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId && !item.productId.startsWith('p') ? item.productId : null,
      aliexpress_product_id: item.aliexpressProductId || null,
      aliexpress_sku_id: item.aliexpressSkuId || null,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      cost_price: null,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsErr) {
      console.warn('Avviso inserimento order_items:', itemsErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (err: any) {
    console.error('Errore creazione ordine:', err);
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 });
  }
}

