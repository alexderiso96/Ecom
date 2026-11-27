import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';
import { Brand } from './Brand';

export function Footer() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';
  const message = encodeURIComponent('Ciao! Vorrei informazioni su costi, personalizzazioni e spedizione.');

  return (
    <footer className="mt-20 border-t border-[#dbcdbd] bg-[#f1e8dc] dark:border-stone-800 dark:bg-[#211a17]">
      <div className="container grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <Brand />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            Accessori e idee regalo da personalizzare.
          </p>
        </div>
        <nav aria-label="Collezioni" className="flex flex-col items-start gap-2 text-sm">
          <Link href="/catalog?category=ombrelli" className="hover:underline">Ombrelli</Link>
          <Link href="/catalog?category=gioielli" className="hover:underline">Bijoux</Link>
          <Link href="/catalog?category=tazze" className="hover:underline">Tazze</Link>
          <Link href="/catalog" className="hover:underline">Tutto il catalogo</Link>
        </nav>
        <div className="flex flex-col items-start gap-3 text-sm">
          <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a href="https://www.instagram.com/dream_creation_91/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
            <Instagram className="h-4 w-4" /> @dream_creation_91
          </a>
        </div>
      </div>
      <div className="border-t border-[#dbcdbd] dark:border-stone-800">
        <div className="container flex flex-wrap justify-between gap-3 py-5 text-xs text-stone-700 dark:text-stone-300">
          <p>© {new Date().getFullYear()} Dream Creation</p>
          <Link href="/auth/login" className="hover:underline">Area riservata</Link>
        </div>
      </div>
    </footer>
  );
}
