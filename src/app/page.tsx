import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Layers, MessageCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Product, Category } from '@/types/database.types';
import { Hero } from '@/components/home/Hero';
import { ProductGrid } from '@/components/products/ProductGrid';

// Mock fallback se il DB Supabase non è ancora connesso o è vuoto
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Abbigliamento',
    slug: 'abbigliamento',
    description: 'Capi contemporanei con tessuti pregiati e vestibilità ottimale',
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Accessori & Orologi',
    slug: 'accessori',
    description: 'Borse in pelle, orologi e dettagli che fanno la differenza',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Tech & Audio',
    slug: 'tech-audio',
    description: 'Dispositivi audio ad alta fedeltà e accessori smart da scrivania',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const FALLBACK_FEATURED: Product[] = [
  {
    id: 'p1',
    category_id: '3',
    name: 'Cuffie Wireless Hi-Fi Studio Pro',
    slug: 'cuffie-wireless-hi-fi-studio-pro',
    description: 'Cancellazione attiva del rumore e driver in grafene da 40mm con autonomia di 40 ore.',
    price: 249.99,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '3',
      name: 'Tech & Audio',
      slug: 'tech-audio',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'p2',
    category_id: '2',
    name: 'Zaino Minimalista Urban Waterproof',
    slug: 'zaino-minimalista-urban',
    description: 'Tessuto idrorepellente riciclato con scomparto imbottito per laptop da 16 pollici.',
    price: 119.0,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    stock: 28,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '2',
      name: 'Accessori & Orologi',
      slug: 'accessori',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'p3',
    category_id: '2',
    name: 'Orologio Cronografo Titanio Stealth',
    slug: 'orologio-cronografo-titanio',
    description: 'Cassa in titanio grado aeronautico e cinturino in pelle primo fiore.',
    price: 340.0,
    image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    stock: 7,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '2',
      name: 'Accessori & Orologi',
      slug: 'accessori',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'p4',
    category_id: '1',
    name: 'Giacca a Vento Modulare Techwear',
    slug: 'giacca-vento-modulare',
    description: 'Impermeabilità 20k, traspirabilità eccellente e cuciture termosaldate.',
    price: 189.5,
    image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '1',
      name: 'Abbigliamento',
      slug: 'abbigliamento',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
];

export const revalidate = 60; // Revalidate ISR ogni 60 secondi

export default async function HomePage() {
  let featuredProducts: Product[] = [];
  let categories: Category[] = [];

  try {
    const supabase = createClient();

    // Query categorie
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (catData && catData.length > 0) {
      categories = catData;
    } else {
      categories = FALLBACK_CATEGORIES;
    }

    // Query prodotti in evidenza
    const { data: prodData } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (prodData && prodData.length > 0) {
      featuredProducts = prodData;
    } else {
      featuredProducts = FALLBACK_FEATURED;
    }
  } catch (error) {
    console.error('Errore caricamento dati home:', error);
    categories = FALLBACK_CATEGORIES;
    featuredProducts = FALLBACK_FEATURED;
  }

  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  return (
    <div className="space-y-4">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Categorie in Evidenza */}
      <section className="container py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50/80 text-indigo-600 border border-indigo-200/60 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-400 mb-3">
              <Layers className="h-3.5 w-3.5" /> Esplora per Settore
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Collezioni Selezionate
            </h2>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/80 bg-white/80 hover:bg-white hover:border-slate-300 text-xs font-bold text-slate-700 hover:text-slate-900 shadow-xs backdrop-blur-sm transition-all dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
          >
            <span>Tutte le collezioni</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 3).map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className="group relative overflow-hidden rounded-3xl h-72 border border-slate-200/70 bg-slate-900 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-500 dark:border-slate-800"
            >
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover opacity-85 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-95"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-slate-800" />
              )}
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20 mb-2">
                  Collezione
                </span>
                <h3 className="text-xl font-black text-white group-hover:text-indigo-200 transition-colors tracking-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-normal">
                    {category.description}
                  </p>
                )}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90">
                    Esplora articoli
                  </span>
                  <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Prodotti in Evidenza */}
      <section className="container py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100/90 text-slate-700 border border-slate-200/70 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-300 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Scelti per te
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Prodotti in Evidenza
            </h2>
          </div>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200/80 bg-white/80 hover:bg-white hover:border-slate-300 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-sm transition-all dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-200"
          >
            <span>Tutto il Catalogo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} />
      </section>

      {/* 4. Luxury WhatsApp Checkout Banner */}
      <section className="container my-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 sm:p-14 text-white shadow-2xl border border-slate-800">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero Frizioni • Assistenza Umana Dedicata</span>
            </div>

            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]">
              Acquista in 1-Click direttamente su WhatsApp.
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Hai richieste particolari, preferenze di orario o vuoi concordare un metodo di pagamento personalizzato? Seleziona gli articoli nel carrello, clicca su Procedi e dialoga immediatamente con il nostro team.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 h-12 text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span>Inizia lo Shopping</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Nessuna carta richiesta in anticipo</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
