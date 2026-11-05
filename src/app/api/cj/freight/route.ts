import { NextRequest, NextResponse } from 'next/server';
import { calculateFreight } from '@/lib/cj/orders';

export const dynamic = 'force-dynamic';

/**
 * Calcolo preventivo spedizione CJdropshipping pre-checkout
 * POST /api/cj/freight
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destinationCountryCode, postalCode, province, city, items } = body;

    if (!destinationCountryCode) {
      return NextResponse.json(
        { error: 'destinationCountryCode è obbligatorio (es. "IT").' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items deve essere un array di varianti con cjVariantId e quantity.' },
        { status: 400 }
      );
    }

    const options = await calculateFreight({
      destinationCountryCode,
      postalCode,
      province,
      city,
      items,
    });

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error: any) {
    console.error('[API Freight] Errore calcolo spedizione:', error);
    return NextResponse.json(
      { error: error?.message || 'Impossibile calcolare i costi di spedizione.' },
      { status: 500 }
    );
  }
}

