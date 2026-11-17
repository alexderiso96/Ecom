'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Category } from '@/types/database.types';

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categorySlug: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function ProductFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) {
  // Categorie boutique fisse allineate alla Navbar e al catalogo di lusso
  const baseTabs = [
    { label: 'Tutte le Creazioni', slug: null },
    { label: 'Gioielli', slug: 'gioielli' },
    { label: 'Borse', slug: 'borse' },
    { label: 'Donna', slug: 'donna' },
    { label: 'Uomo', slug: 'uomo' },
  ];

  // Aggiungi eventuali categorie personalizzate create da admin nel database che non sono già nelle baseTabs
  const extraTabs = categories.filter((c) => {
    const s = c.slug.toLowerCase();
    return !['gioielli', 'borse', 'donna', 'uomo'].includes(s);
  });

  return (
    <div className="space-y-6 my-8 border-b border-stone-200/80 dark:border-stone-800/80 pb-6">
      {/* 1. Category Bar - Horizontal Minimalist Luxury Tabs */}
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200/50 dark:border-stone-800/50">
        {baseTabs.map((tab) => {
          const isSelected = selectedCategory === tab.slug;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onSelectCategory(tab.slug)}
              className={`flex-shrink-0 text-[11px] tracking-[0.2em] uppercase transition-all duration-200 pb-2 relative cursor-pointer ${
                isSelected
                  ? 'text-stone-950 dark:text-white font-semibold'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 font-normal'
              }`}
            >
              <span>{tab.label}</span>
              {isSelected && (
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C5A880]" />
              )}
            </button>
          );
        })}

        {/* Categorie aggiuntive da DB */}
        {extraTabs.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`flex-shrink-0 text-[11px] tracking-[0.2em] uppercase transition-all duration-200 pb-2 relative cursor-pointer ${
                isSelected
                  ? 'text-stone-950 dark:text-white font-semibold'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 font-normal'
              }`}
            >
              <span>{cat.name}</span>
              {isSelected && (
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C5A880]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Search & Sort Secondary Action Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pt-1">
        
        {/* Minimal Search Field */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca per articolo o materiale..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs font-light text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-[#C5A880] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              title="Azzera ricerca"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-[10px] tracking-[0.18em] uppercase text-stone-400 font-medium hidden sm:inline">
            Ordina:
          </span>
          <div className="relative inline-flex items-center">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="pl-8 pr-8 py-2 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-[11px] tracking-[0.08em] font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-900 dark:focus:border-[#C5A880] cursor-pointer transition-colors"
            >
              <option value="featured">In Evidenza</option>
              <option value="newest">Nuovi Arrivi</option>
              <option value="price-asc">Prezzo: Crescente</option>
              <option value="price-desc">Prezzo: Decrescente</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
