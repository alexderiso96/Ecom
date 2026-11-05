'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency, buildWhatsAppCheckoutUrl } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Precarica i dati utente se già loggato
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCustomerEmail(user.email || '');
        supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.full_name) setCustomerName(data.full_name);
            if (data?.phone) setCustomerPhone(data.phone);
          });
      }
    });
  }, []);

  // Chiudi con tasto ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleWhatsAppCheckout = async () => {
    if (items.length === 0) return;

    let orderNumber: string | undefined = undefined;
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          shippingAddress: shippingAddress.trim() || undefined,
          customerNotes: customerNotes.trim() || undefined,
          items,
          totalPrice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderNumber = data.orderNumber;
      }
    } catch (err) {
      console.warn('Salvataggio ordine in DB saltato, procedo con WhatsApp:', err);
    }

    const whatsappUrl = buildWhatsAppCheckoutUrl({
      items,
      totalPrice,
      orderNumber,
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
      customerNotes: customerNotes.trim() || undefined,
    });

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col border-l border-slate-200/70 dark:bg-slate-950/95 dark:border-slate-800/80 animate-slide-left">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200/70 bg-white/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900">
                <ShoppingBag className="h-5 w-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Il tuo Carrello
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {totalItems} {totalItems === 1 ? 'articolo' : 'articoli'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Checkout diretto senza registrazione obbligatoria
                </p>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 dark:bg-slate-900 dark:text-slate-600 mb-4">
                  <ShoppingBag className="h-9 w-9 stroke-[1.2]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Il tuo carrello è vuoto
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Esplora il catalogo di Aura Store e seleziona i tuoi prodotti esclusivi.
                </p>
                <button
                  onClick={closeCart}
                  className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 text-xs font-bold shadow-sm transition-all dark:bg-white dark:text-slate-900"
                >
                  <Link href="/catalog" onClick={closeCart}>
                    Sfoglia il Catalogo
                  </Link>
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3 rounded-2xl border border-slate-200/70 bg-white/80 shadow-xs hover:border-slate-300 transition-all dark:border-slate-800/80 dark:bg-slate-900/60"
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <ShoppingBag className="h-6 w-6 stroke-[1.2]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 -mr-1"
                          title="Rimuovi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    {/* Quantity Stepper Pill */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-50/80 p-0.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Optional Customer Information */}
            {items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(!showCheckoutForm)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Dati di spedizione (opzionali)
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {showCheckoutForm ? 'Chiudi' : 'Compila ora'}
                  </span>
                </button>

                {showCheckoutForm && (
                  <div className="mt-3 p-3 rounded-2xl border border-slate-200/70 bg-white space-y-2.5 text-left dark:border-slate-800 dark:bg-slate-900">
                    <Input
                      label="Il tuo Nome"
                      placeholder="es. Mario Rossi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="mario.rossi@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                    <Input
                      label="Numero di Telefono"
                      placeholder="+39 333 1234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Input
                      label="Indirizzo di Spedizione"
                      placeholder="Via Roma 10, 00100 Roma (RM)"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Note speciali
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Taglie specifiche, citofono o preferenze di consegna..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Checkout Actions */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200/70 bg-slate-50/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70 space-y-3.5">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotale articoli ({totalItems})</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Spedizione Express 24/48h</span>
                  <span className="text-emerald-600 font-bold">Gratuita</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Totale Stimato</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              {/* Informative Pill */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[11px] leading-relaxed border border-emerald-500/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Cliccando su Procedi si aprirà WhatsApp con la lista degli articoli formattata per completare l'ordine con il nostro staff.
                </span>
              </div>

              {/* High-impact WhatsApp Button */}
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full flex items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all"
              >
                <MessageCircle className="h-4 w-4 stroke-[2.2]" />
                <span>Procedi all'Ordine su WhatsApp</span>
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Svuota carrello
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
