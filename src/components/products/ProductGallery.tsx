'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isFeatured?: boolean;
  categoryName?: string;
}

export function ProductGallery({
  images,
  productName,
  isFeatured = false,
  categoryName,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = Array.isArray(images) && images.length > 0 ? images : [];
  const currentImage = validImages[selectedIndex] || null;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-4 w-full">
      {/* Main Large Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-100 to-slate-200/50 shadow-sm dark:border-slate-800 dark:bg-slate-900 group">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={`${productName} - Immagine ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            className="object-cover transition-all duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
            <ShoppingBag className="h-20 w-20 stroke-[1]" />
          </div>
        )}

        {/* Badges overlay (top-left) */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
          {isFeatured && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-950 border border-slate-900/20">
              In evidenza
            </span>
          )}
          {categoryName && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-xs backdrop-blur-md border border-white/60 dark:bg-slate-900/90 dark:text-slate-200">
              {categoryName}
            </span>
          )}
        </div>

        {/* Counter Badge (top-right) */}
        {validImages.length > 1 && (
          <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/70 text-white backdrop-blur-md shadow-xs">
            {selectedIndex + 1} / {validImages.length}
          </div>
        )}

        {/* Prev / Next Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Immagine precedente"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm hover:bg-white hover:text-slate-950 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Immagine successiva"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm hover:bg-white hover:text-slate-950 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {validImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300 opacity-70 hover:opacity-100 dark:border-slate-800'
                }`}
              >
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

