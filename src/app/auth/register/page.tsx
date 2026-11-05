'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        window.location.href = '/';
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 overflow-hidden">
        <div className="w-full max-w-md text-center space-y-4 rounded-3xl border border-slate-200/70 bg-white/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Registrazione completata!
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Abbiamo inviato un link di conferma alla tua email (<strong>{email}</strong>). Clicca sul link per attivare il tuo profilo Aura Store.
          </p>
          <div className="pt-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800 font-bold h-11 text-xs shadow-xs transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              Torna al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-purple-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900">
            <Sparkles className="h-5 w-5 text-indigo-400 dark:text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Crea il tuo Account
          </h1>
          <p className="text-xs text-slate-500">
            Unisciti ad Aura Store per salvare il tuo profilo e tracciare le tue preferenze.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-800 border border-rose-500/25 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome e Cognome"
            placeholder="Mario Rossi"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="mario.rossi@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimo 6 caratteri"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {loading ? 'Creazione in corso...' : 'Registrati'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          Hai già un account?{' '}
          <Link
            href="/auth/login"
            className="font-bold text-slate-900 dark:text-white hover:underline ml-1"
          >
            Accedi qui
          </Link>
        </div>
      </div>
    </div>
  );
}
