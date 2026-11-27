'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowLeft, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { ProductCard } from '@/components/products/ProductCard';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  const handleMoveAllToCart = () => {
    items.forEach((product) => {
      if (product.stock > 0) {
        addItem(product, 1);
      }
    });
    openCart();
  };

  return (
    <div className="container py-10 md:py-14 space-y-8">
      {/* Breadcrumb / Torna al catalogo */}
      <div className="flex items-center justify-between">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200/80 bg-white/80 hover:bg-white text-xs font-bold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Torna al Catalogo</span>
        </Link>

        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Svuota lista</span>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-400 mb-3">
            <Heart className="h-3.5 w-3.5 fill-current" /> I tuoi preferiti
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Lista dei Desideri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl font-normal leading-relaxed">
            Conserva qui gli articoli che ami. Aggiungili al carrello quando sei pronto o ordinali direttamente con il nostro staff via WhatsApp.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleMoveAllToCart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 active:scale-95 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 whitespace-nowrap"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Sposta tutti nel Carrello</span>
          </button>
        )}
      </div>

      {/* Contenuto */}
      {items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="h-20 w-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 dark:bg-rose-950/40 dark:text-rose-400">
            <Heart className="h-9 w-9 stroke-[1.2]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            La tua lista dei desideri è vuota
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
            Non hai ancora salvato nessun articolo. Clicca sull’icona a forma di cuore sui prodotti che ti interessano per ritrovarli qui.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all dark:bg-white dark:text-slate-900"
          >
            <span>Sfoglia il Catalogo</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
