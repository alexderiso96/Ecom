import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  return (
    <section className="relative overflow-hidden py-18 md:py-28 bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/5 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="container relative z-10 flex flex-col items-center text-center">
        {/* Floating Capsule Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/80 backdrop-blur-md shadow-xs text-xs font-semibold text-slate-700 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-300 mb-6 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          <span className="tracking-wide">Collezione Esclusiva 2026</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Direct WhatsApp</span>
        </div>

        {/* Main Heading */}
        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] selection:bg-indigo-500 selection:text-white">
          Estetica Minimale, Qualità Superiore,{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Acquisto in 1-Click.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
          Dimentica le registrazioni infinite e i complessi moduli di pagamento. Esplora il catalogo, seleziona i tuoi articoli e ordina istantaneamente con un messaggio formattato su WhatsApp.
        </p>

        {/* CTA Actions */}
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
          <Link href="/catalog">
            <Button
              size="lg"
              className="rounded-full px-8 h-12 shadow-lg shadow-slate-950/10 hover:shadow-slate-950/20 group font-bold"
            >
              <span>Esplora Catalogo</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <a
            href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Ciao! Vorrei maggiori informazioni sulla vostra linea prodotti.')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="whatsapp"
              size="lg"
              className="rounded-full px-7 h-12 shadow-lg shadow-emerald-600/15 font-bold"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>Ordina via WhatsApp</span>
            </Button>
          </a>
        </div>

        {/* Key Metrics in Frosted Glass Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-xs dark:border-slate-800/70 dark:bg-slate-900/40 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white">24/48h</div>
              <div className="text-[11px] text-slate-500">Spedizione Tracciata Express</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-xs dark:border-slate-800/70 dark:bg-slate-900/40 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 flex-shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white">1-to-1</div>
              <div className="text-[11px] text-slate-500">Assistenza Dedicata WhatsApp</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-xs dark:border-slate-800/70 dark:bg-slate-900/40 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400 flex-shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white">100%</div>
              <div className="text-[11px] text-slate-500">Garanzia e Reso Semplice</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
