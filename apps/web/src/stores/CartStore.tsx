import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';

const cartSchema = z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20) }));
export interface CartItem { productId: string; quantity: number }
interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('cedar-cart') ?? '[]');
    return cartSchema.parse(stored);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  useEffect(() => localStorage.setItem('cedar-cart', JSON.stringify(items)), [items]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    add: (productId) => setItems((current) => {
      const present = current.find((item) => item.productId === productId);
      return present ? current.map((item) => item.productId === productId ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item) : [...current, { productId, quantity: 1 }];
    }),
    setQuantity: (productId, quantity) => setItems((current) => quantity <= 0 ? current.filter((item) => item.productId !== productId) : current.map((item) => item.productId === productId ? { ...item, quantity: Math.min(20, quantity) } : item)),
    remove: (productId) => setItems((current) => current.filter((item) => item.productId !== productId)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider.');
  return value;
}
