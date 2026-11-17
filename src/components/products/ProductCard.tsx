'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check, Heart, Flame } from 'lucide-react';
import { Product } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isInCart = items.some((item) => item.productId === product.id);
  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addItem(product, 1);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white dark:bg-[#131211] border border-stone-200/70 dark:border-stone-800/70 transition-all duration-300 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-subtle">
      {/* 1. Immagine d'Impatto Editoriale */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F5F2EB] dark:bg-stone-900">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover object-center filter saturate-[0.98] transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-700">
              <ShoppingBag className="h-10 w-10 stroke-[1]" />
            </div>
          )}
        </Link>

        {/* Wishlist Button - Discreto in alto a destra */}
        <button
          type="button"
          aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem(product);
          }}
          className={`absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            isFavorite
              ? 'bg-[#1C1917] text-[#C5A880] shadow-sm'
              : 'bg-white/80 dark:bg-stone-900/80 text-stone-500 hover:text-stone-900 dark:hover:text-white backdrop-blur-sm'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 stroke-[1.5] ${isFavorite ? 'fill-[#C5A880]' : ''}`} />
        </button>

        {/* Badges Minimali in alto a sinistra */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1 z-10 pointer-events-none">
          {product.is_featured && (
            <span className="px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.2em] uppercase bg-stone-900 text-white dark:bg-white dark:text-stone-950">
              In Evidenza
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.2em] uppercase bg-stone-200/90 text-stone-800 dark:bg-stone-800 dark:text-stone-200 backdrop-blur-sm">
              Esaurito
            </span>
          )}
        </div>

        {/* Bottone d'azione rapido che appare in modo fluido all'hover dal basso */}
        <div className="absolute inset-x-3 bottom-3 z-20 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hidden sm:block">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`w-full h-10 px-4 text-[10px] tracking-[0.2em] uppercase font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-luxury cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isInCart
                ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#C5A880]" />
                <span>Nel Carrello</span>
              </>
            ) : isOutOfStock ? (
              <span>Non Disponibile</span>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5 stroke-[1.4]" />
                <span>Aggiungi al Carrello</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Dettagli Prodotto Minimali */}
      <div className="p-4 flex flex-1 flex-col justify-between text-left">
        <div>
          {/* Categoria */}
          {product.category?.name && (
            <span className="text-[9px] tracking-[0.22em] uppercase text-[#C5A880] font-medium block mb-1">
              {product.category.name}
            </span>
          )}

          {/* Nome Prodotto */}
          <Link href={`/product/${product.slug}`} className="block group/title">
            <h3 className="text-xs sm:text-sm font-normal tracking-wide text-stone-900 dark:text-stone-100 line-clamp-1 group-hover/title:text-[#C5A880] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Prezzo & Stock */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {formatCurrency(Number(product.price))}
          </p>

          {isLowStock ? (
            <span className="inline-flex items-center gap-1 text-[9px] tracking-wide font-medium text-amber-700 dark:text-amber-400">
              <Flame className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
              <span>Ultime {product.stock}</span>
            </span>
          ) : isOutOfStock ? (
            <span className="text-[9px] tracking-widest uppercase text-stone-400">
              Esaurito
            </span>
          ) : (
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="sm:hidden p-1.5 text-stone-600 hover:text-stone-950 dark:text-stone-300"
              aria-label="Aggiungi al carrello"
            >
              <ShoppingBag className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
