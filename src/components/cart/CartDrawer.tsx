'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, AlertCircle, Sparkles, MessageCircle, Flame, Loader2, CheckCircle2, Mail } from 'lucide-react';
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
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<string | null>(null);

  // Precarica i dati utente da localStorage o se già loggato con Supabase Auth
  useEffect(() => {
    // 1. Prova da cache locale per clienti abituali o non registrati
    try {
      const savedEmail = localStorage.getItem('aura_customer_email');
      if (savedEmail) setCustomerEmail(savedEmail);
      const savedName = localStorage.getItem('aura_customer_name');
      if (savedName) setCustomerName(savedName);
      const savedPhone = localStorage.getItem('aura_customer_phone');
      if (savedPhone) setCustomerPhone(savedPhone);
    } catch {}

    // 2. Precarica da Supabase Auth se autenticato
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (user.email) setCustomerEmail(user.email);
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
    if (items.length === 0 || isSubmittingOrder) return;

    // Validazione obbligatoria dell'email cliente
    const trimmedEmail = customerEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setEmailError('Inserisci un indirizzo email valido per registrare il tuo ordine.');
      return;
    }
    setEmailError('');

    // Salva in localStorage per facilitare i prossimi ordini
    try {
      localStorage.setItem('aura_customer_email', trimmedEmail);
      if (customerName.trim()) localStorage.setItem('aura_customer_name', customerName.trim());
      if (customerPhone.trim()) localStorage.setItem('aura_customer_phone', customerPhone.trim());
    } catch {}

    setIsSubmittingOrder(true);

    let generatedOrderNumber: string | undefined;

    try {
      // 1. Salva l'ordine su Supabase con codice univoco ed email cliente
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          totalPrice,
          customerName: customerName.trim() || trimmedEmail.split('@')[0],
          customerEmail: trimmedEmail,
          customerPhone: customerPhone.trim() || undefined,
          shippingAddress: shippingAddress.trim() || undefined,
          customerNotes: customerNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.orderNumber) {
          generatedOrderNumber = data.orderNumber;
          setLastCreatedOrder(data.orderNumber);
        }
      }
    } catch (err) {
      console.warn('Salvataggio ordine offline o fallito, procedo comunque con WhatsApp:', err);
    } finally {
      setIsSubmittingOrder(false);
    }

    // 2. Genera il messaggio WhatsApp includendo il codice ordine e i dettagli completi
    const whatsappUrl = buildWhatsAppCheckoutUrl({
      items,
      totalPrice,
      orderNumber: generatedOrderNumber,
      customerName: customerName.trim() || trimmedEmail.split('@')[0],
      customerEmail: trimmedEmail,
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
                      {item.maxStock > 0 && item.maxStock <= 3 && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                          <Flame className="h-3 w-3 animate-pulse text-amber-500" />
                          <span>Ultime {item.maxStock} unità rimaste!</span>
                        </div>
                      )}
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

            {/* Customer Information */}
            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 space-y-3">
                {/* Email (Sempre Visibile) */}
                <div className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>La tua Email</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Conferma & Tracking
                    </span>
                  </div>

                  <input
                    type="email"
                    placeholder="mario.rossi@example.com"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none transition-all dark:bg-slate-900 dark:text-white ${
                      emailError
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700'
                    }`}
                  />

                  {emailError && (
                    <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                {/* Dati Opzionali (Nome, Telefono, Indirizzo, Note) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCheckoutForm(!showCheckoutForm)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      Dati di spedizione aggiuntivi (opzionali)
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {showCheckoutForm ? 'Comprimi' : 'Compila ora'}
                    </span>
                  </button>

                  {showCheckoutForm && (
                    <div className="mt-2.5 p-3 rounded-2xl border border-slate-200/70 bg-white space-y-2.5 text-left dark:border-slate-800 dark:bg-slate-900">
                      <Input
                        label="Il tuo Nome"
                        placeholder="es. Mario Rossi"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
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

              {lastCreatedOrder && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-300 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span>Ordine registrato a sistema: <b>{lastCreatedOrder}</b></span>
                </div>
              )}

              {/* High-impact WhatsApp Button */}
              <button
                disabled={isSubmittingOrder}
                onClick={handleWhatsAppCheckout}
                className="w-full flex items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvataggio ordine in corso...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 stroke-[2.2]" />
                    <span>Procedi all'Ordine su WhatsApp</span>
                  </>
                )}
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
