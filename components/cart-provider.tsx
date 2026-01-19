'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartUtils, Cart, CartItem } from '@/lib/cart';

interface CartContextType {
  cart: Cart;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

import { useSession } from 'next-auth/react';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [mounted, setMounted] = useState(false);

  // Determine storage key
  const storageKey = session?.user?.email 
    ? `vendora_cart_${session.user.email}`
    : 'vendora_guest_cart';

  // Load cart on mount and when session/key changes
  useEffect(() => {
    setCart(cartUtils.getCart(storageKey));
    setMounted(true);
  }, [storageKey]);

  const addItem = (item: CartItem) => {
    const newCart = cartUtils.addItem(item, storageKey);
    setCart(newCart);
  };

  const removeItem = (variantId: string) => {
    const newCart = cartUtils.removeItem(variantId, storageKey);
    setCart(newCart);
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    const newCart = cartUtils.updateQuantity(variantId, quantity, storageKey);
    setCart(newCart);
  };

  const clearCart = () => {
    const newCart = cartUtils.clearCart(storageKey);
    setCart(newCart);
  };

  const itemCount = cartUtils.getItemCount(cart);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, itemCount }}>
      {mounted ? children : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
