import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';

export function Hero() {
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  return (
    <section className="relative overflow-hidden bg-[#FAF8F5] dark:bg-[#100F0E] border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="container py-12 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Haute Couture Typography & Narrative */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 lg:pr-6">
            
            {/* Tagline / Kicker */}
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.26em] uppercase font-semibold text-[#C5A880]">
              <span>✦</span>
              <span>Collezione Permanente & Nuovi Arrivi</span>
            </div>

            {/* Main Editorial Serif Heading */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-normal tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08]">
              L'Eleganza dei Dettagli, <br className="hidden sm:inline" />
              <span className="italic font-light text-stone-800 dark:text-stone-200">il Lusso della Semplicità.</span>
            </h1>

            {/* Subtitle / Fashion Rationale */}
            <p className="text-xs sm:text-sm md:text-base font-light text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
              Gioielli scultorei in metalli nobili, borse in morbida pelle e raffinati accessori studiati per valorizzare la bellezza femminile e il rigore maschile. Un'estetica pulita dove ogni creazione racconta una storia di maestria.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/catalog" className="inline-block">
                <button
                  type="button"
                  className="w-full sm:w-auto h-12 px-8 bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white text-xs tracking-[0.2em] uppercase font-semibold transition-all flex items-center justify-center gap-3 group shadow-subtle cursor-pointer"
                >
                  <span>Scopri la Collezione</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <a
                href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve! Vorrei scoprire i dettagli e la disponibilità della nuova collezione.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-block"
              >
                <button
                  type="button"
                  className="w-full sm:w-auto h-12 px-7 border border-stone-300 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-100 text-stone-800 dark:text-stone-200 text-xs tracking-[0.16em] uppercase font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ordina su WhatsApp</span>
                </button>
              </a>
            </div>

            {/* Three Minimal Editorial Badges */}
            <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 grid grid-cols-3 gap-4 w-full max-w-lg text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-stone-500 dark:text-stone-400">
              <div>
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">✦ Gioielli</span>
                <span>Finitura Artigianale</span>
              </div>
              <div>
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">✦ Borse & Cuoio</span>
                <span>Pellami Selezionati</span>
              </div>
              <div>
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">✦ Spedizione</span>
                <span>24/48h Assicurata</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Hero Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-luxury">
              <Image
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85"
                alt="Aura Atelier Gioielli & Accessori Esclusivi"
                fill
                priority
                className="object-cover object-center filter saturate-[0.95] contrast-[1.02] hover:scale-105 transition-transform duration-1000 ease-out"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              
              {/* Subtle Film Grain Overlay & Corner Fashion Tag */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                <div>
                  <span className="text-[9px] tracking-[0.24em] uppercase text-[#EFE6D8] block font-medium">
                    Capsule Collection
                  </span>
                  <p className="font-serif text-lg tracking-wide text-white font-normal mt-0.5">
                    L'Oro d'Autore & Pelletteria
                  </p>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-stone-300">
                  N° 01/26
                </span>
              </div>
            </div>

            {/* Offset Decorative Minimal Frame */}
            <div className="hidden sm:block absolute -bottom-4 -left-4 w-32 h-32 border-l border-b border-[#C5A880]/50 pointer-events-none -z-0" />
          </div>

        </div>
      </div>
    </section>
  );
}
