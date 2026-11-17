import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ShoppingBag, Truck, ShieldCheck, RefreshCw, Flame, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';
import { ProductDetailActions } from '@/components/products/ProductDetailActions';

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
    title: `${product.name} | AURA ATELIER`,
    description: product.description || 'Scopri i dettagli di questa creazione esclusiva su Aura Atelier.',
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
        {/* Left: Gallery Image Frame */}
        <div className="lg:col-span-6 relative aspect-[4/5] w-full overflow-hidden bg-[#F5F2EB] dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-luxury">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              className="object-cover object-center filter saturate-[0.98]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-700">
              <ShoppingBag className="h-20 w-20 stroke-[1]" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-10">
            {product.is_featured && (
              <span className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.2em] uppercase bg-stone-900 text-white dark:bg-white dark:text-stone-950">
                In Evidenza
              </span>
            )}
            {product.category?.name && (
              <span className="px-2.5 py-1 text-[9px] font-medium tracking-[0.16em] uppercase bg-white/90 text-stone-800 backdrop-blur-sm border border-stone-200/60 dark:bg-stone-900/90 dark:text-stone-200 dark:border-stone-700">
                {product.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Editorial Information */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[10px] tracking-[0.24em] uppercase font-semibold text-[#C5A880]">
                {product.category?.name || 'Aura Atelier'}
              </span>

              {isOutOfStock ? (
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
                {formatCurrency(Number(product.price))}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-medium">
                IVA Inclusa
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-b border-stone-200/80 dark:border-stone-800/80 py-5 space-y-2">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-400">
              Descrizione & Dettagli
            </h3>
            <p className="text-xs sm:text-sm font-light text-stone-600 dark:text-stone-300 leading-relaxed">
              {product.description || 'Ogni creazione Aura viene realizzata con una cura meticolosa per le proporzioni e le finiture, offrendo un equilibrio impeccabile tra estetica raffinata e praticità d\'uso quotidiano.'}
            </p>
          </div>

          {/* Actions (Quantity, Wishlist, WhatsApp & Cart) */}
          <ProductDetailActions product={product} />

          {/* Value Propositions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200/80 dark:border-stone-800/80 text-[10px] tracking-[0.12em] uppercase text-stone-500">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#C5A880] stroke-[1.4]" />
              <span>Consegna 24/48h</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C5A880] stroke-[1.4]" />
              <span>Garanzia Autenticità</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#C5A880] stroke-[1.4]" />
              <span>Reso entro 14gg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
