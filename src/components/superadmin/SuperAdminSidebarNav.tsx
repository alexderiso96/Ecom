'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Users, Package, Layers, Shield } from 'lucide-react';

export function SuperAdminSidebarNav() {
  const pathname = usePathname();

  const isControlRoomActive = pathname === '/superadmin';
  const isUsersActive = pathname.startsWith('/superadmin/users');
  const isProductsActive = pathname.startsWith('/admin/products');
  const isCategoriesActive = pathname.startsWith('/admin/categories');
  const isAdminOverviewActive = pathname === '/admin';

  return (
    <nav className="space-y-1.5 text-xs">
      <Link
        href="/superadmin"
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
          isControlRoomActive
            ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
            : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold'
        }`}
      >
        <ShieldCheck className="h-4 w-4" />
        <span>Control Room</span>
      </Link>

      <Link
        href="/superadmin/users"
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
          isUsersActive
            ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
            : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold'
        }`}
      >
        <Users className="h-4 w-4" />
        <span>Gestione Utenti & Ruoli</span>
      </Link>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="px-3 pb-1.5 text-[10px] uppercase font-bold text-slate-400">
          Eredità Funzioni Admin
        </div>

        <Link
          href="/admin/products"
          className={`flex items-center gap-3 px-3.5 py-2 rounded-full transition-all duration-200 ${
            isProductsActive
              ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 font-semibold'
          }`}
        >
          <Package className={`h-4 w-4 ${isProductsActive ? 'text-emerald-400 dark:text-emerald-600' : ''}`} />
          <span>Gestione Prodotti</span>
        </Link>

        <Link
          href="/admin/categories"
          className={`flex items-center gap-3 px-3.5 py-2 rounded-full transition-all duration-200 ${
            isCategoriesActive
              ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 font-semibold'
          }`}
        >
          <Layers className={`h-4 w-4 ${isCategoriesActive ? 'text-purple-400 dark:text-purple-600' : ''}`} />
          <span>Gestione Categorie</span>
        </Link>

        <Link
          href="/admin"
          className={`flex items-center gap-3 px-3.5 py-2 rounded-full transition-all duration-200 ${
            isAdminOverviewActive
              ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 font-semibold'
          }`}
        >
          <Shield className={`h-4 w-4 ${isAdminOverviewActive ? 'text-indigo-400 dark:text-indigo-600' : ''}`} />
          <span>Pannello Admin Standard</span>
        </Link>
      </div>
    </nav>
  );
}

