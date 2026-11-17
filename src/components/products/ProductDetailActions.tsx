'use client';

import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, MessageCircle, Check, Heart, Flame, Bell } from 'lucide-react';
import { Product } from '@/types/database.types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxAvailable = product.stock;
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleDirectWhatsApp = () => {
    const message = `Ciao! Vorrei ordinare direttamente: *${product.name}* (Quantità: ${quantity}, Totale: €${(Number(product.price) * quantity).toFixed(2)}). È subito disponibile per la spedizione?`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNotifyWhatsApp = () => {
    const message = `Salve! Vorrei essere ricontattato non appena l'articolo *${product.name}* torna disponibile in magazzino.`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200/70 dark:border-slate-800">
      {/* FOMO / Low Stock Urgency Banner */}
      {isLowStock && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold">
              Affrettati! Solo <span className="underline decoration-amber-500 font-black">{product.stock} pezzi rimasti</span> a magazzino.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Richiesto
          </span>
        </div>
      )}

      {/* Out of Stock Notice */}
      {isOutOfStock && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 space-y-2">
          <div className="text-xs font-bold">Articolo momentaneamente esaurito</div>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400 leading-relaxed">
            Stiamo riassortendo questo prodotto. Puoi richiederne la disponibilità o essere avvisato prioritariamente al rientro in stock:
          </p>
          <button
            type="button"
            onClick={handleNotifyWhatsApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Avvisami su WhatsApp quando torna disponibile</span>
          </button>
        </div>
      )}

      {!isOutOfStock && (
        <>
          {/* Quantity Stepper Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quantità:
              </span>
              <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-50/80 p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-black text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxAvailable}
                  onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Wishlist Toggle Button */}
            <button
              type="button"
              onClick={() => toggleItem(product)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
              <span>{isFavorite ? 'Nei Preferiti' : 'Salva nei Preferiti'}</span>
            </button>
          </div>

          {/* Buttons: Add to cart & Direct WhatsApp */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full h-12 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                added
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Aggiunto al Carrello!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Aggiungi al Carrello</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 rounded-full h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
            >
              <MessageCircle className="h-4 w-4 stroke-[2.2]" />
              <span>Ordina Subito su WhatsApp</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
