'use client';

import React from 'react';
import Image from 'next/image';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { Category } from '@/types/database.types';

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categorySlug: string | null) => void;
  selectedDepartment: 'donna' | 'uomo' | null;
  onSelectDepartment: (dept: 'donna' | 'uomo' | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

interface VisualCategoryCard {
  label: string;
  subtitle: string;
  slug: string | null;
  image: string;
}

const VISUAL_CATEGORIES: VisualCategoryCard[] = [
  {
    label: 'Tutte le Creazioni',
    subtitle: 'Catalogo completo',
    slug: null,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Bijoux',
    subtitle: 'Orecchini, collane e bracciali',
    slug: 'gioielli',
    image: '/dream-creation/bijoux.jpg',
  },
  {
    label: 'Borse e pochette',
    subtitle: 'Borse, pochette e tracolle',
    slug: 'borse',
    image: '/dream-creation/ricami.jpg',
  },
  {
    label: 'Ombrelli',
    subtitle: 'Iniziali ricamate',
    slug: 'ombrelli',
    image: '/dream-creation/ombrelli.jpg',
  },
  {
    label: 'Tazze',
    subtitle: 'Idee da personalizzare',
    slug: 'tazze',
    image: '/dream-creation/tazze.jpg',
  },
  {
    label: 'Accessori di Stile',
    subtitle: 'Portafogli, Cinture, Orologi',
    slug: 'accessori',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=85',
  },
];

export function ProductFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedDepartment,
  onSelectDepartment,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) {
  // Categorie custom da Supabase che non rientrano nelle 3 macro-categorie
  const customCategories = categories.filter((c) => {
    const s = c.slug.toLowerCase();
    return !['gioielli', 'borse', 'ombrelli', 'tazze', 'accessori', 'donna', 'uomo'].includes(s);
  });

  return (
    <div className="space-y-6 my-8 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
      
      {/* 1. Barra Superiore: Selettore Reparto (Genere) + Ricerca + Ordinamento */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200/60 dark:border-stone-800/60">
        
        {/* Selettore Reparto Donna / Uomo (Estrapolato dalle categorie) */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-stone-400">
            Reparto:
          </span>
          <div className="inline-flex items-center p-0.5 border border-stone-300/80 dark:border-stone-700 bg-stone-100/70 dark:bg-stone-900/70 text-xs">
            <button
              type="button"
              onClick={() => onSelectDepartment(null)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase font-medium transition-all ${
                selectedDepartment === null
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => onSelectDepartment('donna')}
              className={`px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase font-medium transition-all ${
                selectedDepartment === 'donna'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              Donna
            </button>
            <button
              type="button"
              onClick={() => onSelectDepartment('uomo')}
              className={`px-3 py-1.5 text-[10px] tracking-[0.16em] uppercase font-medium transition-all ${
                selectedDepartment === 'uomo'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
              }`}
            >
              Uomo
            </button>
          </div>
        </div>

        {/* Ricerca e Ordinamento */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Campo di Ricerca */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca pezzo o materiale..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-[#B8915D] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                title="Azzera testo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Ordinamento */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.18em] uppercase text-stone-400 font-medium hidden sm:inline">
              Ordina:
            </span>
            <div className="relative inline-flex items-center">
              <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="pl-7 pr-6 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[10px] tracking-[0.1em] font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-900 dark:focus:border-[#B8915D] cursor-pointer transition-colors"
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

      {/* 2. Visual Editorial Category Showcase Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] tracking-[0.24em] uppercase font-semibold text-stone-400">
            Categorie di Creazione
          </span>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-[10px] tracking-[0.14em] uppercase text-[#B8915D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Mostra tutte</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {VISUAL_CATEGORIES.map((card) => {
            const isSelected = selectedCategory === card.slug;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : card.slug)}
                className={`group relative overflow-hidden h-24 sm:h-28 text-left p-3.5 flex flex-col justify-end border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-[#B8915D] ring-2 ring-[#B8915D]/30 shadow-luxury'
                    : 'border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                }`}
              >
                {/* Immagine di sfondo */}
                <Image
                  src={card.image}
                  alt={card.label}
                  fill
                  className="object-cover object-center filter saturate-[0.9] transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />

                {/* Sfumatura scura per leggibilità */}
                <div className={`absolute inset-0 transition-opacity ${
                  isSelected
                    ? 'bg-stone-950/75'
                    : 'bg-stone-950/60 group-hover:bg-stone-950/70'
                }`} />

                {/* Contenuto Testuale */}
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-serif text-xs sm:text-sm font-normal tracking-wide text-white leading-tight">
                      {card.label}
                    </h3>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B8915D]" />
                    )}
                  </div>
                  <p className="text-[9px] text-[#F1E8DC] font-light tracking-wide mt-0.5 line-clamp-1">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Categorie Aggiuntive dal DB (se presenti) */}
        {customCategories.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 overflow-x-auto scrollbar-none">
            <span className="text-[10px] tracking-[0.16em] uppercase text-stone-400 flex-shrink-0">
              Altre:
            </span>
            {customCategories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : cat.slug)}
                  className={`flex-shrink-0 px-3 py-1 text-[10px] tracking-[0.14em] uppercase border transition-all ${
                    isSelected
                      ? 'border-[#B8915D] bg-[#B8915D] text-stone-950 font-semibold'
                      : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-900'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
