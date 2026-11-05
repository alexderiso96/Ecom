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
  return (
    <div className="space-y-4 my-8">
      {/* Search Bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Floating Pill Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca prodotti per nome o parola chiave..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-slate-200/70 bg-white/80 pl-11 pr-10 py-2.5 text-xs font-medium text-slate-900 shadow-xs placeholder:text-slate-400 backdrop-blur-md focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select Pill */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="relative inline-flex items-center">
            <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-full border border-slate-200/70 bg-white/80 pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 cursor-pointer transition-all"
            >
              <option value="featured">In evidenza</option>
              <option value="price-asc">Prezzo: dal più basso</option>
              <option value="price-desc">Prezzo: dal più alto</option>
              <option value="newest">Più recenti</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-none">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
            selectedCategory === null
              ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10 dark:bg-white dark:text-slate-900'
              : 'bg-white/80 border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-300 backdrop-blur-sm shadow-xs dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          Tutte le Categorie
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10 dark:bg-white dark:text-slate-900'
                  : 'bg-white/80 border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-300 backdrop-blur-sm shadow-xs dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
