import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export function Hero() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';
  const message = encodeURIComponent('Ciao! Vorrei informazioni su una personalizzazione.');

  return (
    <section className="border-b border-[#dbcdbd] bg-[#f1e8dc] dark:border-stone-800 dark:bg-[#211a17]">
      <div className="container grid gap-9 py-10 md:grid-cols-2 md:items-center md:gap-14 md:py-16">
        <div className="max-w-xl space-y-6">
          <Image
            src="/dream-creation/logo.png"
            alt="Dream Creation"
            width={86}
            height={86}
            priority
            className="rounded-full"
          />
          <h1 className="font-serif text-5xl leading-[1.04] tracking-tight text-[#251c19] dark:text-[#f7eee3] sm:text-6xl xl:text-7xl">
            Personalizza ciò che <em className="font-normal text-[#795724] dark:text-[#d7b47d]">ami.</em>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-stone-700 dark:text-stone-300">
            Ombrelli ricamati, bijoux, tazze e idee regalo. Scrivici per scegliere la personalizzazione e conoscere costi e spedizione.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/catalog" className="inline-flex items-center gap-2 rounded-full bg-[#251c19] px-5 py-3 text-sm font-semibold text-white hover:bg-[#46332a] dark:bg-[#f1e8dc] dark:text-[#251c19] dark:hover:bg-white">
              Sfoglia il catalogo <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#a98b65] px-5 py-3 text-sm font-semibold hover:bg-[#e9dccc] dark:hover:bg-stone-800">
              <MessageCircle className="h-4 w-4" /> Scrivici su WhatsApp
            </a>
          </div>
        </div>
        <div className="grid aspect-[5/4] grid-cols-[1.2fr_1fr] grid-rows-2 gap-2 overflow-hidden rounded-2xl">
          <div className="relative row-span-2">
            <Image src="/dream-creation/ricami.jpg" alt="Pochette nere con iniziali ricamate in oro" fill priority sizes="(max-width: 767px) 52vw, 28vw" className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/dream-creation/ombrelli.jpg" alt="Ombrelli personalizzati con iniziali ricamate" fill sizes="(max-width: 767px) 44vw, 24vw" className="object-cover object-[center_30%]" />
          </div>
          <div className="relative">
            <Image src="/dream-creation/bijoux.jpg" alt="Orecchini ovali colorati" fill sizes="(max-width: 767px) 44vw, 24vw" className="object-cover object-top" />
          </div>
        </div>
      </div>
    </section>
  );
}
