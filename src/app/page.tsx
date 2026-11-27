import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types/database.types';
import { Hero } from '@/components/home/Hero';
import { ProductGrid } from '@/components/products/ProductGrid';

const collections = [
  { name: 'Ombrelli', slug: 'ombrelli', image: 'ombrelli.jpg' },
  { name: 'Pochette', slug: 'pochette', image: 'ricami.jpg' },
  { name: 'Bijoux', slug: 'gioielli', image: 'bijoux.jpg' },
  { name: 'Tazze', slug: 'tazze', image: 'tazze.jpg' },
];

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featuredProducts: Product[] = [];
  let visibleCollections: typeof collections = [];
  try {
    const supabase = createClient();
    const [featured, available] = await Promise.all([
      supabase.from('products')
        .select('*, category:categories(*)')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('categories')
        .select('slug, products!inner(id)')
        .in('slug', collections.map(({ slug }) => slug))
        .eq('products.is_active', true)
        .limit(1, { referencedTable: 'products' }),
    ]);

    featuredProducts = featured.data ?? [];
    const availableSlugs = new Set(available.data?.map(({ slug }) => slug));
    visibleCollections = collections.filter(({ slug }) => availableSlugs.has(slug));
  } catch (error) {
    console.error('Errore caricamento dati home:', error);
  }

  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  return (
    <div className="space-y-16 sm:space-y-24">
      <Hero />

      {visibleCollections.length > 0 && (
        <section className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 dark:text-stone-50 tracking-tight">
                Le collezioni
              </h2>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-xs tracking-[0.16em] uppercase font-semibold text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
            >
              <span>Tutto il catalogo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {visibleCollections.map((category) => (
              <Link
                key={category.slug}
                href={`/catalog?category=${category.slug}`}
                className="group relative overflow-hidden aspect-[4/5] bg-stone-100 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 transition-all duration-500 hover:shadow-luxury rounded-2xl"
              >
                <Image
                  src={`/dream-creation/${category.image}`}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1023px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent transition-opacity group-hover:opacity-90" />

                <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-end text-white">
                  <h3 className="font-serif text-lg sm:text-2xl font-normal text-white group-hover:text-[#F1E8DC] transition-colors tracking-wide">
                    {category.name}
                  </h3>
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium">
                    <span>Esplora Selezione</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 dark:text-stone-50 tracking-tight">
                Creazioni in Evidenza
              </h2>
            </div>

            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-xs tracking-[0.16em] uppercase font-semibold text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
            >
              <span>Catalogo Completo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ProductGrid products={featuredProducts} />
        </section>
      )}

      <section className="container">
        <div className="relative overflow-hidden bg-[#251C19] p-10 sm:p-16 text-white border border-[#B8915D]/30 shadow-luxury">
          <div className="relative z-10 max-w-2xl space-y-5 text-left">
            <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-[1.12]">
              Hai in mente un regalo personalizzato?
            </h3>

            <p className="text-xs sm:text-sm font-light text-stone-400 leading-relaxed">
              Raccontaci cosa vorresti personalizzare. Ti aiutiamo a scegliere i dettagli e ti diamo informazioni su costi e spedizione.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve! Vorrei un consiglio per un ordine su misura.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#D7B47D] px-6 text-sm font-semibold text-stone-950 hover:bg-[#F1E8DC]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Avvia Chat WhatsApp</span>
              </a>

              <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-stone-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#B8915D]" />
                <span>Risposta dedicata & senza registrazione</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
