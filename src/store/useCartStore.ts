import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '@/types/database.types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product: Product, quantity = 1) => {
        const { items } = get();
        const existingItemIndex = items.findIndex((i) => i.productId === product.id);

        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          const currentItem = updatedItems[existingItemIndex];
          const newQuantity = Math.min(
            currentItem.quantity + quantity,
            product.stock > 0 ? product.stock : currentItem.quantity + quantity
          );
          updatedItems[existingItemIndex] = {
            ...currentItem,
            quantity: newQuantity,
          };
          set({ items: updatedItems, isOpen: true });
        } else {
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            imageUrl: product.image_url,
            quantity: Math.min(quantity, product.stock > 0 ? product.stock : quantity),
            maxStock: product.stock,
          };
          set({ items: [...items, newItem], isOpen: true });
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter((item) => item.productId !== productId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map((item) => {
            if (item.productId === productId) {
              const safeQty = item.maxStock > 0 ? Math.min(quantity, item.maxStock) : quantity;
              return { ...item, quantity: safeQty };
            }
            return item;
          }),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'ecommerce-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

