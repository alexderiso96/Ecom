import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types/database.types';

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        const { items } = get();
        if (!items.some((i) => i.id === product.id)) {
          set({ items: [product, ...items] });
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter((i) => i.id !== productId),
        });
      },

      toggleItem: (product: Product) => {
        const { items, removeItem, addItem } = get();
        const exists = items.some((i) => i.id === product.id);
        if (exists) {
          removeItem(product.id);
        } else {
          addItem(product);
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.some((i) => i.id === productId);
      },

      clearWishlist: () => set({ items: [] }),

      getTotalItems: () => get().items.length,
    }),
    {
      name: 'ecommerce-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
