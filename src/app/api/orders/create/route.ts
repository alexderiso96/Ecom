import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkOrderRateLimit, getClientIp, verifyBotProtection } from '@/lib/rate-limiter';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(value: unknown, max: number) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid field');
  return value.trim();
}

export async function POST(request: Request) {
  let payload: {
    key: string;
    items: { product_id: string; quantity: number }[];
    customer: { name: string; email: string; phone: string | null; address: string | null; notes: string | null };
    honeypotValue: string;
    clientTimestamp?: number;
  };
  try {
    const body = await request.json();
    if (typeof body.checkoutKey !== 'string' || !uuid.test(body.checkoutKey) ||
        !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
      throw new Error('Invalid checkout');
    }
    const items = body.items.map((item: { productId?: unknown; quantity?: unknown }) => {
      if (typeof item?.productId !== 'string' || !uuid.test(item.productId) ||
          typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) ||
          item.quantity < 1 || item.quantity > 100) throw new Error('Invalid item');
      return { product_id: item.productId.toLowerCase(), quantity: item.quantity };
    });
    const email = field(body.customerEmail, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email');
    payload = {
      key: body.checkoutKey as string,
      items,
      customer: {
        name: field(body.customerName, 120) || email.split('@')[0],
        email,
        phone: field(body.customerPhone, 40) || null,
        address: field(body.shippingAddress, 300) || null,
        notes: field(body.customerNotes, 1000) || null,
      },
      honeypotValue: field(body.hp_website, 200),
      clientTimestamp: typeof body.clientTimestamp === 'number' ? body.clientTimestamp : undefined,
    };
  } catch {
    return NextResponse.json({ error: 'Controlla i dati di contatto e gli articoli nel carrello.' }, { status: 400 });
  }

  if (!verifyBotProtection(payload).isHuman) {
    return NextResponse.json({ error: 'Attendi un momento e riprova.' }, { status: 403 });
  }

  const limit = checkOrderRateLimit(getClientIp(request), payload.customer.email);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, {
      status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) },
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Checkout temporaneamente non disponibile.' }, { status: 503 });
  }

  try {
    const { data: { user } } = await createClient().auth.getUser();
    const supabase = createServiceClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc('create_checkout', {
      p_key: payload.key, p_user: user?.id ?? null,
      p_customer: payload.customer, p_items: payload.items,
    });
    if (!error && data?.orderNumber) return NextResponse.json(data);
    if (error?.code === 'P0001') {
      return NextResponse.json({ error: 'Un articolo o la quantità selezionata non è disponibile. Aggiorna il carrello.' }, { status: 409 });
    }
    if (error?.code === 'P0002') {
      return NextResponse.json({ error: 'Questa richiesta è già associata a un altro ordine.' }, { status: 409 });
    }
    console.error('Errore registrazione ordine', error?.code);
  } catch (error) {
    console.error('Checkout non disponibile', error instanceof Error ? error.name : '');
  }

  return NextResponse.json({ error: 'Registrazione non riuscita. Puoi riprovare con gli stessi dati.' }, { status: 500 });
}
