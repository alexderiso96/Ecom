export interface AliExpressProductInfo {
  productId: string;
  title: string;
  description: string;
  mainImage: string;
  images: string[];
  costPrice: number; // Prezzo di costo su AliExpress (EUR)
  currency: string;
  totalStock: number;
  skus: AliExpressSkuItem[];
}

export interface AliExpressSkuItem {
  skuId: string;
  skuCode?: string;
  skuName: string;
  price: number; // Prezzo costo dello SKU
  stock: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

export interface AliExpressShippingAddress {
  contactPerson: string;
  phoneCountry?: string;
  mobileNo: string;
  address: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string; // ISO 2-letter, e.g. "IT"
}

export interface AliExpressOrderItemParam {
  productId: string;
  skuId?: string;
  quantity: number;
  logisticsServiceName?: string;
}

export interface AliExpressOrderCreateRequest {
  outOrderId: string; // Il nostro ID ordine interno
  shippingAddress: AliExpressShippingAddress;
  items: AliExpressOrderItemParam[];
  buyerNotes?: string;
}

export interface AliExpressOrderCreateResponse {
  success: boolean;
  aliexpressOrderId?: string;
  errorCode?: string;
  errorMessage?: string;
  rawPayload?: any;
}

export interface AliExpressOrderTrackingInfo {
  aliexpressOrderId: string;
  orderStatus: string; // 'WAIT_SELLER_SEND_GOODS' | 'WAIT_BUYER_ACCEPT_GOODS' | 'FINISH' | 'IN_CANCEL'
  isShipped: boolean;
  trackingNumber?: string;
  carrierName?: string;
  shipDate?: string;
  rawPayload?: any;
}

export interface AliExpressTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_valid_time?: number;
  user_id?: string;
  spilt_user_id?: string;
}

