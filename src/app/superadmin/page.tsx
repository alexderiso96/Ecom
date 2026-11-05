import React from 'react';
import Link from 'next/link';
import { Users, UserCheck, Shield, ShieldAlert, ArrowRight, UserCog } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function SuperAdminDashboardPage() {
  const supabase = createClient();

  const [totalRes, customerRes, adminRes, superAdminRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'superadmin'),
  ]);

  const totalUsers = totalRes.count || 0;
  const customers = customerRes.count || 0;
  const admins = adminRes.count || 0;
  const superadmins = superAdminRes.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          SuperAdmin Control Room
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitora la sicurezza, l'assegnazione dei permessi RBAC e gestisci i ruoli degli utenti.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Totale Utenti
            </span>
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <Users className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalUsers}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Customer
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <UserCheck className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {customers}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Shield className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {admins}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SuperAdmin
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <ShieldAlert className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
            {superadmins}
          </div>
        </div>
      </div>

      {/* Main Action Banner */}
      <div className="rounded-3xl border border-purple-200/70 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80 p-6 sm:p-8 backdrop-blur-sm dark:border-purple-900/50 dark:from-purple-950/30 dark:to-indigo-950/30 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 mb-2">
              <UserCog className="h-3.5 w-3.5" />
              <span>Controllo RBAC Avanzato</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Gestione Permessi e Promozione Ruoli
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Visualizza la lista di tutti gli account registrati ed assegna con un click i ruoli Customer, Admin o SuperAdmin nel database Supabase protetto da RLS.
            </p>
          </div>

          <Link
            href="/superadmin/users"
            className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
          >
            <span>Apri Tabella Utenti</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
