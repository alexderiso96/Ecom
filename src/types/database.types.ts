export type UserRole = 'customer' | 'admin' | 'superadmin';

export type FulfillmentStatus = 'PENDING' | 'ORDERED' | 'SHIPPED' | 'FAILED';

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
  aliexpress_sku_id: string | null;
  sku_code: string | null;
  name: string;
  price: number;
  cost_price: number | null;
  stock: number;
  image_url: string | null;
  attributes: Record<string, string | number> | null;
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
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  
  // Dropshipping AliExpress
  aliexpress_product_id?: string | null;
  aliexpress_sku_id?: string | null;
  cost_price?: number | null;
  markup_percentage?: number | null;
  stock_quantity?: number | null;
  last_synced_at?: string | null;
  variants?: ProductVariant[];

  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  aliexpress_product_id?: string | null;
  aliexpress_sku_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price?: number | null;
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
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  shipping_country: string;
  customer_notes: string | null;
  total_amount: number;
  currency: string;
  
  // Dropshipping AliExpress
  aliexpress_order_id: string | null;
  fulfillment_status: FulfillmentStatus;
  tracking_number: string | null;
  carrier_name: string | null;
  error_payload: Record<string, any> | null;
  
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface AliExpressCredentials {
  id: string;
  app_key: string;
  app_secret: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  refresh_token_expires_at: string | null;
  seller_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
  aliexpressProductId?: string | null;
  aliexpressSkuId?: string | null;
}
