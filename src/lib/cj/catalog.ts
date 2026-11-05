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
  productId?: string;
  productName: string;
  productSku: string;
  productImage: string;
  productWeight?: number;
  productType?: string;
  categoryName?: string;
  description?: string;
  variants: CjProductVariantRaw[];
}

export interface CjCategoryItem {
  categoryId: string;
  categoryName: string;
  categoryPid?: string;
  children?: CjCategoryItem[];
}

/**
 * Recupera l'elenco delle categorie di CJdropshipping
 * GET /product/getCategory
 */
export async function getCjCategories(): Promise<CjCategoryItem[]> {
  try {
    const response = await cjRequest<any>('/product/getCategory', {
      method: 'GET',
      category: 'catalog',
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('[CJ Catalog] Errore getCategory:', error);
    return [];
  }
}

/**
 * Cerca prodotti sul catalogo di CJdropshipping per parola chiave o ID categoria
 * GET /product/listV2 (Elasticsearch V2.0 con fallback a /product/list)
 */
export async function searchCjProducts(options: {
  keyword?: string;
  categoryId?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const { keyword, categoryId, pageNum = 1, pageSize = 20 } = options;

  const params = new URLSearchParams();
  params.append('page', String(pageNum));
  params.append('size', String(pageSize));
  params.append('pageNum', String(pageNum));
  params.append('pageSize', String(pageSize));

  if (keyword) {
    params.append('keyWord', keyword);
    params.append('keyword', keyword);
    params.append('productName', keyword);
  }
  if (categoryId) {
    params.append('categoryId', categoryId);
  }

  console.log(`[CJ Search] Ricerca per keyword: "${keyword || ''}", categoryId: "${categoryId || ''}"`);

  let response: any;
  try {
    // 1. Endpoint primario CJ API v2.0 (GET /product/listV2)
    response = await cjRequest<any>(`/product/listV2?${params.toString()}`, {
      method: 'GET',
      category: 'catalog',
    });
  } catch (err: any) {
    console.warn('[CJ Catalog] Fallback da /product/listV2 a /product/list:', err?.message);
    // 2. Fallback su /product/list con metodo GET
    response = await cjRequest<any>(`/product/list?${params.toString()}`, {
      method: 'GET',
      category: 'catalog',
    });
  }

  const rawData = response?.data;
  let itemsList: any[] = [];
  let totalCount = 0;

  if (Array.isArray(rawData)) {
    itemsList = rawData;
    totalCount = rawData.length;
  } else if (rawData && typeof rawData === 'object') {
    itemsList = rawData.list || rawData.content || rawData.data || [];
    totalCount = rawData.total || itemsList.length;
  }

  console.log(`[CJ Search Response] Trovati ${totalCount} prodotti totali. Estratti in pagina: ${itemsList.length}`);

  return {
    total: totalCount,
    list: itemsList,
  };
}

/**
 * Recupera i dettagli completi di un prodotto e delle sue varianti da CJdropshipping
 * GET /product/query?pid=...
 */
export async function getCjProductDetail(pid: string): Promise<CjProductDetailRaw | null> {
  const response = await cjRequest<any>(`/product/query?pid=${encodeURIComponent(pid)}`, {
    method: 'GET',
    category: 'catalog',
  });

  return response.data || null;
}

/**
 * Importa un singolo prodotto e tutte le sue varianti da CJdropshipping nel database locale
 */
export async function importCjProduct(
  cjProductId: string,
  categoryId?: string,
  markupPercentage = 40
) {
  const rawDetail = await getCjProductDetail(cjProductId);
  if (!rawDetail) {
    throw new Error(`Dettagli prodotto CJ non trovati per PID: ${cjProductId}`);
  }

  // Normalizzazione proprietà di CJ (che possono variare tra API v2.0 e precedenti)
  const detail = rawDetail as any;
  const pid = detail.pid || detail.productId || detail.id || cjProductId;
  const productName = detail.productName || detail.productNameEn || detail.name || detail.title || 'Prodotto CJ';
  const productSku = detail.productSku || detail.sku || `CJ-${pid}`;
  const productImage = detail.productImage || detail.image || detail.img || '';
  const description = detail.description || detail.productName || productName;

  const rawVariants: any[] = detail.variants || detail.variantList || detail.stanList || [];

  const supabase = getAdminClient();

  // Genera uno slug univoco per il prodotto
  const baseSlug = String(productName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Trova il prezzo base minimo tra le varianti
  const variantPrices = rawVariants.map((v) => Number(v.variantPrice || v.price || v.sellPrice || 0));
  const minCostPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : Number(detail.sellPrice || detail.price || 10);
  const sellingPrice = Number((minCostPrice * (1 + markupPercentage / 100)).toFixed(2));

  // Inserisci o aggiorna il prodotto
  const { data: productData, error: prodErr } = await supabase
    .from('products')
    .upsert(
      {
        name: productName,
        slug,
        description,
        price: sellingPrice,
        cost_price: minCostPrice,
        markup_percentage: markupPercentage,
        image_url: productImage,
        stock: 100,
        category_id: categoryId || null,
        cj_product_id: String(pid),
        cj_product_sku: productSku,
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
  if (rawVariants.length > 0) {
    const variantsToUpsert = rawVariants.map((v) => {
      const vid = v.vid || v.id || v.variantId || `${pid}-${Math.random().toString(36).substring(2, 6)}`;
      const cost = Number(v.variantPrice || v.price || v.sellPrice || minCostPrice);
      const vPrice = Number((cost * (1 + markupPercentage / 100)).toFixed(2));
      return {
        product_id: product.id,
        name: v.variantName || v.name || product.name,
        cj_variant_id: String(vid),
        cj_sku: v.variantSku || v.sku || productSku,
        cost_price: cost,
        price: vPrice,
        stock: Number(v.inventory || v.stock || 50),
        weight: Number(v.variantWeight || v.weight || 0),
        image_url: v.variantImage || v.image || productImage,
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

export interface BulkImportOptions {
  keyword?: string;
  cjCategoryId?: string;
  localCategoryId?: string;
  limit?: number; // Quanti articoli importare in blocco (default: 20)
  markupPercentage?: number;
}

/**
 * Importa in blocco un'intera categoria o ricerca da CJdropshipping
 */
export async function bulkImportCjCategory(options: BulkImportOptions) {
  const {
    keyword,
    cjCategoryId,
    localCategoryId,
    limit = 20,
    markupPercentage = 40,
  } = options;

  // 1. Cerca la lista di prodotti corrispondenti su CJ
  const searchResult = await searchCjProducts({
    keyword,
    categoryId: cjCategoryId,
    pageNum: 1,
    pageSize: Math.min(limit, 50),
  });

  const productsList = searchResult.list || [];
  if (productsList.length === 0) {
    return {
      totalFound: 0,
      importedCount: 0,
      importedProducts: [],
      errors: [`Nessun prodotto trovato su CJ per "${keyword || ''}". Prova con un termine in inglese come "watches", "rings", "bags", "hoodie".`],
    };
  }

  const importedProducts: Array<{ id: string; name: string; pid: string }> = [];
  const errors: string[] = [];

  // 2. Itera ed importa ciascun prodotto (il nostro client HTTP rispetta il limite di 30 req/s)
  for (const item of productsList) {
    // Estrazione flessibile del Product ID dai vari formati JSON di CJ
    const pid = item.productId || item.pid || item.id || item.product_id;
    if (!pid) {
      console.warn('[Bulk Import] Item senza ID identificabile:', item);
      continue;
    }

    try {
      const imported = await importCjProduct(String(pid), localCategoryId, markupPercentage);
      importedProducts.push({
        id: imported.id,
        name: imported.name,
        pid: String(pid),
      });
      console.log(`[Bulk Import] Importato (${importedProducts.length}/${productsList.length}): ${imported.name}`);
    } catch (err: any) {
      console.warn(`[Bulk Import] Errore importazione per PID ${pid}:`, err?.message);
      errors.push(`PID ${pid}: ${err?.message || 'Errore import'}`);
    }
  }

  return {
    totalFound: searchResult.total,
    importedCount: importedProducts.length,
    importedProducts,
    errors,
  };
}
