'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Shield,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Search,
  MessageCircle,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { openCart, getTotalItems, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';

  // Scorciatoia rapida Cmd+K / Ctrl+K per dare focus immediato alla barra di ricerca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/catalog?q=${encodeURIComponent(q)}`);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Catalogo Prodotti', href: '/catalog' },
  ];

  return (
    <>
      {/* 1. Top Announcement Ribbon */}
      <div className="bg-slate-900 text-slate-200 text-[11px] font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-slate-800 selection:bg-indigo-500">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-300">
          Spedizioni Express 24/48h • Ordini e assistenza diretta su WhatsApp
        </span>
        <a
          href={`https://wa.me/${adminPhone}?text=${encodeURIComponent('Salve, vorrei informazioni sui vostri prodotti.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 ml-1 transition-colors"
        >
          <MessageCircle className="h-3 w-3 inline" />
          <span>Chat WhatsApp</span>
        </a>
      </div>

      {/* 2. Main Luxury Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/80 transition-all">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm ring-1 ring-slate-900/10 group-hover:scale-105 group-hover:shadow-indigo-500/20 transition-all dark:from-white dark:via-slate-200 dark:to-white dark:text-slate-950">
              <Sparkles className="h-4 w-4 text-indigo-400 dark:text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                AURA
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                STORE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-full border border-slate-200/60 dark:bg-slate-900/70 dark:border-slate-800/80">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Functional Interactive Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center relative w-56 xl:w-64"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cerca prodotti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-full border border-slate-200/80 bg-slate-100/70 text-xs text-slate-900 placeholder:text-slate-400 backdrop-blur-md focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:border-slate-400 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Cancella testo"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="hidden xl:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 bg-white/90 border border-slate-200/90 dark:bg-slate-800 dark:border-slate-700 px-1.5 py-0.5 rounded-md pointer-events-none">
                ⌘K
              </kbd>
            )}
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* Admin Badges with dynamic active states */}
            {userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
              <Link
                href="/admin"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10 font-bold dark:bg-white dark:text-slate-900'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-900/40'
                }`}
              >
                <Shield className={`h-3.5 w-3.5 ${pathname.startsWith('/admin') ? 'text-indigo-400 dark:text-indigo-600' : 'text-indigo-600 dark:text-indigo-400'}`} />
                <span>Admin</span>
              </Link>
            )}

            {userProfile && userProfile.role === 'superadmin' && (
              <Link
                href="/superadmin"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith('/superadmin')
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-900/40'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SuperAdmin</span>
              </Link>
            )}

            {/* Cart Trigger with Dynamic Price & Counter */}
            <button
              onClick={openCart}
              className={`relative flex items-center gap-2 h-10 px-3.5 rounded-full border transition-all duration-200 active:scale-95 shadow-sm ${
                mounted && totalItems > 0
                  ? 'border-indigo-200 bg-indigo-50/50 text-indigo-900 hover:bg-indigo-100/70 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200'
                  : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}
              aria-label="Apri Carrello"
            >
              <ShoppingBag className="h-4 w-4" />
              {mounted && totalItems > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                    {totalItems}
                  </span>
                  <span className="text-xs font-bold hidden sm:inline-block">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-semibold hidden sm:inline-block text-slate-500">
                  Carrello
                </span>
              )}
            </button>

            {/* User Profile Dropdown Pill */}
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
                  className="flex h-10 items-center gap-2 pl-1.5 pr-2.5 rounded-full border border-slate-200/90 bg-white text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer transition-colors"
                  aria-expanded={userMenuOpen}
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {userProfile.full_name?.charAt(0).toUpperCase() ||
                      userProfile.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold max-w-[90px] truncate hidden md:inline-block">
                    {userProfile.full_name?.split(' ')[0] || userProfile.email.split('@')[0]}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-60 z-50 animate-fade-in">
                    <div className="rounded-2xl bg-white p-2.5 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {userProfile.full_name || 'Utente registrato'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {userProfile.email}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Ruolo: {userProfile.role}
                        </span>
                      </div>

                      <div className="py-1">
                        {(userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Pannello Amministratore
                          </Link>
                        )}

                        {userProfile.role === 'superadmin' && (
                          <Link
                            href="/superadmin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/50 rounded-xl transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Control Room SuperAdmin
                          </Link>
                        )}

                        <Link
                          href="/catalog"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <Search className="h-4 w-4 text-slate-400" />
                          Esplora Catalogo
                        </Link>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          Disconnetti
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex h-10 items-center gap-2 px-4 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>Accedi</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 text-slate-700 dark:border-slate-800 dark:text-slate-300"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 dark:border-slate-800 dark:bg-slate-950/95 space-y-2 animate-fade-in shadow-xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  pathname === link.href
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Real Search Input */}
            <form
              onSubmit={(e) => {
                setMobileMenuOpen(false);
                handleSearch(e);
              }}
              className="relative my-2"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca prodotti e premi Invio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-9 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  title="Cancella testo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin') && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40"
              >
                Dashboard Amministratore
              </Link>
            )}

            {userProfile && userProfile.role === 'superadmin' && (
              <Link
                href="/superadmin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50/50 dark:bg-purple-950/40"
              >
                Dashboard SuperAdmin (Gestione Utenti)
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
