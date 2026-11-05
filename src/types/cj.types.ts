/**
 * Definizioni TypeScript per l'integrazione con CJdropshipping API v2.0
 */

export interface CjCredentialsRecord {
  id: string;
  email: string;
  api_key: string | null;
  password: string | null;
  access_token: string | null;
  refresh_token: string | null;
  open_id: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  is_active: boolean;
  is_circuit_broken: boolean;
  circuit_break_reason: string | null;
  circuit_broken_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CjApiResponse<T = unknown> {
  code: number;
  result: boolean;
  message: string;
  data: T;
}

export interface CjAuthData {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  openId: string | number;
}

export interface CjFreightProduct {
  vid: string;
  quantity: number;
}

export interface CjFreightCalculateRequest {
  startCountryCode?: string;
  endCountryCode: string;
  products: CjFreightProduct[];
  zipCode?: string;
  province?: string;
  city?: string;
}

export interface CjFreightOption {
  logisticName: string;
  logisticPrice: number;
  logisticAging: string;
  logisticTracking?: string | number;
  taxes?: number;
  currency?: string;
}

export interface CjOrderItemPayload {
  vid: string;
  quantity: number;
  storeName?: string;
  shippingName?: string;
}

export interface CjCreateOrderRequest {
  orderNumber: string;
  shippingZip: string;
  shippingCountryCode: string;
  shippingCountry: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  logisticName: string;
  isSandbox: 0 | 1;
  iossType?: number;
  iossNumber?: string;
  payType?: 2 | 3; // 2: Wallet automatico all'ordine, 3: Pagamento separato via /pay/payBalanceV2
  products: CjOrderItemPayload[];
  remark?: string;
}

export interface CjCreateOrderResponseData {
  orderId: string;
  orderNumber: string;
  payType?: number;
  status?: string;
  createDate?: string;
}

export interface CjPayBalanceRequest {
  orderId?: string;
  orderNumber?: string;
}

export interface CjWebhookPayload<T = unknown> {
  eventType: 'STOCK' | 'VARIANT' | 'ORDER' | 'LOGISTICS' | string;
  messageId?: string;
  timestamp?: number;
  data: T;
}

export interface CjStockWebhookData {
  vid: string;
  sku?: string;
  inventory: number;
  productId?: string;
}

export interface CjVariantWebhookData {
  vid: string;
  sku?: string;
  productId?: string;
  sellPrice?: number;
  status?: string;
}

export interface CjOrderWebhookData {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
}

export interface CjLogisticsWebhookData {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  logisticName: string;
  shippingTime?: string;
}

