import { cjRequest } from './client';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  CjCreateOrderRequest,
  CjCreateOrderResponseData,
  CjFreightCalculateRequest,
  CjFreightOption,
  CjPayBalanceRequest,
} from '@/types/cj.types';
import { FulfillmentStatus, Order, OrderItem } from '@/types/database.types';

export interface CalculateShippingParams {
  destinationCountryCode: string; // ISO 2 caratteri, es: "IT"
  postalCode?: string;
  province?: string;
  city?: string;
  items: Array<{
    cjVariantId: string;
    quantity: number;
  }>;
}

/**
 * Calcola le opzioni e i costi di spedizione prima del checkout via POST /logistic/freightCalculate
 */
export async function calculateFreight(params: CalculateShippingParams): Promise<CjFreightOption[]> {
  const { destinationCountryCode, postalCode, province, city, items } = params;

  if (!items || items.length === 0) {
    return [];
  }

  const validProducts = items
    .filter((item) => Boolean(item.cjVariantId))
    .map((item) => ({
      vid: item.cjVariantId,
      quantity: Math.max(1, item.quantity),
    }));

  if (validProducts.length === 0) {
    return [];
  }

  const body: CjFreightCalculateRequest = {
    startCountryCode: process.env.CJ_START_COUNTRY_CODE || 'CN',
    endCountryCode: destinationCountryCode.toUpperCase(),
    zipCode: postalCode,
    province,
    city,
    products: validProducts,
  };

  try {
    const response = await cjRequest<CjFreightOption[]>('/logistic/freightCalculate', {
      method: 'POST',
      body,
      category: 'catalog',
    });

    const options = Array.isArray(response.data) ? response.data : [];
    // Ordiniamo le opzioni per prezzo crescente
    return options.sort((a, b) => Number(a.logisticPrice) - Number(b.logisticPrice));
  } catch (error) {
    console.error('[CJ Orders] Errore freightCalculate:', error);
    throw error;
  }
}

/**
 * Esegue il pagamento separato dell'ordine tramite il saldo del Wallet CJ
 */
export async function payOrderWithBalance(orderParams: CjPayBalanceRequest): Promise<boolean> {
  try {
    const response = await cjRequest<unknown>('/shopping/pay/payBalanceV2', {
      method: 'POST',
      body: orderParams,
      category: 'order',
    });

    return response.code === 200 && response.result;
  } catch (error) {
    console.error(`[CJ Orders] Errore pagamento wallet per ordine ${orderParams.orderNumber}:`, error);
    return false;
  }
}

export interface FulfillOrderOptions {
  localOrderId: string;
  logisticName?: string;
  autoPayWithWallet?: boolean;
}

/**
 * Inoltra un ordine del nostro e-commerce a CJdropshipping (/shopping/order/createOrderV2)
 * in modo completamente idempotente e sicuro.
 */
export async function fulfillOrderToCj(options: FulfillOrderOptions) {
  const { localOrderId, logisticName, autoPayWithWallet = true } = options;
  const supabase = getAdminClient();

  // 1. Recupera l'ordine e i relativi order_items
  const { data: orderData, error: orderErr } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', localOrderId)
    .single();

  if (orderErr || !orderData) {
    throw new Error(`Ordine locale non trovato (${localOrderId}): ${orderErr?.message}`);
  }

  const order = orderData as unknown as Order & { order_items: OrderItem[] };

  // Idempotenza: se l'ordine è già stato processato con successo su CJ
  if (order.fulfillment_status === 'ORDERED' || order.fulfillment_status === 'PAID' || order.fulfillment_status === 'SHIPPED') {
    return {
      status: 'ALREADY_FULFILLED',
      cjOrderId: order.cj_order_id,
      orderNumber: order.order_number,
    };
  }

  const items = (order.order_items || []) as OrderItem[];

  const cjProducts = items
    .filter((item) => Boolean(item.cj_variant_id))
    .map((item) => ({
      vid: item.cj_variant_id!,
      quantity: item.quantity,
    }));

  if (cjProducts.length === 0) {
    throw new Error(`L'ordine ${order.order_number} non contiene varianti collegate a CJdropshipping (cj_variant_id mancante).`);
  }

  // 2. Determina il corriere: se non passato, eseguiamo una stima veloce o usiamo default
  let selectedLogistic = logisticName || order.cj_carrier_name;
  let estimatedFreight = order.cj_freight_cost || 0;

  if (!selectedLogistic) {
    try {
      const freightOptions = await calculateFreight({
        destinationCountryCode: order.shipping_country_code || 'IT',
        postalCode: order.shipping_postal_code,
        province: order.shipping_province,
        city: order.shipping_city,
        items: cjProducts.map((p) => ({ cjVariantId: p.vid, quantity: p.quantity })),
      });

      if (freightOptions.length > 0) {
        selectedLogistic = freightOptions[0].logisticName;
        estimatedFreight = Number(freightOptions[0].logisticPrice) || 0;
      } else {
        selectedLogistic = process.env.CJ_DEFAULT_LOGISTIC || 'CJ Packet Ordinary';
      }
    } catch {
      selectedLogistic = process.env.CJ_DEFAULT_LOGISTIC || 'CJ Packet Ordinary';
    }
  }

  const isSandbox = process.env.CJ_SANDBOX === 'true' ? 1 : 0;
  const iossType = process.env.CJ_IOSS_TYPE ? parseInt(process.env.CJ_IOSS_TYPE, 10) : 1;
  const payType = autoPayWithWallet ? 2 : 3;

  const createOrderPayload: CjCreateOrderRequest = {
    orderNumber: order.order_number,
    shippingZip: order.shipping_postal_code,
    shippingCountryCode: order.shipping_country_code || 'IT',
    shippingCountry: order.shipping_country || 'Italy',
    shippingProvince: order.shipping_province,
    shippingCity: order.shipping_city,
    shippingAddress: order.shipping_address,
    shippingCustomerName: order.customer_name,
    shippingPhone: order.customer_phone || '0000000000',
    logisticName: selectedLogistic,
    isSandbox,
    iossType,
    payType,
    products: cjProducts,
    remark: order.notes || `Order ${order.order_number} from Luxury Store`,
  };

  try {
    const cjResponse = await cjRequest<CjCreateOrderResponseData>('/shopping/order/createOrderV2', {
      method: 'POST',
      body: createOrderPayload,
      category: 'order',
    });

    const cjOrderId = cjResponse.data?.orderId || null;
    let newFulfillmentStatus: FulfillmentStatus = 'ORDERED';

    // Se payType era 2 (Wallet automatico) consideriamo già PAID
    if (payType === 2) {
      newFulfillmentStatus = 'PAID';
    } else if (payType === 3 && cjOrderId) {
      // Eseguiamo il pagamento separato tramite il saldo wallet
      const paid = await payOrderWithBalance({
        orderId: cjOrderId,
        orderNumber: order.order_number,
      });
      if (paid) {
        newFulfillmentStatus = 'PAID';
      }
    }

    // 3. Aggiorna record ordine su Supabase
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        cj_order_id: cjOrderId,
        cj_order_number: order.order_number,
        cj_carrier_name: selectedLogistic,
        cj_freight_cost: estimatedFreight,
        fulfillment_status: newFulfillmentStatus,
        error_payload: null,
      })
      .eq('id', order.id);

    if (updateErr) {
      console.error('[CJ Orders] Errore aggiornamento stato ordine:', updateErr.message);
    }

    return {
      success: true,
      orderNumber: order.order_number,
      cjOrderId,
      fulfillmentStatus: newFulfillmentStatus,
      logisticName: selectedLogistic,
    };
  } catch (apiError: any) {
    console.error(`[CJ Orders] Errore creazione ordine CJ per ${order.order_number}:`, apiError);

    // Salva l'errore nel record locale per consentire retry manuale o analisi
    await supabase
      .from('orders')
      .update({
        fulfillment_status: 'FAILED',
        error_payload: {
          message: apiError?.message || 'Errore chiamata createOrderV2',
          stack: apiError?.stack,
          timestamp: new Date().toISOString(),
        },
      })
      .eq('id', order.id);

    throw apiError;
  }
}
