import React from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck, Truck, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  return (
    <footer className="border-t border-slate-200/70 bg-gradient-to-b from-slate-50/50 to-slate-100/80 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900 mt-20">
      {/* Features Value Proposition Bar */}
      <div className="border-b border-slate-200/70 dark:border-slate-800/80 py-12">
        <div className="container grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex-shrink-0">
              <Truck className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Spedizioni Rapide 24/48h
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consegna tracciata e rapida in tutta Italia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex-shrink-0">
              <MessageCircle className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Checkout Diretto WhatsApp
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assistenza umana dedicata per ogni ordine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex-shrink-0">
              <ShieldCheck className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Qualità Garantita 100%
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Articoli selezionati con reso facile 14gg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="container py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
            <Sparkles className="h-4 w-4 text-indigo-400 dark:text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              AURA STORE
            </span>
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link
            href="/catalog"
            className="px-3 py-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            Catalogo
          </Link>
          <a
            href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve! Vorrei ricevere supporto sui vostri articoli.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Supporto WhatsApp</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
          <Link
            href="/auth/login"
            className="px-3 py-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            Area Riservata
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 text-center md:text-right font-medium">
          Aura Minimal Commerce • Next.js & Supabase
        </p>
      </div>
    </footer>
  );
}
