import React from 'react';
import Link from 'next/link';
import { Layers, Package, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SeedButton } from '@/components/admin/SeedButton';

export const revalidate = 0; // dynamic

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [categoriesRes, productsRes, outOfStockRes] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock', 0),
  ]);

  const totalCategories = categoriesRes.count || 0;
  const totalProducts = productsRes.count || 0;
  const totalOutOfStock = outOfStockRes.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Panoramica Gestionale
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitora lo stato del catalogo, le categorie e le scorte di magazzino.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Totale Prodotti
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Package className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalProducts}
          </div>
          <Link
            href="/admin/products"
            className="mt-4 inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Gestisci prodotti <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Categorie Attive
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Layers className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalCategories}
          </div>
          <Link
            href="/admin/categories"
            className="mt-4 inline-flex items-center text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            Gestisci categorie <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Esauriti / Stock Zero
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {totalOutOfStock}
          </div>
          <span className="mt-4 inline-block text-xs text-slate-400">
            {totalOutOfStock === 0 ? 'Tutti gli articoli disponibili' : 'Articoli che richiedono rifornimento'}
          </span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Azioni Rapide
        </h3>
        <div className="flex flex-wrap gap-3 items-center">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Prodotto</span>
          </Link>

          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all dark:bg-slate-800 dark:text-slate-200"
          >
            <Plus className="h-4 w-4" />
            <span>Nuova Categoria</span>
          </Link>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <span>Visualizza Catalogo Pubblico</span>
          </Link>

          <SeedButton />
        </div>
      </div>
    </div>
  );
}
