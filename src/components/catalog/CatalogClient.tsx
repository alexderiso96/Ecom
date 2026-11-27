'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, Sparkles } from 'lucide-react';
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
  const initialDepartmentParam = (searchParams.get('department') as 'donna' | 'uomo' | null) || null;
  const initialQueryParam = searchParams.get('q') || searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategoryParam || null
  );
  const [selectedDepartment, setSelectedDepartment] = useState<'donna' | 'uomo' | null>(
    initialDepartmentParam
  );
  const [searchQuery, setSearchQuery] = useState(initialQueryParam);
  const [sortBy, setSortBy] = useState('featured');

  // Sincronizza lo stato dai parametri URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const departmentFromUrl = (searchParams.get('department') as 'donna' | 'uomo' | null) || null;
    const queryFromUrl = searchParams.get('q') || searchParams.get('search') || '';

    setSelectedCategory(categoryFromUrl || null);
    setSelectedDepartment(departmentFromUrl);
    if (queryFromUrl !== undefined) {
      setSearchQuery(queryFromUrl);
    }
  }, [searchParams]);

  // Aggiorna l'URL preservando i filtri attivi
  const updateUrl = (newCat: string | null, newDept: 'donna' | 'uomo' | null) => {
    const params = new URLSearchParams();
    if (newCat) params.set('category', newCat);
    if (newDept) params.set('department', newDept);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const str = params.toString();
    router.push(str ? `/catalog?${str}` : '/catalog', { scroll: false });
  };

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    updateUrl(categorySlug, selectedDepartment);
  };

  const handleDepartmentSelect = (dept: 'donna' | 'uomo' | null) => {
    setSelectedDepartment(dept);
    updateUrl(selectedCategory, dept);
  };

  // Filtro combinato per Reparto + Categoria + Ricerca + Ordinamento
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        const catSlug = product.category?.slug?.toLowerCase() || '';
        const catName = product.category?.name?.toLowerCase() || '';
        const prodName = product.name?.toLowerCase() || '';
        const prodDesc = product.description?.toLowerCase() || '';

        // 1. Filtro Reparto (Donna / Uomo)
        if (selectedDepartment === 'uomo') {
          const isMen =
            catSlug.includes('uomo') ||
            catName.includes('uomo') ||
            catSlug.includes('masch') ||
            prodName.includes('uomo') ||
            prodDesc.includes('uomo') ||
            prodDesc.includes('maschil') ||
            prodName.includes('portafoglio') ||
            prodName.includes('cintura') ||
            prodName.includes('titanio') ||
            prodName.includes('techwear') ||
            prodName.includes('cargo') ||
            prodName.includes('bifold');
          if (!isMen) return false;
        }

        if (selectedDepartment === 'donna') {
          // Escludi articoli esplicitamente maschili
          const isMenExclusive =
            prodName.includes('uomo') ||
            prodName.includes('bifold') ||
            (prodName.includes('portafoglio') && prodDesc.includes('uomo'));
          if (isMenExclusive) return false;

          const isWomen =
            catSlug.includes('donna') ||
            catName.includes('donna') ||
            catSlug.includes('gioiell') ||
            catSlug.includes('bors') ||
            prodName.includes('donna') ||
            prodName.includes('collana') ||
            prodName.includes('anello') ||
            prodName.includes('braccial') ||
            prodName.includes('choker') ||
            prodName.includes('borsa') ||
            prodName.includes('tote') ||
            prodName.includes('baguette') ||
            prodName.includes('felpa');
          if (!isWomen) return false;
        }

        if (selectedCategory && catSlug !== selectedCategory && product.category_id !== selectedCategory) {
          return false;
        }

        // 3. Filtro Ricerca
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = prodName.includes(q);
          const matchDesc = prodDesc.includes(q);
          const matchCat = catName.includes(q);
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
  }, [initialProducts, selectedCategory, selectedDepartment, searchQuery, sortBy]);

  // Titoli leggibili per l'header dinamico
  const activeCategoryLabel = useMemo(() => {
    if (!selectedCategory) return null;
    const catMap: Record<string, string> = {
      gioielli: 'Bijoux',
      pochette: 'Pochette',
      ombrelli: 'Ombrelli',
      tazze: 'Tazze',
      accessori: 'Accessori di Stile',
    };
    return catMap[selectedCategory.toLowerCase()] || categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory;
  }, [selectedCategory, categories]);

  const activeDepartmentLabel = useMemo(() => {
    if (!selectedDepartment) return null;
    return selectedDepartment === 'donna' ? 'Collezione Donna' : 'Accessori Uomo';
  }, [selectedDepartment]);

  return (
    <div className="container py-12 md:py-16">
      {/* Header Editoriale */}
      <div className="mb-10 text-left border-b border-stone-200/80 dark:border-stone-800/80 pb-6">
        <span className="text-[10px] tracking-[0.24em] font-semibold text-[#B8915D] uppercase block mb-2">
          Dream Creation
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-stone-900 dark:text-stone-50 tracking-tight">
          {activeCategoryLabel && activeDepartmentLabel
            ? `${activeCategoryLabel} — ${activeDepartmentLabel}`
            : activeCategoryLabel || activeDepartmentLabel || 'Le Nostre Creazioni'}
        </h1>
        <p className="text-xs sm:text-sm font-light text-stone-500 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">
          Scopri bijoux e accessori. Scrivici su WhatsApp per personalizzazioni, costi e spedizione.
        </p>
      </div>

      {/* Componente Filtri Ridisegnato (Reparto + Card Visive Categorie) */}
      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        selectedDepartment={selectedDepartment}
        onSelectDepartment={handleDepartmentSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Barra Informativa dei Filtri Attivi */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-xs tracking-[0.14em] uppercase text-stone-500 dark:text-stone-400 font-medium">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Creazione disponibile' : 'Creazioni disponibili'}
          </span>

          {/* Badge Reparto Attivo */}
          {selectedDepartment && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[10px] tracking-normal font-sans font-medium">
              <span>Reparto: <strong>{selectedDepartment === 'donna' ? 'Donna' : 'Uomo'}</strong></span>
              <button
                type="button"
                onClick={() => handleDepartmentSelect(null)}
                className="hover:text-stone-950 dark:hover:text-white"
                title="Rimuovi filtro reparto"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Badge Categoria Attiva */}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[10px] tracking-normal font-sans font-medium">
              <span>Categoria: <strong>{activeCategoryLabel}</strong></span>
              <button
                type="button"
                onClick={() => handleCategorySelect(null)}
                className="hover:text-stone-950 dark:hover:text-white"
                title="Rimuovi filtro categoria"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Reset Totale se ci sono filtri attivi */}
          {(selectedCategory || selectedDepartment || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedDepartment(null);
                setSearchQuery('');
                router.push('/catalog', { scroll: false });
              }}
              className="text-[10px] font-sans font-medium text-[#B8915D] hover:underline ml-2"
            >
              Azzera tutti i filtri
            </button>
          )}
        </div>

        {searchQuery && (
          <span className="text-[11px] font-normal tracking-normal text-stone-400 font-sans">
            Ricerca: &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Griglia Prodotti */}
      <ProductGrid
        products={filteredProducts}
        emptyMessage="Nessun articolo corrisponde ai filtri selezionati."
      />
    </div>
  );
}
