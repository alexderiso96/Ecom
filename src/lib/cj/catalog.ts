import { cjRequest } from './client';
import { getAdminClient } from '@/lib/supabase/admin';

export interface CjProductVariantRaw {
  vid: string;
  pid: string;
  variantName: string;
  variantSku: string;
  variantPrice: number;
  variantStandardPrice?: number;
  variantWeight?: number;
  variantImage?: string;
  variantKey?: string;
}

export interface CjProductDetailRaw {
  pid: string;
  productName: string;
  productSku: string;
  productImage: string;
  productWeight?: number;
  productType?: string;
  categoryName?: string;
  description?: string;
  variants: CjProductVariantRaw[];
}

/**
 * Cerca prodotti sul catalogo di CJdropshipping
 * POST /product/list
 */
export async function searchCjProducts(keyword: string, pageNum = 1, pageSize = 20) {
  const response = await cjRequest<any>('/product/list', {
    method: 'POST',
    body: {
      keyword,
      pageNum,
      pageSize,
    },
    category: 'catalog',
  });

  return response.data?.list || [];
}

/**
 * Recupera i dettagli completi di un prodotto e delle sue varianti da CJdropshipping
 * GET /product/query?pid=...
 */
export async function getCjProductDetail(pid: string): Promise<CjProductDetailRaw | null> {
  const response = await cjRequest<CjProductDetailRaw>(`/product/query?pid=${encodeURIComponent(pid)}`, {
    method: 'GET',
    category: 'catalog',
  });

  return response.data || null;
}

/**
 * Importa un prodotto e tutte le sue varianti da CJdropshipping nel database locale
 */
export async function importCjProduct(
  cjProductId: string,
  categoryId?: string,
  markupPercentage = 40
) {
  const detail = await getCjProductDetail(cjProductId);
  if (!detail) {
    throw new Error(`Prodotto CJ non trovato: ${cjProductId}`);
  }

  const supabase = getAdminClient();

  // Genera uno slug univoco per il prodotto
  const baseSlug = detail.productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Trova il prezzo base minimo tra le varianti
  const variantPrices = (detail.variants || []).map((v) => Number(v.variantPrice) || 0);
  const minCostPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
  const sellingPrice = Number((minCostPrice * (1 + markupPercentage / 100)).toFixed(2));

  // Inserisci o aggiorna il prodotto
  const { data: productData, error: prodErr } = await supabase
    .from('products')
    .upsert(
      {
        name: detail.productName,
        slug,
        description: detail.description || detail.productName,
        price: sellingPrice,
        cost_price: minCostPrice,
        markup_percentage: markupPercentage,
        image_url: detail.productImage,
        stock: 100, // Stock iniziale o aggregato
        category_id: categoryId || null,
        cj_product_id: detail.pid,
        cj_product_sku: detail.productSku,
        last_synced_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'cj_product_id' }
    )
    .select()
    .single();

  if (prodErr || !productData) {
    throw new Error(`Errore salvataggio prodotto locale: ${prodErr?.message}`);
  }

  const product = productData as { id: string; name: string };

  // Inserimento o aggiornamento varianti
  if (detail.variants && detail.variants.length > 0) {
    const variantsToUpsert = detail.variants.map((v) => {
      const cost = Number(v.variantPrice) || 0;
      const vPrice = Number((cost * (1 + markupPercentage / 100)).toFixed(2));
      return {
        product_id: product.id,
        name: v.variantName || product.name,
        cj_variant_id: v.vid,
        cj_sku: v.variantSku,
        cost_price: cost,
        price: vPrice,
        stock: 50,
        weight: Number(v.variantWeight) || 0,
        image_url: v.variantImage || detail.productImage,
        attributes: v.variantKey ? { variantKey: v.variantKey } : {},
      };
    });

    const { error: varErr } = await supabase
      .from('product_variants')
      .upsert(variantsToUpsert, { onConflict: 'cj_variant_id' });

    if (varErr) {
      console.error('[CJ Catalog] Errore inserimento varianti:', varErr.message);
    }
  }

  return product;
}
