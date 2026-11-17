'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Shield,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';

interface BoutiqueNavItem {
  label: string;
  href: string;
  categorySlug?: string | null;
}

// Categorie merceologiche reali (Donna e Uomo sono gestiti separatamente come Reparti)
const boutiqueCategories: BoutiqueNavItem[] = [
  { label: 'Gioielli', href: '/catalog?category=gioielli', categorySlug: 'gioielli' },
  { label: 'Borse', href: '/catalog?category=borse', categorySlug: 'borse' },
  { label: 'Accessori', href: '/catalog?category=accessori', categorySlug: 'accessori' },
  { label: 'Tutto il Catalogo', href: '/catalog', categorySlug: null },
];

function NavbarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const currentDepartment = searchParams.get('department');

  const { openCart, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalItems = getTotalItems();
  const totalWishlistItems = useWishlistStore((state) => state.items.length);
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  // Scorciatoia rapida Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/catalog?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    } else {
      router.push('/catalog');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    const fetchUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserProfile(null);
    window.location.href = '/';
  };

  return (
    <>
      {/* 1. Top Ribbon - Minimalist Luxury */}
      <div className="bg-[#1C1917] text-[#E7E5E4] text-[10px] tracking-[0.22em] font-medium py-2 px-4 text-center uppercase border-b border-stone-800/80 flex items-center justify-between sm:justify-center relative">
        <span className="hidden sm:inline-block text-[#C5A880] mr-2">✦</span>
        <span>Spedizione Assicurata 24/48h • Assistenza Personale su WhatsApp</span>
        <span className="hidden sm:inline-block text-[#C5A880] ml-2">✦</span>

        <a
          href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve, vorrei una consulenza sui vostri gioielli e accessori.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex sm:absolute sm:right-6 items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-[#C5A880] hover:text-[#EFE6D8] transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          <span className="hidden md:inline">Concierge</span>
        </a>
      </div>

      {/* 2. Main Luxury Boutique Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/70 bg-[#FDFBF7]/90 backdrop-blur-xl dark:border-stone-800/70 dark:bg-[#100F0E]/90 transition-all">
        <div className="container relative flex h-20 items-center justify-between">
          
          {/* LEFT: Department Selector (Donna/Uomo) + Actual Product Categories */}
          <div className="flex items-center gap-5 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 -ml-1.5 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors"
              aria-label="Apri Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 stroke-[1.4]" /> : <Menu className="h-5 w-5 stroke-[1.4]" />}
            </button>

            {/* Department (Donna / Uomo) separato dalle categorie */}
            <div className="hidden lg:flex items-center gap-1 border-r border-stone-200 dark:border-stone-800 pr-4">
              <Link
                href="/catalog?department=donna"
                className={`text-[11px] tracking-[0.2em] uppercase font-semibold py-1 transition-colors relative ${
                  pathname === '/catalog' && currentDepartment === 'donna'
                    ? 'text-stone-950 dark:text-white font-bold'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                <span>Donna</span>
                {pathname === '/catalog' && currentDepartment === 'donna' && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C5A880]" />
                )}
              </Link>
              <span className="text-stone-300 dark:text-stone-700 text-[10px] mx-1">/</span>
              <Link
                href="/catalog?department=uomo"
                className={`text-[11px] tracking-[0.2em] uppercase font-semibold py-1 transition-colors relative ${
                  pathname === '/catalog' && currentDepartment === 'uomo'
                    ? 'text-stone-950 dark:text-white font-bold'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                <span>Uomo</span>
                {pathname === '/catalog' && currentDepartment === 'uomo' && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C5A880]" />
                )}
              </Link>
            </div>

            {/* Categorie Prodotto Reali: Gioielli, Borse, Accessori, Tutto */}
            <nav className="hidden lg:flex items-center gap-5">
              {boutiqueCategories.map((item) => {
                const isActive =
                  item.categorySlug !== undefined
                    ? pathname === '/catalog' && !currentDepartment && (currentCategory || null) === item.categorySlug
                    : pathname === item.href && !currentDepartment;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative text-[11px] font-medium tracking-[0.18em] uppercase transition-colors duration-200 py-1 ${
                      isActive
                        ? 'text-stone-950 dark:text-white font-semibold'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C5A880]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* CENTER: Centered Logo Boutique */}
          <div className="flex-shrink-0 text-center">
            <Link href="/" className="inline-flex flex-col items-center group">
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.32em] font-normal uppercase text-stone-900 dark:text-stone-100 group-hover:opacity-80 transition-opacity">
                AURA
              </span>
              <span className="text-[7.5px] tracking-[0.38em] text-[#C5A880] font-sans uppercase -mt-0.5 font-medium">
                ATELIER
              </span>
            </Link>
          </div>

          {/* RIGHT: Search, Wishlist, Cart & Profile */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 flex-1">
            {/* Search Toggle Icon */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="p-2 text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
              aria-label="Cerca nel catalogo"
              title="Cerca (⌘K)"
            >
              <Search className="h-4 w-4 stroke-[1.4]" />
            </button>

            {/* Wishlist Link with fine badge */}
            <Link
              href="/wishlist"
              className="relative p-2 text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
              aria-label="Lista Desideri"
              title="I tuoi Preferiti"
            >
              <Heart className={`h-4 w-4 stroke-[1.4] ${mounted && totalWishlistItems > 0 ? 'fill-[#C5A880] text-[#C5A880]' : ''}`} />
              {mounted && totalWishlistItems > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-[#1C1917] text-[8px] font-bold text-white dark:bg-stone-100 dark:text-stone-950">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            {/* Cart Trigger with fine badge */}
            <button
              onClick={openCart}
              className="relative p-2 text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors flex items-center gap-2"
              aria-label="Apri Carrello"
            >
              <ShoppingBag className="h-4 w-4 stroke-[1.4]" />
              {mounted && totalItems > 0 ? (
                <span className="flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-[#C5A880] text-[8px] font-bold text-stone-950">
                  {totalItems}
                </span>
              ) : null}
            </button>

            {/* Admin Badges */}
            {userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
              <Link
                href="/admin"
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[9px] tracking-[0.16em] uppercase font-semibold border transition-all ${
                  pathname.startsWith('/admin')
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-950'
                    : 'border-stone-300 text-stone-700 hover:border-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-100'
                }`}
              >
                <Shield className="h-3 w-3 stroke-[1.5]" />
                <span>Admin</span>
              </Link>
            )}

            {/* User Profile / Login */}
            {userProfile ? (
              <div
                ref={userMenuRef}
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="p-2 text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors flex items-center gap-1.5"
                  aria-expanded={userMenuOpen}
                >
                  <User className="h-4 w-4 stroke-[1.4]" />
                  <span className="text-[11px] tracking-[0.12em] uppercase font-medium max-w-[80px] truncate hidden xl:inline-block">
                    {userProfile.full_name?.split(' ')[0] || userProfile.email.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-56 z-50 animate-fade-in">
                    <div className="rounded-xs bg-[#FDFBF7] dark:bg-[#151413] p-3 shadow-luxury border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 text-left">
                      <div className="pb-2.5">
                        <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                          {userProfile.full_name || 'Gentile Cliente'}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5">
                          {userProfile.email}
                        </p>
                        <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                          {userProfile.role}
                        </span>
                      </div>

                      <div className="py-2 space-y-1">
                        {(userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
                          >
                            <Shield className="h-3.5 w-3.5 text-[#C5A880]" />
                            <span>Pannello Admin</span>
                          </Link>
                        )}

                        {userProfile.role === 'superadmin' && (
                          <Link
                            href="/superadmin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                            <span>SuperAdmin Control</span>
                          </Link>
                        )}

                        <Link
                          href="/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
                        >
                          <Heart className="h-3.5 w-3.5 text-stone-400" />
                          <span>Lista Desideri</span>
                        </Link>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Disconnetti</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="p-2 text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
                aria-label="Accedi"
                title="Accedi al tuo account"
              >
                <User className="h-4 w-4 stroke-[1.4]" />
              </Link>
            )}
          </div>
        </div>

        {/* Expandable Luxury Search Drawer */}
        {searchOpen && (
          <div className="border-t border-stone-200/80 bg-[#FAF8F5]/98 dark:border-stone-800 dark:bg-[#121110]/98 px-4 py-4 animate-fade-in shadow-subtle">
            <div className="container max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C5A880]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cerca gioielli, borse, accessori o codici..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-10 py-2.5 bg-transparent border-b border-stone-300 dark:border-stone-700 text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 dark:text-stone-100 dark:focus:border-[#C5A880] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-serif"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200/80 bg-[#FDFBF7] dark:border-stone-800 dark:bg-[#100F0E] p-6 space-y-4 animate-fade-in shadow-xl">
            {/* Reparti Donna / Uomo */}
            <div className="pb-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400">Reparto:</span>
              <Link
                href="/catalog?department=donna"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs tracking-[0.16em] uppercase px-3 py-1 border transition-all ${
                  currentDepartment === 'donna'
                    ? 'border-[#C5A880] bg-[#C5A880] text-stone-950 font-semibold'
                    : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                Donna
              </Link>
              <Link
                href="/catalog?department=uomo"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs tracking-[0.16em] uppercase px-3 py-1 border transition-all ${
                  currentDepartment === 'uomo'
                    ? 'border-[#C5A880] bg-[#C5A880] text-stone-950 font-semibold'
                    : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                Uomo
              </Link>
            </div>

            {/* Categorie */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1">
                Categorie:
              </span>
              {boutiqueCategories.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-serif tracking-[0.12em] uppercase text-stone-800 hover:text-[#C5A880] dark:text-stone-200 py-1 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-600 dark:text-stone-400 py-1"
              >
                <span>Lista dei Desideri</span>
                <span className="font-bold text-[#C5A880]">{totalWishlistItems}</span>
              </Link>
              
              <a
                href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve, vorrei assistenza per un ordine.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-emerald-700 dark:text-emerald-400 py-1"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Concierge WhatsApp</span>
              </a>

              {userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs tracking-[0.15em] uppercase text-stone-900 font-bold py-1"
                >
                  Dashboard Amministratore
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-20 bg-[#FDFBF7] dark:bg-[#100F0E] border-b border-stone-200/70" />}>
      <NavbarInner />
    </Suspense>
  );
}
