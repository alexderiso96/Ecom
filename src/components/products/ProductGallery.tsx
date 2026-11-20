'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types/database.types';

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  // Costruisci l'elenco di tutte le immagini della galleria con fallback sicuro su image_url
  const gallery: string[] = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    if (product.image_url && !list.includes(product.image_url.trim())) {
      list.unshift(product.image_url.trim());
    }
    return list;
  }, [product.images, product.image_url]);

  const [activeIndex, setActiveIndex] = useState(0);

  const currentImage = gallery[activeIndex] || gallery[0] || null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-4">
      {/* Main Image Stage */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F5F2EB] dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-luxury group select-none">
        {currentImage ? (
          <Image
            key={currentImage}
            src={currentImage}
            alt={`${product.name} - Foto ${activeIndex + 1}`}
            fill
            priority
            className="object-cover object-center filter saturate-[0.98] transition-all duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-700">
            <ShoppingBag className="h-20 w-20 stroke-[1]" />
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          {product.is_featured && (
            <span className="px-2.5 py-1 text-[9px] font-semibold tracking-[0.2em] uppercase bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-sm">
              In Evidenza
            </span>
          )}
          {product.category?.name && (
            <span className="px-2.5 py-1 text-[9px] font-medium tracking-[0.16em] uppercase bg-white/90 text-stone-800 backdrop-blur-sm border border-stone-200/60 dark:bg-stone-900/90 dark:text-stone-200 dark:border-stone-700 shadow-2xs">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Left/Right Arrows (visibili se ci sono più foto) */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto precedente"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-stone-800 backdrop-blur-md shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 dark:bg-stone-900/80 dark:hover:bg-stone-900 dark:text-stone-100 z-10"
            >
              <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Foto successiva"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-stone-800 backdrop-blur-md shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 dark:bg-stone-900/80 dark:hover:bg-stone-900 dark:text-stone-100 z-10"
            >
              <ChevronRight className="h-5 w-5 stroke-[1.8]" />
            </button>

            {/* Photo Counter Pill */}
            <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-stone-900/70 backdrop-blur-md text-white text-[10px] font-mono tracking-wider z-10">
              {activeIndex + 1} / {gallery.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Gallery Strip (se più di 1 foto) */}
      {gallery.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {gallery.map((imgUrl, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${imgUrl}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative h-20 w-16 sm:h-24 sm:w-20 flex-shrink-0 overflow-hidden rounded-xs border transition-all ${
                  isSelected
                    ? 'border-[#C5A880] ring-2 ring-[#C5A880]/30 opacity-100 scale-102 shadow-sm'
                    : 'border-stone-200/80 dark:border-stone-800 opacity-60 hover:opacity-100'
                }`}
                title={`Visualizza foto ${idx + 1}`}
              >
                <Image
                  src={imgUrl}
                  alt={`${product.name} miniatura ${idx + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
