import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CartItem } from '@/types/database.types';

interface CreateOrderPayload {
  items: CartItem[];
  totalPrice: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  customerNotes?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderPayload = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Il carrello è vuoto. Impossibile creare l\'ordine.' },
        { status: 400 }
      );
    }

    const totalPrice = Number(body.totalPrice);

    if (isNaN(totalPrice) || totalPrice < 0) {
      return NextResponse.json(
        { error: 'Totale ordine non valido.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Recupera email e nome con fallback sicuro dall'utente autenticato Supabase
    const customerEmail =
      body.customerEmail?.trim() ||
      user?.email ||
      null;

    const customerName =
      (body.customerName || '').trim() ||
      user?.user_metadata?.full_name ||
      (customerEmail ? customerEmail.split('@')[0] : 'Cliente');

    // Genera codice identificativo univoco (es. AURA-894213)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `AURA-${Date.now().toString().slice(-4)}${randomSuffix}`;

    // 1. Inserisci testata ordine
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: body.customerPhone?.trim() || null,
        shipping_address: body.shippingAddress?.trim() || null,
        notes: body.customerNotes?.trim() || null,
        total_amount: totalPrice,
        status: 'whatsapp_pending',
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      console.error('Errore creazione ordine Supabase:', orderError);
      return NextResponse.json(
        { error: `Errore salvataggio ordine: ${orderError?.message || 'Sconosciuto'}` },
        { status: 500 }
      );
    }

    // 2. Inserisci elementi ordine (order_items)
    const orderItemsPayload = body.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId && item.productId.length === 36 ? item.productId : null,
      product_name: item.name,
      product_image: item.imageUrl,
      price: Number(item.price),
      quantity: Math.max(1, Number(item.quantity)),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error('Errore creazione order_items Supabase:', itemsError);
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
    });
  } catch (err: any) {
    console.error('Errore interno create order:', err);
    return NextResponse.json(
      { error: err.message || 'Errore interno del server.' },
      { status: 500 }
    );
  }
}
