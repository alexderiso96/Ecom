import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

export const metadata: Metadata = {
  title: 'Dream Creation | Regali e accessori personalizzati',
  icons: { icon: '/dream-creation/logo.png' },
  description:
    'Ombrelli ricamati, bijoux, tazze e idee regalo personalizzate. Scrivici su WhatsApp per informazioni, costi e spedizione.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#FAF5EE] text-[#251C19] dark:bg-[#181311] dark:text-[#F5F5F4] antialiased selection:bg-[#B8915D]/30 selection:text-[#251C19]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <CartDrawer />
        <Footer />
      </body>
    </html>
  );
}
