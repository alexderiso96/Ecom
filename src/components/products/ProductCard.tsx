'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye, Check, Heart, Flame } from 'lucide-react';
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
    <div className="group relative flex flex-col rounded-3xl border border-slate-200/70 bg-white/80 p-3 shadow-xs hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700">
      {/* Image container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-900/90"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
            <ShoppingBag className="h-12 w-12 stroke-[1.2]" />
          </div>
        )}

        {/* Floating Top Left Pill Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
          {product.is_featured && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950 border border-slate-900/20">
              In evidenza
            </span>
          )}
          {product.category?.name && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/85 text-slate-800 shadow-xs backdrop-blur-md border border-white/60 dark:bg-slate-900/85 dark:text-slate-200 dark:border-slate-700/60">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Floating Top Right Wishlist Button */}
        <button
          type="button"
          aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem(product);
          }}
          className={`absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
              : 'bg-white/85 text-slate-500 hover:text-rose-500 hover:bg-white shadow-xs dark:bg-slate-900/85 dark:text-slate-300 dark:hover:text-rose-400'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Floating Bottom Left Stock / FOMO Urgency Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-800 border border-rose-500/30 backdrop-blur-md shadow-xs dark:text-rose-300 dark:bg-rose-950/80">
              Esaurito
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse border border-amber-400">
              <Flame className="h-3 w-3 fill-slate-950 text-slate-950" />
              <span>Ultime {product.stock} unità!</span>
            </span>
          ) : product.stock < 10 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/20 backdrop-blur-md shadow-xs dark:text-amber-400">
              Solo {product.stock} rimasti
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 text-emerald-700 border border-emerald-500/20 backdrop-blur-md shadow-xs dark:bg-slate-900/80 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Disponibile
            </span>
          )}
        </div>

        {/* Quick View Pill on Hover */}
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 text-slate-900 font-bold text-xs shadow-lg backdrop-blur-md border border-white/80 dark:bg-slate-900/95 dark:text-white dark:border-slate-700">
            <Eye className="h-3.5 w-3.5" /> Dettagli
          </span>
        </div>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between pt-3.5 pb-1 px-1">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price and Cart Action */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
              Prezzo
            </span>
            <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(Number(product.price))}
            </p>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`inline-flex items-center justify-center rounded-full px-4 h-9 text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              isInCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 shadow-xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10 hover:shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                Nel carrello
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                Aggiungi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
