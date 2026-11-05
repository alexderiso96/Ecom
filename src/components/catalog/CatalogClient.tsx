'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
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

  // Sincronizza lo stato quando l'utente cerca dalla barra di navigazione
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
    <div className="container py-10 md:py-14">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100/90 text-slate-700 border border-slate-200/70 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-300 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Collezione Completa
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Catalogo Aura
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl font-normal leading-relaxed">
          Esplora la nostra selezione di articoli dal design minimale. Aggiungi i prodotti al carrello e finalizza l'acquisto direttamente via WhatsApp con il nostro staff.
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

      {/* Risultati Badge */}
      <div className="mb-6 flex items-center justify-between">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/80 border border-slate-200/70 text-slate-600 shadow-xs backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-300">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'prodotto trovato' : 'prodotti trovati'}
        </span>
      </div>

      <ProductGrid
        products={filteredProducts}
        emptyMessage="Nessun articolo corrisponde ai criteri selezionati. Prova a modificare i filtri o la ricerca."
      />
    </div>
  );
}
