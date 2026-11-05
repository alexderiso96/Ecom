import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getStoredOpenId } from '@/lib/cj/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  CjLogisticsWebhookData,
  CjOrderWebhookData,
  CjStockWebhookData,
  CjVariantWebhookData,
  CjWebhookPayload,
} from '@/types/cj.types';
import { FulfillmentStatus } from '@/types/database.types';

export const dynamic = 'force-dynamic';

/**
 * Confronto crittografico sicuro a tempo costante tra due stringhe
 */
function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Elabora l'evento del webhook in background senza bloccare la risposta HTTP a CJ
 */
async function processWebhookEventInBackground(
  eventId: string,
  eventType: string,
  payloadData: unknown
) {
  const supabase = getAdminClient();

  try {
    const upperType = (eventType || '').toUpperCase();

    switch (upperType) {
      case 'STOCK': {
        const stockData = payloadData as CjStockWebhookData;
        if (stockData?.vid) {
          const newStock = Math.max(0, Number(stockData.inventory) || 0);

          // 1. Aggiorna lo stock della specifica variante
          const { data: updatedVariantData } = await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('cj_variant_id', String(stockData.vid))
            .select('product_id')
            .maybeSingle();

          const updatedVariant = updatedVariantData as { product_id: string } | null;

          // 2. Se abbiamo trovato la variante, ricalcoliamo lo stock totale del prodotto
          if (updatedVariant?.product_id) {
            const { data: allVariantsData } = await supabase
              .from('product_variants')
              .select('stock')
              .eq('product_id', updatedVariant.product_id);

            const allVariants = (allVariantsData || []) as Array<{ stock: number }>;
            const totalProductStock = allVariants.reduce(
              (acc, v) => acc + (Number(v.stock) || 0),
              0
            );

            await supabase
              .from('products')
              .update({
                stock: totalProductStock,
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', updatedVariant.product_id);
          }
        }
        break;
      }

      case 'VARIANT': {
        const variantData = payloadData as CjVariantWebhookData;
        if (variantData?.vid) {
          const updates: Record<string, unknown> = {};

          if (variantData.sellPrice !== undefined) {
            const newCost = Number(variantData.sellPrice);
            updates.cost_price = newCost;

            // Recupera la variante per conoscere il markup del prodotto padre
            const { data: existingVariantData } = await supabase
              .from('product_variants')
              .select('product_id, products (markup_percentage)')
              .eq('cj_variant_id', String(variantData.vid))
              .maybeSingle();

            const existingVariant = existingVariantData as any;
            if (existingVariant) {
              const product = existingVariant.products as { markup_percentage?: number } | null;
              const markup = Number(product?.markup_percentage) || 40;
              const calculatedPrice = Number((newCost * (1 + markup / 100)).toFixed(2));
              updates.price = calculatedPrice;
            }
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('product_variants')
              .update(updates)
              .eq('cj_variant_id', String(variantData.vid));
          }
        }
        break;
      }

      case 'ORDER': {
        const orderData = payloadData as CjOrderWebhookData;
        if (orderData?.orderNumber) {
          let mappedStatus: FulfillmentStatus | null = null;
          const cjStatus = (orderData.orderStatus || '').toUpperCase();

          if (['CREATED', 'SUBMITTED', 'PENDING'].includes(cjStatus)) {
            mappedStatus = 'ORDERED';
          } else if (['PAID', 'PROCESSING', 'IN_PROCESS'].includes(cjStatus)) {
            mappedStatus = 'PAID';
          } else if (['SHIPPED', 'DISPATCHED'].includes(cjStatus)) {
            mappedStatus = 'SHIPPED';
          } else if (['COMPLETED', 'DELIVERED'].includes(cjStatus)) {
            mappedStatus = 'DELIVERED';
          } else if (['CANCELLED', 'CLOSED', 'REFUNDED'].includes(cjStatus)) {
            mappedStatus = 'CANCELLED';
          }

          if (mappedStatus) {
            await supabase
              .from('orders')
              .update({
                fulfillment_status: mappedStatus,
                cj_order_id: orderData.orderId || undefined,
              })
              .eq('order_number', orderData.orderNumber);
          }
        }
        break;
      }

      case 'LOGISTICS': {
        const logData = payloadData as CjLogisticsWebhookData;
        if (logData?.orderNumber) {
          await supabase
            .from('orders')
            .update({
              cj_tracking_number: logData.trackingNumber || null,
              cj_carrier_name: logData.logisticName || null,
              fulfillment_status: 'SHIPPED',
            })
            .eq('order_number', logData.orderNumber);
        }
        break;
      }

      default:
        console.info(`[CJ Webhook] Tipo evento non gestito specificamente: ${eventType}`);
        break;
    }

    // Segna l'evento come processato con successo
    await supabase
      .from('cj_webhook_events')
      .update({
        status: 'PROCESSED',
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId);
  } catch (err: any) {
    console.error(`[CJ Webhook] Errore elaborazione evento ${eventId}:`, err);
    await supabase
      .from('cj_webhook_events')
      .update({
        status: 'FAILED',
        error_message: err?.message || 'Errore elaborazione asincrona',
      })
      .eq('id', eventId);
  }
}

/**
 * Webhook Receiver ultra-veloce (SLA < 3 secondi, risposta < 50ms)
 * POST /api/webhooks/cj
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Cattura del RAW body per la verifica HMAC crittografica
    const rawBody = await req.text();
    const signHeader = req.headers.get('sign') || req.headers.get('Sign') || req.headers.get('x-sign');

    // 2. Recupero dell'openId (chiave HMAC)
    const openId = await getStoredOpenId();

    if (!openId) {
      console.error('[CJ Webhook] openId non disponibile per la verifica della firma.');
      return NextResponse.json(
        { code: 500, message: 'Server configuration error: missing openId' },
        { status: 500 }
      );
    }

    // 3. Verifica firma HMAC-SHA256 con Base64 digest
    if (signHeader) {
      const hmac = crypto.createHmac('sha256', openId);
      hmac.update(rawBody, 'utf8');
      const expectedSign = hmac.digest('base64');

      const isSignatureValid = safeTimingEqual(signHeader.trim(), expectedSign.trim());
      if (!isSignatureValid) {
        console.warn('[CJ Webhook] Firma HMAC non valida!');
        return NextResponse.json(
          { code: 401, message: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else {
      // In ambiente di sviluppo o se CJ non invia sign, logghiamo avviso
      console.warn('[CJ Webhook] Nessun header di firma presente nella richiesta.');
    }

    // 4. Parsing del payload
    let parsedPayload: CjWebhookPayload;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { code: 400, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = parsedPayload.eventType || 'UNKNOWN';

    // 5. Inserimento rapido nella tabella cj_webhook_events
    const supabase = getAdminClient();
    const { data: insertedEventData, error: insertError } = await supabase
      .from('cj_webhook_events')
      .insert({
        event_type: eventType,
        payload: parsedPayload,
        signature: signHeader || null,
        status: 'PENDING',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[CJ Webhook] Errore inserimento cj_webhook_events:', insertError.message);
    }

    const insertedEvent = insertedEventData as { id: string } | null;

    // 6. Schedula l'elaborazione asincrona in background SENZA attendere
    if (insertedEvent?.id) {
      void processWebhookEventInBackground(
        insertedEvent.id,
        eventType,
        parsedPayload.data
      );
    }

    const duration = Date.now() - startTime;
    console.info(`[CJ Webhook] Risposto OK in ${duration}ms per evento: ${eventType}`);

    // 7. Risposta HTTP 200 immediata entro poche decine di ms
    return NextResponse.json(
      {
        code: 200,
        result: true,
        message: 'SUCCESS',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[CJ Webhook] Eccezione:', error);
    // CJ non fa retry se fallisce, rispondiamo comunque velocemente
    return NextResponse.json(
      { code: 500, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
