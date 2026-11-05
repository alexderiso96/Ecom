import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ShoppingBag, Truck, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types/database.types';

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const supabase = createClient();

  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  const orders = (ordersData || []) as Order[];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'ORDERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            <Clock className="h-3 w-3" />
            {status}
          </span>
        );
      case 'SHIPPED':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            {status}
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <AlertTriangle className="h-3 w-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Ordini & Dropshipping CJ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitora gli ordini, i numeri di tracking e lo stato di fulfillment verso CJdropshipping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
            <Truck className="h-3.5 w-3.5" />
            Totale: {orders.length} ordini
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          Errore caricamento ordini: {error.message}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 dark:bg-slate-800 mb-4">
            <ShoppingBag className="h-8 w-8 stroke-[1.4]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Nessun ordine presente
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Gli ordini effettuati dal carrello o tramite WhatsApp verranno visualizzati qui con sincronizzazione CJdropshipping.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Ordine</th>
                  <th className="py-4 px-6">Cliente & Destinazione</th>
                  <th className="py-4 px-6">Totale</th>
                  <th className="py-4 px-6">Fulfillment CJ</th>
                  <th className="py-4 px-6">Tracking / Spedizione</th>
                  <th className="py-4 px-6 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      <div>{ord.order_number}</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        {ord.items?.length || 0} articoli
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">{ord.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{ord.customer_email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ord.shipping_city} ({ord.shipping_country_code})
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(ord.total_amount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Sped: {formatCurrency(ord.shipping_fee)}
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <div>{getStatusBadge(ord.fulfillment_status)}</div>
                      {ord.cj_order_id && (
                        <div className="text-[10px] font-mono text-slate-500">
                          CJ ID: {ord.cj_order_id}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {ord.cj_tracking_number ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                            {ord.cj_tracking_number}
                            <ExternalLink className="h-3 w-3" />
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {ord.cj_carrier_name || 'Corriere CJ'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">In elaborazione magazzino</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-500">
                      {formatDate(ord.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

