import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export function Hero() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';
  const message = encodeURIComponent('Ciao! Vorrei informazioni su una personalizzazione.');

  return (
    <section className="border-b border-[#e2d4c4] bg-[#f8f1e8] dark:border-stone-800 dark:bg-[#211a17]">
      <div className="container grid items-center gap-9 py-10 sm:gap-12 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16">
        <div className="max-w-xl lg:py-8">
          <div aria-hidden="true" className="mb-6 h-px w-12 bg-[#9c784b] dark:bg-[#d7b47d]" />
          <h1 className="font-serif text-[clamp(3rem,8vw,5.25rem)] leading-[0.97] tracking-[-0.055em] text-[#251c19] dark:text-[#f7eee3] lg:text-[clamp(3.5rem,6.1vw,5.25rem)]">
            Personalizza
            <span className="block">ciò che <em className="font-normal text-[#795724] dark:text-[#d7b47d]">ami.</em></span>
          </h1>
          <p className="mt-6 max-w-[36ch] text-base leading-relaxed text-stone-700 dark:text-stone-300 sm:text-lg">
            Ricami, bijoux e idee regalo da rendere tuoi con un’iniziale, un nome o un dettaglio speciale.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/catalog" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#251c19] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#46332a] dark:bg-[#f1e8dc] dark:text-[#251c19] dark:hover:bg-white">
              Esplora il catalogo <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#65461f] underline decoration-[#ad916e] underline-offset-4 transition-colors hover:text-[#251c19] dark:text-[#e8c897] dark:hover:text-white">
              <MessageCircle aria-hidden="true" className="h-4 w-4" /> Personalizza su WhatsApp
            </a>
          </div>
        </div>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem] rounded-tr-[4rem] bg-[#e9dccc] shadow-[0_20px_55px_-34px_rgba(66,42,25,0.55)] sm:rounded-tr-[6rem]">
          <Image
            src="/dream-creation/hero-ricamo.jpg"
            alt="Una mano ricama un motivo botanico con filo dorato su un telaio di legno"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 54vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-2.5 rounded-[1rem] rounded-tr-[3.35rem] border border-white/45 sm:rounded-tr-[5.35rem]" />
        </div>
      </div>
    </section>
  );
}
