import Link from 'next/link';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export function Hero() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';
  const message = encodeURIComponent('Ciao! Vorrei informazioni su una personalizzazione.');

  return (
    <section className="border-b border-[#e2d4c4] bg-[#f8f1e8] dark:border-stone-800 dark:bg-[#211a17]">
      <div className="container py-5 sm:py-8">
        <div className="rounded-[2rem] border border-[#ded0bd] bg-[radial-gradient(ellipse_at_top,#fffaf3,transparent_75%)] px-4 py-14 text-center sm:rounded-[3rem] sm:px-10 sm:py-20 lg:py-24 dark:border-[#524033] dark:bg-[radial-gradient(ellipse_at_top,#30241d,transparent_75%)]">
          <div aria-hidden="true" className="mx-auto mb-7 h-px w-12 bg-[#9c784b] dark:bg-[#d7b47d]" />
          <h1 className="mx-auto max-w-4xl font-serif text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.98] tracking-[-0.055em] text-[#251c19] dark:text-[#f7eee3]">
            Personalizza{' '}
            <span className="block">ciò che <em className="font-normal text-[#795724] dark:text-[#d7b47d]">ami.</em></span>
          </h1>
          <p className="mx-auto mt-6 max-w-[38ch] text-base leading-relaxed text-stone-700 dark:text-stone-300 sm:text-lg">
            Ricami, bijoux e idee regalo da rendere tuoi con un’iniziale, un nome o un dettaglio speciale.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/catalog" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#251c19] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#46332a] dark:bg-[#f1e8dc] dark:text-[#251c19] dark:hover:bg-white">
              Esplora il catalogo <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#65461f] underline decoration-[#ad916e] underline-offset-4 transition-colors hover:text-[#251c19] dark:text-[#e8c897] dark:hover:text-white">
              <MessageCircle aria-hidden="true" className="h-4 w-4" /> Personalizza su WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
