'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, Package, ShoppingBag, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/types/database.types';

interface AdminSidebarNavProps {
  userRole?: UserRole;
}

export function AdminSidebarNav({ userRole }: AdminSidebarNavProps) {
  const pathname = usePathname();

  const isOverviewActive = pathname === '/admin';
  const isCategoriesActive = pathname.startsWith('/admin/categories');
  const isProductsActive = pathname.startsWith('/admin/products');
  const isOrdersActive = pathname.startsWith('/admin/orders');
  const isSuperAdminActive = pathname.startsWith('/superadmin');

  return (
    <nav className="space-y-1.5 text-xs">
      <Link
        href="/admin"
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
          isOverviewActive
            ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
            : 'text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
        }`}
      >
        <LayoutDashboard className={`h-4 w-4 ${isOverviewActive ? 'text-indigo-400 dark:text-indigo-600' : ''}`} />
        <span>Panoramica</span>
      </Link>

      <Link
        href="/admin/orders"
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
          isOrdersActive
            ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
            : 'text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
        }`}
      >
        <ShoppingBag className={`h-4 w-4 ${isOrdersActive ? 'text-blue-400 dark:text-blue-600' : ''}`} />
        <span>Ordini & CJ Dropshipping</span>
      </Link>

      <Link
        href="/admin/categories"
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
          isCategoriesActive
            ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
            : 'text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
        }`}
      >
        <Layers className={`h-4 w-4 ${isCategoriesActive ? 'text-purple-400 dark:text-purple-600' : ''}`} />
        <span>Gestione Categorie</span>
      </Link>

      <Link
        href="/admin/products"
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
          isProductsActive
            ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900'
            : 'text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
        }`}
      >
        <Package className={`h-4 w-4 ${isProductsActive ? 'text-emerald-400 dark:text-emerald-600' : ''}`} />
        <span>Gestione Prodotti</span>
      </Link>

      {userRole === 'superadmin' && (
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="px-3 pb-1.5 text-[10px] uppercase font-black tracking-wider text-purple-600">
            SuperAdmin
          </div>
          <Link
            href="/superadmin"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
              isSuperAdminActive
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                : 'text-purple-700 bg-purple-50/80 hover:bg-purple-100 border border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 font-semibold'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Gestione Utenti (RBAC)</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
