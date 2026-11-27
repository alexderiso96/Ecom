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
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxAvailable = product.stock;
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  if (product.quote_required) {
    const message = encodeURIComponent(`Ciao! Vorrei un preventivo per ${product.name}. Posso conoscere le opzioni di personalizzazione?`);
    return (
      <a
        href={`https://wa.me/${adminPhone}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-stone-900 px-5 font-semibold text-white dark:bg-stone-100 dark:text-stone-950"
      >
        <MessageCircle className="h-4 w-4" /> Chiedi un preventivo
      </a>
    );
  }

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleDirectWhatsApp = () => {
    const message = `Salve! Desidero ordinare direttamente la creazione: *${product.name}* (Quantità: ${quantity}, Totale: €${(Number(product.price) * quantity).toFixed(2)}). Confermate la disponibilità immediata?`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNotifyWhatsApp = () => {
    const message = `Salve! Desidero ricevere una notifica su WhatsApp non appena l'articolo *${product.name}* torna disponibile nella vostra boutique.`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-5 pt-6 border-t border-stone-200/80 dark:border-stone-800/80">
      {/* Low Stock Urgency Notice */}
      {isLowStock && (
        <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-medium">
              Edizione limitata: restano solo <strong className="font-bold underline">{product.stock} unità</strong> disponibili.
            </span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
            Richiesto
          </span>
        </div>
      )}

      {/* Out of Stock Notice */}
      {isOutOfStock && (
        <div className="p-4 bg-stone-100 border border-stone-200 dark:bg-stone-900/60 dark:border-stone-800 text-stone-800 dark:text-stone-200 space-y-3">
          <div className="text-xs font-serif font-bold tracking-wide">Articolo Momentaneamente Esaurito</div>
          <p className="text-xs font-light text-stone-500 dark:text-stone-400 leading-relaxed">
            Stiamo riassortendo questo pezzo con la nostra bottega orafa. Puoi prenotare la tua priorità o chiedere una consulenza al nostro concierge:
          </p>
          <button
            type="button"
            onClick={handleNotifyWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 text-xs tracking-[0.16em] uppercase font-medium transition-all"
          >
            <Bell className="h-3.5 w-3.5 text-[#B8915D]" />
            <span>Avvisami su WhatsApp al Rientro</span>
          </button>
        </div>
      )}

      {!isOutOfStock && (
        <>
          {/* Quantity Stepper & Wishlist */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                Quantità:
              </span>
              <div className="flex items-center border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-9 w-9 flex items-center justify-center text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white disabled:opacity-30 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-bold text-stone-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxAvailable}
                  onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                  className="h-9 w-9 flex items-center justify-center text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white disabled:opacity-30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Wishlist Toggle Button */}
            <button
              type="button"
              onClick={() => toggleItem(product)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 border text-xs tracking-[0.14em] uppercase transition-all duration-200 ${
                isFavorite
                  ? 'border-[#251C19] bg-[#251C19] text-[#B8915D] dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950'
                  : 'border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-100'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-[#B8915D]' : ''}`} />
              <span className="text-[10px] font-medium">{isFavorite ? 'Nei Preferiti' : 'Salva nei Preferiti'}</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 h-12 flex items-center justify-center gap-2.5 text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-200 cursor-pointer ${
                added
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white shadow-subtle'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 text-[#B8915D]" />
                  <span>Aggiunto al Carrello</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 stroke-[1.4]" />
                  <span>Aggiungi al Carrello</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="flex-1 h-12 flex items-center justify-center gap-2 text-xs tracking-[0.18em] uppercase font-semibold border border-stone-300 hover:border-stone-900 dark:border-stone-700 dark:hover:border-stone-100 text-stone-900 dark:text-stone-100 transition-all cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ordina via WhatsApp</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
