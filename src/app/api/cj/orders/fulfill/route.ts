import { NextRequest, NextResponse } from 'next/server';
import { fulfillOrderToCj } from '@/lib/cj/orders';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Inoltro ed evasione ordine su CJdropshipping
 * POST /api/cj/orders/fulfill
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autorizzazione (CRON_SECRET o utente autenticato admin/superadmin)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin' || profile?.role === 'superadmin') {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Non autorizzato ad eseguire il fulfillment verso CJdropshipping.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, logisticName, autoPayWithWallet = true } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId (UUID locale) è obbligatorio.' },
        { status: 400 }
      );
    }

    const result = await fulfillOrderToCj({
      localOrderId: orderId,
      logisticName,
      autoPayWithWallet,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[API Fulfill] Errore evasione ordine:', error);
    return NextResponse.json(
      { error: error?.message || 'Errore durante l\'evasione su CJ.' },
      { status: 500 }
    );
  }
}

