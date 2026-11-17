'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
    }
    if (queryFromUrl !== undefined) {
      setSearchQuery(queryFromUrl);
    }
  }, [searchParams]);

  // Filtro e ordinamento dinamico
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Filtro Categoria
        if (selectedCategory) {
          const categorySlug = product.category?.slug;
          if (categorySlug !== selectedCategory) return false;
        }

        // Filtro Ricerca
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

  return (
    <div className="container py-12 md:py-16">
      {/* Header Editoriale */}
      <div className="mb-10 text-left border-b border-stone-200/80 dark:border-stone-800/80 pb-6">
        <span className="text-[10px] tracking-[0.24em] font-semibold text-[#C5A880] uppercase block mb-2">
          ✦ Collezione Aura Atelier
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-stone-900 dark:text-stone-50 tracking-tight">
          Il Catalogo Completo
        </h1>
        <p className="text-xs sm:text-sm font-light text-stone-500 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">
          Esplora creazioni uniche tra gioielli scultorei, borse in morbida pelle e raffinati accessori di stile. Ogni acquisto include l'assistenza personale su WhatsApp.
        </p>
      </div>

      {/* Componente Filtri */}
      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Risultati Conteggio Discreto */}
      <div className="mb-8 flex items-center justify-between text-xs tracking-[0.14em] uppercase text-stone-500 dark:text-stone-400 font-medium">
        <span>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'Creazione disponibile' : 'Creazioni disponibili'}
        </span>
      </div>

      <ProductGrid
        products={filteredProducts}
        emptyMessage="Nessun articolo corrisponde ai criteri selezionati. Modifica i filtri o la ricerca per esplorare le altre collezioni."
      />
    </div>
  );
}
