'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Eye,
  AlertCircle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; icon: any }
> = {
  whatsapp_pending: {
    label: 'In Attesa WhatsApp',
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: Clock,
  },
  confirmed: {
    label: 'Confermato',
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: CheckCircle,
  },
  processing: {
    label: 'In Lavorazione',
    bg: 'bg-purple-500/10 border-purple-500/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: RefreshCw,
  },
  shipped: {
    label: 'Spedito',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    text: 'text-indigo-700 dark:text-indigo-400',
    icon: Truck,
  },
  completed: {
    label: 'Completato',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Annullato',
    bg: 'bg-rose-500/10 border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-400',
    icon: XCircle,
  },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore caricamento ordini:', error);
    } else if (data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert(`Errore aggiornamento stato: ${error.message}`);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
    setUpdatingId(null);
  };

  // Filtri dinamici
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.includes(q));

    return matchesStatus && matchesSearch;
  });

  // Metriche
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pendingOrders = orders.filter((o) => o.status === 'whatsapp_pending').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestione Ordini
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualizza gli ordini registrati, aggiorna gli stati di avanzamento e monitora i ricavi.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Aggiorna Dati</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/80 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Totale Ordini
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {orders.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/80 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Fatturato Ordini
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/80 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            In Attesa WhatsApp
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingOrders}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/80 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Ordini Consegnati
          </span>
          <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {completedOrders}
          </div>
        </div>
      </div>

      {/* Barra Ricerca & Filtro Stato */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Verifica codice (es. AURA-...), cliente o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Stato:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tutti gli stati ({orders.length})</option>
            <option value="whatsapp_pending">In Attesa WhatsApp</option>
            <option value="confirmed">Confermati</option>
            <option value="processing">In Lavorazione</option>
            <option value="shipped">Spediti</option>
            <option value="completed">Completati</option>
            <option value="cancelled">Annullati</option>
          </select>
        </div>
      </div>

      {/* Tabella Ordini */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Codice Ordine</th>
                <th className="p-4">Data</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Articoli</th>
                <th className="p-4">Totale</th>
                <th className="p-4">Stato Ordine</th>
                <th className="p-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Caricamento ordini in corso...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nessun ordine trovato con i criteri selezionati.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.whatsapp_pending;
                  const StatusIcon = statusInfo.icon;
                  const itemsCount =
                    order.order_items?.reduce((tot, i) => tot + i.quantity, 0) || 0;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {order.order_number}
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.customer_name}
                        </div>
                        {order.customer_email && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <a
                              href={`mailto:${order.customer_email}`}
                              className="hover:underline truncate max-w-[180px]"
                              title={order.customer_email}
                            >
                              {order.customer_email}
                            </a>
                          </div>
                        )}
                        {order.customer_phone && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {order.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                        {itemsCount} {itemsCount === 1 ? 'pz' : 'pz'}
                      </td>
                      <td className="p-4 font-black text-slate-900 dark:text-white">
                        {formatCurrency(Number(order.total_amount))}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={updatingId === order.id}
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${statusInfo.bg} ${statusInfo.text}`}
                          >
                            <option value="whatsapp_pending">In Attesa WhatsApp</option>
                            <option value="confirmed">Confermato</option>
                            <option value="processing">In Lavorazione</option>
                            <option value="shipped">Spedito</option>
                            <option value="completed">Completato</option>
                            <option value="cancelled">Annullato</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Dettagli</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale Dettaglio Ordine */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Riepilogo Ordine: ${selectedOrder.order_number}`}
        >
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Data Ordine
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(selectedOrder.created_at).toLocaleString('it-IT')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Stato:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedOrder.status].bg} ${STATUS_CONFIG[selectedOrder.status].text}`}
                >
                  {STATUS_CONFIG[selectedOrder.status].label}
                </span>
              </div>
            </div>

            {/* Dati Cliente & Spedizione */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Dati Destinatario
                </span>
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedOrder.customer_name}
                  </div>
                  {selectedOrder.customer_email ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <a
                        href={`mailto:${selectedOrder.customer_email}`}
                        className="hover:underline"
                      >
                        {selectedOrder.customer_email}
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Nessuna email registrata</div>
                  )}
                  {selectedOrder.customer_phone && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {selectedOrder.customer_phone}
                      </span>
                      <a
                        href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-500 ml-1"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Indirizzo e Note
                </span>
                <div className="space-y-1">
                  <div className="text-slate-800 dark:text-slate-200">
                    {selectedOrder.shipping_address || 'Nessun indirizzo specificato'}
                  </div>
                  {selectedOrder.notes && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 italic">
                      "{selectedOrder.notes}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista Articoli */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Articoli Acquistati ({selectedOrder.order_items?.length || 0})
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.quantity} x {formatCurrency(Number(item.price))}
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-slate-900 dark:text-white">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totale Finale */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex justify-between items-center font-bold">
              <span>Totale Pagato / Da Saldare</span>
              <span className="text-base font-black">
                {formatCurrency(Number(selectedOrder.total_amount))}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
