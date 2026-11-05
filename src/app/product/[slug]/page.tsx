import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ShoppingBag, Truck, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';
import { ProductDetailActions } from '@/components/products/ProductDetailActions';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  if (!product) return { title: 'Prodotto non trovato' };

  return {
    title: `${product.name} | Aura Store`,
    description: product.description || 'Acquista su Aura Store',
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
    <div className="container py-8 md:py-12">
      {/* Breadcrumb / Back Link Pill */}
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200/70 bg-white/80 hover:bg-white hover:border-slate-300 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-sm transition-all dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Torna al Catalogo</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">
        {/* Left: Gallery Image Frame */}
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-100 to-slate-200/50 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
              <ShoppingBag className="h-20 w-20 stroke-[1]" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
            {product.is_featured && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-950 border border-slate-900/20">
                In evidenza
              </span>
            )}
            {product.category?.name && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-xs backdrop-blur-md border border-white/60 dark:bg-slate-900/90 dark:text-slate-200">
                {product.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Information */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200/60 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-400">
                <Sparkles className="h-3 w-3" />
                {product.category?.name || 'Aura Selection'}
              </span>

              {isOutOfStock ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 border border-rose-500/20 backdrop-blur-md dark:text-rose-400">
                  Esaurito
                </span>
              ) : product.stock < 5 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/20 backdrop-blur-md dark:text-amber-400">
                  Solo {product.stock} rimasti!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 backdrop-blur-md dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Disponibilità Immediata
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(Number(product.price))}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                IVA inclusa
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Descrizione Dettagliata
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {product.description || 'Nessuna descrizione specificata per questo articolo.'}
            </p>
          </div>

          {/* Actions Component (Quantity + Add to Cart + Direct WhatsApp) */}
          <ProductDetailActions product={product} />

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex-shrink-0">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Consegna Express</div>
                <div className="text-[10px] text-slate-400">24/48h in Italia</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex-shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Qualità Top</div>
                <div className="text-[10px] text-slate-400">100% Originale</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex-shrink-0">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Reso Semplice</div>
                <div className="text-[10px] text-slate-400">Entro 14 giorni</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
