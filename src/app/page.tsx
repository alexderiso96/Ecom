import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Product, Category } from '@/types/database.types';
import { Hero } from '@/components/home/Hero';
import { ProductGrid } from '@/components/products/ProductGrid';

// Fallback mockup allineati al target: Gioielli & Borse femminili + Accessori maschili d'alta gamma
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Gioielli & Bijoux',
    slug: 'gioielli',
    description: 'Anelli scultorei, collane e bracciali rifiniti con metalli preziosi',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Borse & Pelletteria',
    slug: 'borse',
    description: 'Borse a mano e tote in pelle pieno fiore conciata naturalmente',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Accessori Donna & Uomo',
    slug: 'accessori',
    description: 'Portafogli, cinture e dettagli di stile per completare ogni outfit',
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=85',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const FALLBACK_FEATURED: Product[] = [
  {
    id: 'p1',
    category_id: '1',
    name: 'Collana Choker Aurora in Oro 18k',
    slug: 'collana-choker-aurora-oro',
    description: 'Design minimale con maglia fluida bagnata in oro 18 carati e chiusura invisibile.',
    price: 320.0,
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
    stock: 8,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '1',
      name: 'Gioielli',
      slug: 'gioielli',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'p2',
    category_id: '2',
    name: 'Borsa Tote Sartoriale in Pelle',
    slug: 'borsa-tote-sartoriale-pelle',
    description: 'Pelle di vitello italiano con fodera in cotone organico e finiture metalliche in oro chiaro.',
    price: 460.0,
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85',
    stock: 5,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '2',
      name: 'Borse',
      slug: 'borse',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'p3',
    category_id: '1',
    name: 'Bracciale Rigido Scultoreo in Argento 925',
    slug: 'bracciale-rigido-scultoreo',
    description: 'Forma organica martellata a mano per un riflesso di luce unico e sofisticato.',
    price: 210.0,
    image_url: 'https://images.unsplash.com/photo-1611591475155-42e9fba5ce55?auto=format&fit=crop&w=800&q=85',
    stock: 12,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '1',
      name: 'Gioielli',
      slug: 'gioielli',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 'p4',
    category_id: '3',
    name: 'Portafoglio Bifold Uomo in Cuoio Nobile',
    slug: 'portafoglio-bifold-uomo-cuoio',
    description: 'Cuoio spazzolato a mano, 8 slot porta carte e scomparto banconote rifinito con precisione.',
    price: 135.0,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=85',
    stock: 9,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: '3',
      name: 'Accessori',
      slug: 'accessori',
      description: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    },
  },
];

export const dynamic = 'force-dynamic';

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
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Haute Couture Hero Section */}
      <Hero />

      {/* 2. Categorie Iconiche */}
      <section className="container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
          <div>
            <span className="text-[10px] tracking-[0.24em] font-semibold text-[#C5A880] uppercase block mb-2">
              ✦ Collezioni Iconiche
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 dark:text-stone-50 tracking-tight">
              L'Arte della Materia
            </h2>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-xs tracking-[0.16em] uppercase font-semibold text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
          >
            <span>Tutte le Categorie</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.slice(0, 3).map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className="group relative overflow-hidden aspect-[4/5] bg-stone-100 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 transition-all duration-500 hover:shadow-luxury"
            >
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover filter saturate-[0.95] transition-transform duration-1000 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-stone-200" />
              )}
              {/* Overlay Gradient Editoriale */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent transition-opacity group-hover:opacity-90" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <span className="text-[9px] tracking-[0.26em] uppercase text-[#EFE6D8] font-medium block mb-1">
                  Atelier
                </span>
                <h3 className="font-serif text-2xl font-normal text-white group-hover:text-[#EFE6D8] transition-colors tracking-wide">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs font-light text-stone-300 line-clamp-1 mt-1">
                    {category.description}
                  </p>
                )}
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium">
                  <span>Esplora Selezione</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Creazioni in Evidenza */}
      <section className="container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
          <div>
            <span className="text-[10px] tracking-[0.24em] font-semibold text-[#C5A880] uppercase block mb-2">
              ✦ Selezione Curata
            </span>
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

      {/* 4. Luxury Concierge WhatsApp Experience */}
      <section className="container">
        <div className="relative overflow-hidden bg-[#1C1917] p-10 sm:p-16 text-white border border-[#C5A880]/30 shadow-luxury">
          <div className="relative z-10 max-w-2xl space-y-5 text-left">
            <span className="text-[10px] tracking-[0.26em] uppercase font-semibold text-[#C5A880] block">
              ✦ Esperienza Sartoriale
            </span>

            <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-[1.12]">
              L'Assistenza Personale del tuo Concierge Privato.
            </h3>

            <p className="text-xs sm:text-sm font-light text-stone-400 leading-relaxed">
              Desideri una consulenza su una misura d'anello, consigli di abbinamento per un regalo o una spedizione speciale? Scegli i tuoi articoli e dialoga direttamente su WhatsApp con la nostra boutique.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve! Vorrei un consiglio per un ordine su misura.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <button
                  type="button"
                  className="h-12 px-8 bg-[#C5A880] text-stone-950 hover:bg-[#EFE6D8] text-xs tracking-[0.2em] uppercase font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Avvia Chat WhatsApp</span>
                </button>
              </a>

              <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-stone-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#C5A880]" />
                <span>Risposta dedicata & senza registrazione</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
