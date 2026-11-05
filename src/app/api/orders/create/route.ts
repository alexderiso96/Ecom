import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { fulfillOrderToCj } from '@/lib/cj/orders';
import { Order } from '@/types/database.types';

export const dynamic = 'force-dynamic';

/**
 * Creazione nuovo ordine cliente
 * POST /api/orders/create
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUserClient = createClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingProvince,
      shippingPostalCode,
      shippingCountryCode = 'IT',
      shippingCountry = 'Italy',
      items,
      selectedLogisticName,
      shippingFee = 0,
      notes,
      autoFulfillCj = false,
    } = body;

    if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingPostalCode) {
      return NextResponse.json(
        { error: 'Tutti i campi di spedizione obbligatori devono essere compilati.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Il carrello è vuoto.' },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.price) * Number(it.quantity),
      0
    );
    const totalAmount = subtotal + Number(shippingFee);

    // Generazione codice ordine human-readable es: ORD-20261105-XXXX
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const adminDb = getAdminClient();

    // 1. Inserimento record ordine
    const { data: orderData, error: orderErr } = await adminDb
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_province: shippingProvince || '',
        shipping_postal_code: shippingPostalCode,
        shipping_country_code: shippingCountryCode,
        shipping_country: shippingCountry,
        subtotal,
        shipping_fee: Number(shippingFee),
        total_amount: totalAmount,
        payment_status: 'PENDING',
        fulfillment_status: 'PENDING',
        cj_carrier_name: selectedLogisticName || null,
        cj_freight_cost: Number(shippingFee),
        notes: notes || null,
      })
      .select()
      .single();

    if (orderErr || !orderData) {
      console.error('[Orders API] Errore inserimento ordine:', orderErr?.message);
      return NextResponse.json(
        { error: 'Impossibile creare l\'ordine.' },
        { status: 500 }
      );
    }

    const order = orderData as unknown as Order;

    // 2. Inserimento degli order_items
    const orderItemsToInsert = items.map((it: any) => ({
      order_id: order.id,
      product_id: it.productId || null,
      variant_id: it.variantId || null,
      product_name: it.name,
      quantity: it.quantity,
      unit_price: Number(it.price),
      total_price: Number(it.price) * Number(it.quantity),
      cj_variant_id: it.cjVariantId || null,
      cj_sku: it.cjSku || null,
    }));

    const { error: itemsErr } = await adminDb
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsErr) {
      console.error('[Orders API] Errore inserimento items ordine:', itemsErr.message);
    }

    let cjResult = null;
    if (autoFulfillCj) {
      try {
        cjResult = await fulfillOrderToCj({
          localOrderId: order.id,
          logisticName: selectedLogisticName,
          autoPayWithWallet: true,
        });
      } catch (cjErr: any) {
        console.warn('[Orders API] Auto-fulfillment CJ fallito o in attesa:', cjErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        fulfillmentStatus: order.fulfillment_status,
      },
      cjResult,
    });
  } catch (error: any) {
    console.error('[Orders API] Eccezione:', error);
    return NextResponse.json(
      { error: error?.message || 'Errore interno creazione ordine.' },
      { status: 500 }
    );
  }
}
