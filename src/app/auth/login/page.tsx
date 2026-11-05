'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2, Shield, User, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Se l'utente è già autenticato, reindirizzalo subito fuori dalla pagina di login
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const role = profile?.role;
          if (redirectTo) {
            if (redirectTo.startsWith('/admin') && role !== 'admin' && role !== 'superadmin') {
              window.location.href = '/';
            } else {
              window.location.href = redirectTo;
            }
          } else if (role === 'superadmin') {
            window.location.href = '/superadmin';
          } else if (role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.warn('Controllo sessione attiva fallito:', err);
      }
    };

    checkActiveSession();
  }, [redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        setLoginSuccess(true);

        // Recupero del ruolo dal database
        let targetUrl = '/';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          const role = profile?.role;

          if (redirectTo) {
            if (redirectTo.startsWith('/superadmin') && role !== 'superadmin') {
              targetUrl = '/';
            } else if (redirectTo.startsWith('/admin') && role !== 'admin' && role !== 'superadmin') {
              targetUrl = '/';
            } else {
              targetUrl = redirectTo;
            }
          } else if (role === 'superadmin') {
            targetUrl = '/superadmin';
          } else if (role === 'admin') {
            targetUrl = '/admin';
          } else {
            targetUrl = '/';
          }
        } catch (profileErr) {
          console.warn('Recupero ruolo non riuscito, fallback alla home:', profileErr);
          targetUrl = '/';
        }

        window.location.href = targetUrl;
      }
    } catch (err: any) {
      setLoading(false);
      setLoginSuccess(false);
      setErrorMsg(err.message || 'Credenziali non valide o errore durante il login');
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="relative min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900">
            <Sparkles className="h-5 w-5 text-indigo-400 dark:text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Accedi ad Aura Store
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inserisci le tue credenziali per accedere al carrello o al pannello di gestione.
          </p>
        </div>

        {loginSuccess && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 p-3.5 text-xs font-semibold text-emerald-800 border border-emerald-500/25 dark:text-emerald-300 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>Login effettuato! Reindirizzamento in corso...</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-800 border border-rose-500/25 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Demo Fast Fill Pills */}
        <div className="p-3.5 rounded-2xl border border-slate-200/60 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <KeyRound className="h-3 w-3" /> Credenziali Demo Rapide
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fillDemoAccount('superadmin@aurastore.com')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/70 transition-all dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
            >
              <Shield className="h-3 w-3" /> SuperAdmin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@aurastore.com')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 transition-all dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
            >
              <Shield className="h-3 w-3" /> Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('customer@aurastore.com')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70 shadow-xs transition-all dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            >
              <User className="h-3 w-3" /> Customer
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="mario.rossi@example.com"
            required
            autoComplete="email"
            disabled={loading || loginSuccess}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading || loginSuccess}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading || loginSuccess}
            className="w-full flex items-center justify-center gap-2 rounded-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {loginSuccess ? 'Accesso in corso...' : 'Accedi'}
            {!loginSuccess && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          Non hai ancora un account?{' '}
          <Link
            href="/auth/register"
            className="font-bold text-slate-900 dark:text-white hover:underline ml-1"
          >
            Registrati qui
          </Link>
        </div>
      </div>
    </div>
  );
}
