export type UserRole = 'customer' | 'admin' | 'superadmin';

export type FulfillmentStatus =
  | 'PENDING'
  | 'ORDERED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  cj_variant_id: string | null;
  cj_sku: string | null;
  price: number;
  cost_price: number | null;
  stock: number;
  weight: number;
  attributes: any;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images?: string[] | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  cj_product_id?: string | null;
  cj_product_sku?: string | null;
  cost_price?: number | null;
  markup_percentage?: number | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  variants?: ProductVariant[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  cjVariantId?: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
  weight?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cj_variant_id: string | null;
  cj_sku: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_country_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_status: string;
  fulfillment_status: FulfillmentStatus;
  cj_order_id: string | null;
  cj_order_number: string | null;
  cj_tracking_number: string | null;
  cj_carrier_name: string | null;
  cj_freight_cost: number | null;
  error_payload: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CjCredentialsRow {
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

export interface CjWebhookEventRecord {
  id: string;
  event_type: string;
  payload: any;
  signature: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}
