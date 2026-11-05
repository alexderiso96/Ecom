'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Send,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  RotateCw,
  Search,
  Filter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Order, FulfillmentStatus } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFulfillOrder = async (orderId: string) => {
    setFulfillingId(orderId);
    setFeedback(null);

    try {
      const res = await fetch('/api/aliexpress/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Errore durante l\'inoltro dell\'ordine ad AliExpress');
      }

      setFeedback({
        type: 'success',
        message: `Ordine inoltrato ad AliExpress con successo! ID fornitore: ${json.aliexpressOrderId}`,
      });

      // Ricarica la lista ordini
      await fetchOrders();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Errore durante la chiamata AliExpress fulfillment',
      });
    } finally {
      setFulfillingId(null);
    }
  };

  const getStatusBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/25 dark:text-amber-400">
            <Clock className="h-3 w-3" /> In Attesa
          </span>
        );
      case 'ORDERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 border border-indigo-500/25 dark:text-indigo-400">
            <CheckCircle2 className="h-3 w-3" /> Inoltrato ad AliExpress
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 dark:text-emerald-400">
            <Truck className="h-3 w-3" /> Spedito
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/25 dark:text-rose-400">
            <AlertCircle className="h-3 w-3" /> Errore Fornitore
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      (o.aliexpress_order_id && o.aliexpress_order_id.toLowerCase().includes(q)) ||
      (o.tracking_number && o.tracking_number.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || o.fulfillment_status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestione Ordini & Dropshipping
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitora gli ordini ricevuti, avvia l'inoltro automatico ad AliExpress e traccia le spedizioni.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Aggiorna</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-semibold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/25 dark:text-emerald-300'
              : 'bg-rose-500/15 text-rose-800 border border-rose-500/25 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca per #ordine, cliente, ID AliExpress o tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full border border-slate-200/80 bg-white/80 text-xs text-slate-900 placeholder:text-slate-400 backdrop-blur-md focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="PENDING">In attesa (PENDING)</option>
            <option value="ORDERED">Inoltrati (ORDERED)</option>
            <option value="SHIPPED">Spediti (SHIPPED)</option>
            <option value="FAILED">Errori (FAILED)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Codice Ordine</th>
                <th className="px-6 py-4">Cliente & Destinazione</th>
                <th className="px-6 py-4">Articoli</th>
                <th className="px-6 py-4">Totale</th>
                <th className="px-6 py-4">Stato Fulfillment</th>
                <th className="px-6 py-4">ID AliExpress / Tracking</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Caricamento ordini dal database...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <ShoppingCart className="h-8 w-8 stroke-[1.2] mx-auto mb-2 text-slate-300" />
                    Nessun ordine trovato con i criteri selezionati.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.fulfillment_status === 'PENDING';
                  const isFulfilling = fulfillingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          #{order.order_number}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(order.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.customer_email}
                        </div>
                        {order.customer_phone && (
                          <div className="text-[10px] text-slate-400">
                            Tel: {order.customer_phone}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {order.shipping_address}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="text-slate-700 dark:text-slate-300">
                              <span className="font-bold">{item.quantity}x</span> {item.product_name}
                              {item.aliexpress_product_id && (
                                <span className="ml-1 text-[9px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-950 px-1 py-0.5 rounded">
                                  Ali: {item.aliexpress_product_id}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(Number(order.total_amount))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(order.fulfillment_status)}
                        {order.error_payload && (
                          <div className="text-[10px] text-rose-500 mt-1 max-w-xs line-clamp-2">
                            {order.error_payload.message || 'Errore fornitore'}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px]">
                        {order.aliexpress_order_id ? (
                          <div className="text-indigo-600 dark:text-indigo-400 font-bold">
                            Ali: {order.aliexpress_order_id}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}

                        {order.tracking_number ? (
                          <div className="text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            <span>{order.tracking_number}</span>
                          </div>
                        ) : null}
                      </td>

                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Bottone WhatsApp cliente */}
                        {order.customer_phone && (
                          <a
                            href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Salve ${order.customer_name}, la contattiamo dal team Aura Store in merito al suo ordine #${order.order_number}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Apri chat WhatsApp del cliente"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}

                        {/* Bottone Inoltro AliExpress */}
                        {isPending && (
                          <button
                            onClick={() => handleFulfillOrder(order.id)}
                            disabled={isFulfilling}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                            title="Inoltra ordine al fornitore AliExpress"
                          >
                            <Send className="h-3 w-3" />
                            <span>{isFulfilling ? 'Inoltro...' : 'Invia ad AliExpress'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

