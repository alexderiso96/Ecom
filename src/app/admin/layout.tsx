import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Store, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin');
    return null;
  }

  // Verifica ruolo
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 border-r border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 p-5 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-600" />
            </div>
            <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
              Admin Console
            </span>
          </div>
          <div className="mt-2 p-2.5 rounded-2xl border border-slate-200/60 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="text-[10px] text-slate-400 font-medium">Autenticato:</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {profile.email}
            </div>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800">
              {profile.role}
            </span>
          </div>
        </div>

        {/* Dynamic Navigation links with active states */}
        <AdminSidebarNav userRole={profile.role} />

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
