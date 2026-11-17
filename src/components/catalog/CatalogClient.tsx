'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Product, Category } from '@/types/database.types';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductGrid } from '@/components/products/ProductGrid';

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export function CatalogClient({
  initialProducts,
  categories,
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get('category');
  const initialQueryParam = searchParams.get('q') || searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategoryParam || null
  );
  const [searchQuery, setSearchQuery] = useState(initialQueryParam);
  const [sortBy, setSortBy] = useState('featured');

  // Sincronizza lo stato quando l'utente naviga o cerca dall'header
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const queryFromUrl = searchParams.get('q') || searchParams.get('search') || '';
    if (categoryFromUrl !== null) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory(null);
    }
    if (queryFromUrl !== undefined) {
      setSearchQuery(queryFromUrl);
    }
  }, [searchParams]);

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    if (categorySlug) {
      router.push(`/catalog?category=${encodeURIComponent(categorySlug)}`, { scroll: false });
    } else {
      router.push('/catalog', { scroll: false });
    }
  };

  // Filtro e ordinamento dinamico con matching semantico
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // 1. Filtro Categoria Intelligente
        if (selectedCategory) {
          const target = selectedCategory.toLowerCase().trim();
          const catSlug = product.category?.slug?.toLowerCase() || '';
          const catName = product.category?.name?.toLowerCase() || '';
          const prodName = product.name?.toLowerCase() || '';
          const prodDesc = product.description?.toLowerCase() || '';

          // Corrispondenza diretta esatta (slug o id)
          if (catSlug === target || product.category_id === target) return true;

          // Corrispondenza semantica "gioielli"
          if (target === 'gioielli') {
            if (catSlug.includes('gioiell') || catSlug.includes('orolog') || catName.includes('gioiell')) return true;
            if (
              prodName.includes('collana') ||
              prodName.includes('anello') ||
              prodName.includes('braccial') ||
              prodName.includes('choker') ||
              prodName.includes('orecchin') ||
              prodName.includes('gioiell') ||
              prodName.includes('oro') ||
              prodName.includes('argento') ||
              prodName.includes('titanio')
            ) return true;
          }

          // Corrispondenza semantica "borse"
          if (target === 'borse') {
            if (catSlug.includes('bors') || catSlug.includes('pelletteria') || catName.includes('bors') || catName.includes('pelletteria')) return true;
            if (
              prodName.includes('borsa') ||
              prodName.includes('zaino') ||
              prodName.includes('tote') ||
              prodName.includes('clutch') ||
              prodName.includes('tracolla') ||
              prodName.includes('bauletto') ||
              prodName.includes('pelle') ||
              prodDesc.includes('borsa') ||
              prodDesc.includes('zaino')
            ) return true;
          }

          // Corrispondenza semantica "donna"
          if (target === 'donna') {
            if (catSlug.includes('donna') || catName.includes('donna') || catSlug.includes('femm')) return true;
            if (prodName.includes('donna') || prodDesc.includes('donna') || prodDesc.includes('femminil')) return true;
            // Nella boutique, gioielli, borse, bijoux e capi femminili rientrano nel reparto Donna
            if (
              catSlug.includes('gioiell') ||
              catSlug.includes('bors') ||
              prodName.includes('collana') ||
              prodName.includes('borsa') ||
              prodName.includes('anello') ||
              prodName.includes('choker') ||
              prodName.includes('felpa') ||
              prodName.includes('t-shirt')
            ) return true;
          }

          // Corrispondenza semantica "uomo"
          if (target === 'uomo') {
            if (catSlug.includes('uomo') || catName.includes('uomo') || catSlug.includes('masch')) return true;
            if (prodName.includes('uomo') || prodDesc.includes('uomo') || prodDesc.includes('maschil')) return true;
            // Accessori maschili d'alta gamma: portafogli, cinture, orologi titanio, giacche e cargo
            if (
              prodName.includes('portafoglio') ||
              prodName.includes('cintura') ||
              prodName.includes('titanio') ||
              prodName.includes('orologio') ||
              prodName.includes('giacca') ||
              prodName.includes('cargo') ||
              prodName.includes('techwear')
            ) return true;
          }

          // Corrispondenza parziale per qualsiasi altra categoria
          if (catSlug.includes(target) || catName.includes(target)) return true;

          return false;
        }

        // 2. Filtro Ricerca
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q) || false;
          const matchCat = product.category?.name.toLowerCase().includes(q) || false;
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return Number(a.price) - Number(b.price);
        }
        if (sortBy === 'price-desc') {
          return Number(b.price) - Number(a.price);
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // default 'featured'
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  // Titolo della categoria attiva per l'header
  const activeCategoryTitle = useMemo(() => {
    if (!selectedCategory) return null;
    const cat = categories.find((c) => c.slug === selectedCategory);
    if (cat) return cat.name;
    const labels: Record<string, string> = {
      gioielli: 'Gioielli & Bijoux',
      borse: 'Borse & Pelletteria',
      donna: 'Collezione Donna',
      uomo: 'Accessori Uomo',
    };
    return labels[selectedCategory.toLowerCase()] || selectedCategory;
  }, [selectedCategory, categories]);

  return (
    <div className="container py-12 md:py-16">
      {/* Header Editoriale */}
      <div className="mb-10 text-left border-b border-stone-200/80 dark:border-stone-800/80 pb-6">
        <span className="text-[10px] tracking-[0.24em] font-semibold text-[#C5A880] uppercase block mb-2">
          ✦ Collezione Aura Atelier
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-stone-900 dark:text-stone-50 tracking-tight">
          {activeCategoryTitle || 'Il Catalogo Completo'}
        </h1>
        <p className="text-xs sm:text-sm font-light text-stone-500 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">
          {activeCategoryTitle
            ? `Esplora la nostra selezione dedicata a ${activeCategoryTitle}. Ogni creazione è realizzata con materiali pregiati e include l'assistenza personale su WhatsApp.`
            : "Esplora creazioni uniche tra gioielli scultorei, borse in morbida pelle e raffinati accessori di stile. Ogni acquisto include l'assistenza personale su WhatsApp."}
        </p>
      </div>

      {/* Componente Filtri */}
      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Risultati Conteggio Discreto & Filtro Attivo */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-xs tracking-[0.14em] uppercase text-stone-500 dark:text-stone-400 font-medium">
        <div className="flex items-center gap-2">
          <span>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Creazione disponibile' : 'Creazioni disponibili'}
          </span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[10px] tracking-normal font-sans font-medium">
              <span>{activeCategoryTitle}</span>
              <button
                type="button"
                onClick={() => handleCategorySelect(null)}
                className="hover:text-stone-950 dark:hover:text-white"
                title="Rimuovi filtro"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {searchQuery && (
          <span className="text-[11px] font-normal tracking-normal text-stone-400 font-sans">
            Filtro ricerca: "{searchQuery}"
          </span>
        )}
      </div>

      <ProductGrid
        products={filteredProducts}
        emptyMessage="Nessun articolo corrisponde ai criteri selezionati. Modifica i filtri o la ricerca per esplorare le altre collezioni."
      />
    </div>
  );
}
