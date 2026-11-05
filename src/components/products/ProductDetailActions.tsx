'use client';

import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, MessageCircle, Check } from 'lucide-react';
import { Product } from '@/types/database.types';
import { useCartStore } from '@/store/useCartStore';

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  const isOutOfStock = product.stock <= 0;
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

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200/70 dark:border-slate-800">
      {/* Quantity Stepper Pill */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Quantità:
        </span>
        <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-50/80 p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            disabled={quantity <= 1 || isOutOfStock}
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
            disabled={quantity >= maxAvailable || isOutOfStock}
            onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Buttons: Add to cart & Direct WhatsApp */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`flex-1 flex items-center justify-center gap-2 rounded-full h-12 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
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
    </div>
  );
}
