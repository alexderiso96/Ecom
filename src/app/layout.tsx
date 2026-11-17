import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

export const metadata: Metadata = {
  title: 'AURA | Gioielli & Accessori Esclusivi',
  description:
    'Boutique di gioielli, borse ed elementi di stile femminile e maschile. Design minimale, materiali di pregio e checkout dedicato su WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1C1917] dark:bg-[#100F0E] dark:text-[#F5F5F4] antialiased selection:bg-[#C5A880]/30 selection:text-[#1C1917]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <CartDrawer />
        <Footer />
      </body>
    </html>
  );
}
