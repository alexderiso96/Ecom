import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Truck, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { ProductDetailActions } from '@/components/products/ProductDetailActions';
import { ProductGallery } from '@/components/products/ProductGallery';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  if (!product) return { title: 'Creazione non trovata' };

  return {
    title: `${product.name} | DREAM CREATION`,
    description: product.description || 'Scopri i dettagli di questa creazione esclusiva su Dream Creation.',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('slug', params.slug)
    .single();

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container py-8 md:py-14 max-w-6xl">
      {/* Back Link */}
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-xs tracking-[0.16em] uppercase font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Torna alle Collezioni</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Interactive Multi-Image Gallery */}
        <div className="lg:col-span-6 w-full">
          <ProductGallery product={product} />
        </div>

        {/* Right: Product Editorial Information */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[10px] tracking-[0.24em] uppercase font-semibold text-[#795724] dark:text-[#D7B47D]">
                {product.category?.name || 'Dream Creation'}
              </span>

              {product.quote_required ? null : isOutOfStock ? (
                <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-400">
                  Esaurito
                </span>
              ) : product.stock <= 5 ? (
                <span className="inline-flex items-center gap-1 text-[10px] tracking-wide font-medium text-amber-700 dark:text-amber-400">
                  <Flame className="h-3 w-3 text-amber-500 fill-amber-500 animate-pulse" />
                  <span>Ultime {product.stock} unità disponibili</span>
                </span>
              ) : (
                <span className="text-[10px] tracking-[0.16em] uppercase font-medium text-emerald-700 dark:text-emerald-400">
                  Disponibilità Immediata
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-light tracking-tight text-stone-900 dark:text-stone-100">
                {product.quote_required ? 'Su preventivo' : formatCurrency(Number(product.price))}
              </span>
              {!product.quote_required && (
                <span className="text-[10px] tracking-[0.2em] uppercase text-stone-600 dark:text-stone-300 font-medium">
                  IVA inclusa
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-b border-stone-200/80 dark:border-stone-800/80 py-5 space-y-2">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-400">
              Descrizione & Dettagli
            </h3>
            <p className="text-xs sm:text-sm font-light text-stone-600 dark:text-stone-300 leading-relaxed">
              {product.description || 'Scrivici per conoscere i dettagli di questo articolo e le opzioni di personalizzazione.'}
            </p>
          </div>

          {product.personalization && (
            <section className="space-y-2">
              <h2 className="font-semibold">Personalizzazione</h2>
              <p className="whitespace-pre-line text-sm text-stone-700 dark:text-stone-300">{product.personalization}</p>
            </section>
          )}

          {/* Actions (Quantity, Wishlist, WhatsApp & Cart) */}
          <ProductDetailActions product={product} />

          <p className="flex items-center gap-2 border-t border-stone-200/80 pt-4 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-300">
            <Truck className="h-4 w-4 shrink-0" />
            Tempi e costi di spedizione da concordare su WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
