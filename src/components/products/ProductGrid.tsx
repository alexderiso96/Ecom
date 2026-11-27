import React from 'react';
import { Product } from '@/types/database.types';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = 'Nessun articolo risponde ai criteri di ricerca selezionati.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-stone-200/80 bg-white/60 dark:border-stone-800 dark:bg-stone-900/40 p-16 text-center my-10 max-w-xl mx-auto">
        <Sparkles className="h-6 w-6 text-[#B8915D] stroke-[1.2] mb-3" />
        <h3 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
          Nessuna Creazione Trovata
        </h3>
        <p className="text-xs font-light text-stone-500 mt-1 max-w-sm leading-relaxed">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8 lg:gap-y-14">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
