// Shopping cart utilities for client-side state management

export interface CartItem {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  slug: string;
  maxStock: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

const DEFAULT_STORAGE_KEY = "vendora_guest_cart";

export const cartUtils = {
  // Get cart from localStorage
  getCart(storageKey: string = DEFAULT_STORAGE_KEY): Cart {
    if (typeof window === "undefined") return { items: [], total: 0 };

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return { items: [], total: 0 };

      const cart: Cart = JSON.parse(stored);
      return cart;
    } catch {
      return { items: [], total: 0 };
    }
  },

  // Save cart to localStorage
  saveCart(cart: Cart, storageKey: string = DEFAULT_STORAGE_KEY): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(cart));
  },

  // Add item to cart
  addItem(item: CartItem, storageKey: string = DEFAULT_STORAGE_KEY): Cart {
    const cart = this.getCart(storageKey);
    const existingIndex = cart.items.findIndex(
      (i) => i.variantId === item.variantId,
    );

    if (existingIndex >= 0) {
      // Update quantity (respect max stock)
      const existing = cart.items[existingIndex];
      const newQuantity = Math.min(
        existing.quantity + item.quantity,
        item.maxStock,
      );
      cart.items[existingIndex] = { ...existing, quantity: newQuantity };
    } else {
      // Add new item
      cart.items.push(item);
    }

    cart.total = this.calculateTotal(cart.items);
    this.saveCart(cart, storageKey);
    return cart;
  },

  // Update item quantity
  updateQuantity(
    variantId: string,
    quantity: number,
    storageKey: string = DEFAULT_STORAGE_KEY,
  ): Cart {
    const cart = this.getCart(storageKey);
    const itemIndex = cart.items.findIndex((i) => i.variantId === variantId);

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity (respect max stock)
        const item = cart.items[itemIndex];
        cart.items[itemIndex] = {
          ...item,
          quantity: Math.min(quantity, item.maxStock),
        };
      }
    }

    cart.total = this.calculateTotal(cart.items);
    this.saveCart(cart, storageKey);
    return cart;
  },

  // Remove item from cart
  removeItem(
    variantId: string,
    storageKey: string = DEFAULT_STORAGE_KEY,
  ): Cart {
    return this.updateQuantity(variantId, 0, storageKey);
  },

  // Clear entire cart
  clearCart(storageKey: string = DEFAULT_STORAGE_KEY): Cart {
    const cart = { items: [], total: 0 };
    this.saveCart(cart, storageKey);
    return cart;
  },

  // Calculate total price
  calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  // Get item count
  getItemCount(cart?: Cart): number {
    const c = cart || this.getCart();
    return c.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Format cart for checkout API
  formatForCheckout(cart: Cart): { variantId: string; quantity: number }[] {
    return cart.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));
  },
};
