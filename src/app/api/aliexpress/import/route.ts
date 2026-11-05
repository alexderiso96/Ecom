import { NextResponse } from 'next/server';
import { isAuthorizedCronOrAdmin } from '@/lib/aliexpress/auth';
import { aliExpressClient } from '@/lib/aliexpress/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. Verifica autorizzazione (Bearer CRON_SECRET o Admin Session)
  const auth = await isAuthorizedCronOrAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { aliexpressUrlOrId, markupPercentage = 50, categoryId } = body;

    if (!aliexpressUrlOrId) {
      return NextResponse.json(
        { error: 'Parametro "aliexpressUrlOrId" obbligatorio (URL o ID numerico prodotto AliExpress).' },
        { status: 400 }
      );
    }

    // Estrai l'ID del prodotto (es. da https://.../item/1005006234567890.html -> 1005006234567890)
    let productId = String(aliexpressUrlOrId).trim();
    const match = productId.match(/item\/(\d+)\.html/) || productId.match(/(\d{10,})/);
    if (match) {
      productId = match[1];
    }

    // 2. Recupera informazioni prodotto da AliExpress Open Platform
    const info = await aliExpressClient.getProductInfo(productId);

    // 3. Calcolo del prezzo di vendita con ricarico
    const markup = Number(markupPercentage) || 50;
    const retailPrice = parseFloat((info.costPrice * (1 + markup / 100)).toFixed(2));

    const baseSlug = slugify(info.title);
    const uniqueSlug = `${baseSlug}-${productId.slice(-5)}`;

    const supabase = createAdminClient();

    // 4. Salva o aggiorna nella tabella products
    const productPayload = {
      name: info.title,
      slug: uniqueSlug,
      description: info.description,
      price: retailPrice,
      cost_price: info.costPrice,
      markup_percentage: markup,
      image_url: info.mainImage,
      stock: info.totalStock > 0 ? info.totalStock : 10,
      stock_quantity: info.totalStock,
      aliexpress_product_id: info.productId,
      is_active: true,
      category_id: categoryId || null,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert prodotto basato su aliexpress_product_id o inserimento
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('aliexpress_product_id', info.productId)
      .maybeSingle();

    let savedProduct: any;

    if (existingProduct) {
      const { data, error } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', existingProduct.id)
        .select()
        .single();

      if (error) throw error;
      savedProduct = data;
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(productPayload)
        .select()
        .single();

      if (error) throw error;
      savedProduct = data;
    }

    // 5. Inserisci o aggiorna le varianti SKU collegate
    if (info.skus && info.skus.length > 0 && savedProduct?.id) {
      for (const sku of info.skus) {
        const skuRetailPrice = parseFloat((sku.price * (1 + markup / 100)).toFixed(2));
        
        await supabase.from('product_variants').upsert(
          {
            product_id: savedProduct.id,
            aliexpress_sku_id: sku.skuId,
            sku_code: sku.skuCode || null,
            name: sku.skuName,
            cost_price: sku.price,
            price: skuRetailPrice,
            stock: sku.stock,
            image_url: sku.imageUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id, aliexpress_sku_id' as any }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Prodotto AliExpress importato con successo!',
      product: savedProduct,
      skusCount: info.skus.length,
    });
  } catch (err: any) {
    console.error('Errore importazione prodotto AliExpress:', err);
    return NextResponse.json(
      { error: err.message || 'Errore durante l\'importazione del prodotto AliExpress' },
      { status: 500 }
    );
  }
}

