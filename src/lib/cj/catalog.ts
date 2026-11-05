import { cjRequest } from './client';
import { getAdminClient } from '@/lib/supabase/admin';

export interface CjProductVariantRaw {
  vid: string;
  pid: string;
  variantName?: string | null;
  variantNameEn?: string | null;
  variantSku: string;
  variantSellPrice?: number;
  variantPrice?: number;
  variantStandardPrice?: number;
  variantWeight?: number;
  variantImage?: string;
  variantKey?: string;
}

export interface CjProductDetailRaw {
  pid: string;
  productId?: string;
  productName?: string;
  productNameEn?: string;
  nameEn?: string;
  productSku: string;
  bigImage?: string;
  productImage?: string;
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
  if (keyword) {
    params.append('keyWord', keyword);
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

  if (rawData) {
    totalCount = Number(rawData.totalRecords || rawData.total || 0);

    // Formato reale CJ API v2.0: data.content[0].productList
    if (Array.isArray(rawData.content) && rawData.content.length > 0) {
      if (Array.isArray(rawData.content[0].productList)) {
        itemsList = rawData.content[0].productList;
      } else {
        itemsList = rawData.content;
      }
    } else if (Array.isArray(rawData.productList)) {
      itemsList = rawData.productList;
    } else if (Array.isArray(rawData.list)) {
      itemsList = rawData.list;
    } else if (Array.isArray(rawData)) {
      itemsList = rawData;
    }
  }

  console.log(`[CJ Search Response] Trovati ${totalCount} prodotti totali. Estratti in pagina: ${itemsList.length}`);

  return {
    total: totalCount || itemsList.length,
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

  // Normalizzazione proprietà di CJ in base alla struttura reale v2.0
  const detail = rawDetail as any;
  const pid = String(detail.pid || detail.productId || detail.id || cjProductId);
  const productName = String(
    detail.productNameEn || detail.productName || detail.nameEn || detail.name || 'Prodotto Esclusivo CJ'
  );
  const productSku = String(detail.productSku || detail.sku || `CJ-${pid}`);
  const productImage = String(detail.bigImage || detail.productImage || detail.image || '');
  const description = detail.description || productName;

  const rawVariants: any[] = detail.variants || detail.variantList || detail.stanList || [];

  const supabase = getAdminClient();

  // Genera uno slug univoco per il prodotto
  const baseSlug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Trova il prezzo base minimo tra le varianti
  const variantPrices = rawVariants.map((v) =>
    Number(v.variantSellPrice || v.variantPrice || v.price || v.sellPrice || 0)
  );
  const minCostPrice =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : Number(detail.sellPrice || detail.price || 10);

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
        cj_product_id: pid,
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
      const vid = String(
        v.vid || v.id || v.variantId || `${pid}-${Math.random().toString(36).substring(2, 6)}`
      );
      const vName = String(
        v.variantNameEn || v.variantName || v.variantKey || product.name
      );
      const cost = Number(
        v.variantSellPrice || v.variantPrice || v.price || v.sellPrice || minCostPrice
      );
      const vPrice = Number((cost * (1 + markupPercentage / 100)).toFixed(2));
      const vImg = String(v.variantImage || v.bigImage || productImage);
      const vWeight = Number(v.variantWeight || 0);
      const vSku = String(v.variantSku || v.sku || productSku);

      return {
        product_id: product.id,
        name: vName,
        cj_variant_id: vid,
        cj_sku: vSku,
        cost_price: cost,
        price: vPrice,
        stock: Number(v.inventoryNum || v.inventory || v.stock || 50),
        weight: vWeight,
        image_url: vImg,
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
      errors: [
        `Nessun prodotto trovato su CJ per "${keyword || ''}". Prova con un termine in inglese come "watches", "rings", "bags", "hoodie".`,
      ],
    };
  }

  const importedProducts: Array<{ id: string; name: string; pid: string }> = [];
  const errors: string[] = [];

  // Limita al numero richiesto
  const targetItems = productsList.slice(0, limit);

  // 2. Itera ed importa ciascun prodotto (il nostro client HTTP rispetta il rate limit)
  for (const item of targetItems) {
    // Estrazione dell'ID: nei risultati v2.0 è `item.id` (oppure `item.productId` / `item.pid`)
    const pid = item.id || item.productId || item.pid || item.product_id;
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
      console.log(`[Bulk Import] Importato (${importedProducts.length}/${targetItems.length}): ${imported.name}`);
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
