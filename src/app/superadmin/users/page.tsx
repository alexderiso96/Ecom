'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, ShieldCheck, UserCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/database.types';

export default function SuperAdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetProfile: Profile, newRole: UserRole) => {
    if (targetProfile.role === newRole) return;

    if (
      targetProfile.id === currentUserId &&
      newRole !== 'superadmin' &&
      !confirm('Stai modificando il tuo ruolo di SuperAdmin. Potresti perdere accesso a questo pannello. Confermi?')
    ) {
      return;
    }

    setFeedback(null);
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetProfile.id);

    if (error) {
      setFeedback({
        type: 'error',
        message: `Errore durante l'aggiornamento del ruolo: ${error.message}`,
      });
    } else {
      setFeedback({
        type: 'success',
        message: `Ruolo dell'utente ${targetProfile.email} aggiornato a "${newRole}".`,
      });
      setProfiles((prev) =>
        prev.map((p) => (p.id === targetProfile.id ? { ...p, role: newRole } : p))
      );
    }
  };

  const handleDeleteUser = async (targetProfile: Profile) => {
    if (targetProfile.id === currentUserId) {
      alert('Non puoi revocare o eliminare il tuo stesso account da qui.');
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare l'accesso e il profilo di ${targetProfile.email}?`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetProfile.id);

    if (error) {
      setFeedback({
        type: 'error',
        message: `Errore durante l'eliminazione: ${error.message}`,
      });
    } else {
      setFeedback({
        type: 'success',
        message: `Profilo di ${targetProfile.email} rimosso con successo.`,
      });
      setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const q = search.toLowerCase();
    const matchEmail = p.email.toLowerCase().includes(q);
    const matchName = p.full_name?.toLowerCase().includes(q) || false;
    return matchEmail || matchName;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestione Utenti & Permessi RBAC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualizza tutti gli utenti registrati e assegna i ruoli Customer, Admin o SuperAdmin.
          </p>
        </div>
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

      {/* Search Input Pill */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cerca per email o nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-slate-200/70 bg-white/80 pl-11 pr-4 py-2.5 text-xs text-slate-900 shadow-xs placeholder:text-slate-400 backdrop-blur-md focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-all"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Utente</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Iscrizione</th>
                <th className="px-6 py-4">Ruolo Attuale</th>
                <th className="px-6 py-4">Assegna Ruolo (RBAC)</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Caricamento utenti da Supabase...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Nessun utente trovato.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const isCurrent = p.id === currentUserId;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-xs dark:bg-purple-950 dark:text-purple-300 shadow-xs">
                            {p.full_name?.charAt(0).toUpperCase() || p.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {p.full_name || 'Nome non impostato'}
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                                  Tu
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {p.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {p.email}
                      </td>

                      <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                        {new Date(p.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-6 py-3.5">
                        {p.role === 'superadmin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                            <ShieldCheck className="h-3 w-3" /> SuperAdmin
                          </span>
                        ) : p.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                            <Shield className="h-3 w-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            <UserCheck className="h-3 w-3" /> Customer
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <select
                          value={p.role}
                          onChange={(e) => handleRoleChange(p, e.target.value as UserRole)}
                          className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="customer">Customer (Cliente)</option>
                          <option value="admin">Admin (Gestione Prodotti)</option>
                          <option value="superadmin">SuperAdmin (Tutti i poteri)</option>
                        </select>
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(p)}
                          disabled={isCurrent}
                          className="rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          title="Revoca accesso ed elimina"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
