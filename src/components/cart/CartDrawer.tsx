'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Truck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency, buildWhatsAppCheckoutUrl } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { CjFreightOption } from '@/types/cj.types';

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
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingProvince, setShippingProvince] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Spedizioni CJ
  const [freightOptions, setFreightOptions] = useState<CjFreightOption[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<CjFreightOption | null>(null);
  const [isLoadingFreight, setIsLoadingFreight] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);

  // Precarica dati utente se già loggato
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

  // Calcolo Spedizioni CJ
  const handleCalculateShipping = async () => {
    if (!shippingPostalCode) return;

    setIsLoadingFreight(true);
    try {
      const res = await fetch('/api/cj/freight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationCountryCode: 'IT',
          postalCode: shippingPostalCode,
          city: shippingCity,
          province: shippingProvince,
          items: items.map((i) => ({
            cjVariantId: i.cjVariantId || 'DEFAULT',
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.options)) {
        setFreightOptions(data.options);
        if (data.options.length > 0) {
          setSelectedCarrier(data.options[0]);
        }
      }
    } catch (err) {
      console.error('Errore calcolo spedizioni:', err);
    } finally {
      setIsLoadingFreight(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();
  const shippingCost = selectedCarrier ? Number(selectedCarrier.logisticPrice) : 0;
  const finalTotal = subtotal + shippingCost;

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    const fullAddress = [
      shippingAddress,
      shippingCity,
      shippingProvince,
      shippingPostalCode,
    ]
      .filter(Boolean)
      .join(', ');

    const whatsappUrl = buildWhatsAppCheckoutUrl({
      items,
      totalPrice: finalTotal,
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      shippingAddress: fullAddress || undefined,
      customerNotes: `${customerNotes ? `Note: ${customerNotes}. ` : ''}${
        selectedCarrier ? `Corriere CJ: ${selectedCarrier.logisticName}` : ''
      }`.trim() || undefined,
    });

    window.open(whatsappUrl, '_blank');
  };

  const handleDirectOrder = async () => {
    if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingPostalCode) {
      setShowCheckoutForm(true);
      alert('Compila tutti i campi di spedizione obbligatori.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderSuccessMessage(null);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingCity,
          shippingProvince,
          shippingPostalCode,
          shippingCountryCode: 'IT',
          shippingCountry: 'Italy',
          items,
          selectedLogisticName: selectedCarrier?.logisticName || 'CJ Packet Ordinary',
          shippingFee: shippingCost,
          notes: customerNotes,
          autoFulfillCj: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Errore creazione ordine.');
      }

      setOrderSuccessMessage(`Ordine ${data.order.orderNumber} confermato con successo!`);
      clearCart();
    } catch (err: any) {
      alert(`Errore: ${err?.message || 'Impossibile inviare l\'ordine.'}`);
    } finally {
      setIsSubmittingOrder(false);
    }
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
                  Spedizione Dropshipping integrata CJ
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
            {orderSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Ordine Ricevuto!</h4>
                  <p className="text-[11px] mt-0.5">{orderSuccessMessage}</p>
                </div>
              </div>
            )}

            {items.length === 0 && !orderSuccessMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 dark:bg-slate-900 dark:text-slate-600 mb-4">
                  <ShoppingBag className="h-9 w-9 stroke-[1.2]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Il tuo carrello è vuoto
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Esplora il catalogo e seleziona i tuoi prodotti esclusivi.
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

            {/* Form Spedizione & Calcolo CJ */}
            {items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(!showCheckoutForm)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Dati di Spedizione e Corriere CJ
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {showCheckoutForm ? 'Comprimi' : 'Compila dati'}
                  </span>
                </button>

                {showCheckoutForm && (
                  <div className="mt-3 p-3.5 rounded-2xl border border-slate-200/70 bg-white space-y-2.5 text-left dark:border-slate-800 dark:bg-slate-900">
                    <Input
                      label="Nome e Cognome *"
                      placeholder="es. Mario Rossi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      label="Email *"
                      type="email"
                      placeholder="mario.rossi@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                    <Input
                      label="Telefono"
                      placeholder="+39 333 1234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Input
                      label="Indirizzo (Via e Civico) *"
                      placeholder="Via Roma 10"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        label="Città *"
                        placeholder="Roma"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                      />
                      <Input
                        label="Provincia"
                        placeholder="RM"
                        value={shippingProvince}
                        onChange={(e) => setShippingProvince(e.target.value)}
                      />
                      <Input
                        label="CAP *"
                        placeholder="00100"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleCalculateShipping}
                        disabled={!shippingPostalCode || isLoadingFreight}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold dark:bg-slate-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                      >
                        {isLoadingFreight ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Truck className="h-3.5 w-3.5" />
                        )}
                        <span>Calcola Tariffe Spedizione CJ</span>
                      </button>
                    </div>

                    {/* Selezione Corrieri Disponibili */}
                    {freightOptions.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Seleziona Corriere Spedizione:
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {freightOptions.map((opt) => (
                            <div
                              key={opt.logisticName}
                              onClick={() => setSelectedCarrier(opt)}
                              className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                selectedCarrier?.logisticName === opt.logisticName
                                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                              }`}
                            >
                              <div>
                                <span className="font-semibold block">{opt.logisticName}</span>
                                <span className="text-[10px] text-slate-500">
                                  {opt.logisticAging ? `Stima: ${opt.logisticAging} gg` : 'Tracking disponibile'}
                                </span>
                              </div>
                              <span className="font-black">{formatCurrency(opt.logisticPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Note speciali
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Citofono o istruzioni di consegna..."
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
            <div className="p-5 border-t border-slate-200/70 bg-slate-50/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotale articoli ({totalItems})</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Spedizione ({selectedCarrier?.logisticName || 'Standard CJ'})</span>
                  <span className={shippingCost === 0 ? 'text-emerald-600 font-bold' : 'font-bold'}>
                    {shippingCost === 0 ? 'Gratuita' : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Totale Finale</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              {/* Informative Pill */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed border border-slate-200/60 dark:border-slate-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  Puoi confermare l'ordine in modo nativo con invio diretto a CJ o inoltrare il riepilogo al nostro servizio WhatsApp.
                </span>
              </div>

              {/* Direct Order Button */}
              <button
                onClick={handleDirectOrder}
                disabled={isSubmittingOrder}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 text-xs shadow-md active:scale-[0.99] transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-50"
              >
                {isSubmittingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4 stroke-[2]" />
                )}
                <span>Conferma Ordine e Invia al Magazzino CJ</span>
              </button>

              {/* WhatsApp Option Button */}
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs shadow-sm active:scale-[0.99] transition-all"
              >
                <MessageCircle className="h-4 w-4 stroke-[2]" />
                <span>Completa su WhatsApp</span>
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
