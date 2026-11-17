'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-stone-200/80 bg-[#FAF8F5] text-stone-700 dark:border-stone-800/80 dark:bg-[#0E0D0C] dark:text-stone-300 mt-28">
      {/* 1. Newsletter Club Privé Banner */}
      <div className="border-b border-stone-200/80 dark:border-stone-800/80 py-16">
        <div className="container max-w-4xl text-center">
          <span className="text-[10px] tracking-[0.25em] font-semibold text-[#C5A880] uppercase block mb-3">
            Newsletter Esclusiva
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-wide text-stone-900 dark:text-stone-100 mb-3">
            Entra nel Privé di Aura
          </h3>
          <p className="text-xs sm:text-sm font-light text-stone-500 dark:text-stone-400 max-w-xl mx-auto leading-relaxed mb-8">
            Ricevi in anteprima le capsule collection limitate, gli inviti agli eventi privati e le novità dei nostri maestri artigiani.
          </p>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-300 bg-emerald-50/60 text-emerald-800 text-xs font-medium dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Grazie per l'adesione. Abbiamo riservato il tuo invito personale.</span>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="Inserisci il tuo indirizzo email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-white dark:bg-[#171615] border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-[#C5A880] transition-colors"
              />
              <button
                type="submit"
                className="w-full sm:w-auto flex-shrink-0 h-11 px-6 bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white text-xs tracking-[0.18em] uppercase font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>Iscriviti</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. Directory Navigation Columns */}
      <div className="container py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Manifesto */}
          <div className="space-y-4">
            <div>
              <span className="font-serif text-xl tracking-[0.25em] font-normal uppercase text-stone-900 dark:text-stone-100">
                AURA
              </span>
              <span className="text-[7.5px] tracking-[0.3em] text-[#C5A880] uppercase block -mt-1 font-semibold">
                ATELIER
              </span>
            </div>
            <p className="text-xs font-light text-stone-500 dark:text-stone-400 leading-relaxed">
              Gioielli e accessori dal fascino contemporaneo. Ogni pezzo è concepito per valorizzare l'eleganza femminile e il rigore maschile con materiali di pregio e dettagli impeccabili.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve, desidero richiedere assistenza sul catalogo Aura.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Concierge WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Collezioni */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-stone-900 dark:text-stone-100">
              Collezioni
            </h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link href="/catalog?category=gioielli" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  Gioielli & Bijoux d'Autore
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=borse" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  Borse & Pelletteria
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=donna" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  Selezione Donna
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=uomo" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  Accessori Uomo
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  Tutti gli Articoli
                </Link>
              </li>
            </ul>
          </div>

          {/* Servizio Clienti */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-stone-900 dark:text-stone-100">
              Esperienza Cliente
            </h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <span className="text-stone-600 dark:text-stone-400">
                  Spedizione Assicurata 24/48h
                </span>
              </li>
              <li>
                <span className="text-stone-600 dark:text-stone-400">
                  Ordini Diretti su WhatsApp
                </span>
              </li>
              <li>
                <span className="text-stone-600 dark:text-stone-400">
                  Garanzia di Autenticità
                </span>
              </li>
              <li>
                <span className="text-stone-600 dark:text-stone-400">
                  Reso Semplificato entro 14gg
                </span>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  La tua Wishlist Personale
                </Link>
              </li>
            </ul>
          </div>

          {/* Maison & Login */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-stone-900 dark:text-stone-100">
              Maison
            </h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link href="/auth/login" className="hover:text-stone-950 dark:hover:text-white transition-colors">
                  Area Riservata Staff
                </Link>
              </li>
              <li>
                <span className="text-stone-400">Milano • Roma • Parigi</span>
              </li>
              <li>
                <span className="text-stone-400">Artigianato Italiano</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="border-t border-stone-200/80 dark:border-stone-800/80 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-[0.16em] uppercase text-stone-400 font-medium text-center sm:text-left">
          <p>© {new Date().getFullYear()} AURA ATELIER. TUTTI I DIRITTI RISERVATI.</p>
          <p className="text-stone-500">BOUTIQUE & WHATSAPP COMMERCE</p>
        </div>
      </div>
    </footer>
  );
}
