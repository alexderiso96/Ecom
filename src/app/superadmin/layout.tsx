import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Store, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SuperAdminSidebarNav } from '@/components/superadmin/SuperAdminSidebarNav';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/superadmin');
    return null;
  }

  // Verifica rigorosa ruolo superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    redirect('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950">
      {/* SuperAdmin Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 border-r border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 p-5 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
              SuperAdmin Room
            </span>
          </div>
          <div className="mt-2 p-2.5 rounded-2xl border border-purple-200/60 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/40">
            <div className="text-[10px] text-purple-700/70 dark:text-purple-300/70 font-semibold uppercase tracking-wider">
              Controllo Globale RBAC
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {profile.email}
            </div>
          </div>
        </div>

        {/* Dynamic Navigation links with active states */}
        <SuperAdminSidebarNav />

        {/* Bottom links */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Store className="h-4 w-4" />
            Torna al Negozio
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
