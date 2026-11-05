import React from 'react';
import { Product } from '@/types/database.types';
import { ProductCard } from './ProductCard';
import { PackageOpen } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = 'Nessun prodotto trovato.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/40 dark:border-slate-800 dark:bg-slate-900/40 p-12 text-center my-8 backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 mb-4">
          <PackageOpen className="h-8 w-8 stroke-[1.4]" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Nessun articolo disponibile
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
