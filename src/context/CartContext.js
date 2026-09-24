import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@fanportal/cart';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const itemsRef = useRef([]); // permite que las acciones sean estables (no re-renderizan el catálogo)

  const commit = useCallback((next) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  // 1) Recuperar el carrito guardado al abrir la app
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) commit(JSON.parse(raw));
      } catch (e) {
        console.warn('No se pudo recuperar el carrito', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, [commit]);

  // 2) Guardar cada cambio (carrito vacío => se elimina la clave)
  useEffect(() => {
    if (!hydrated) return;
    const save = items.length
      ? AsyncStorage.setItem(CART_KEY, JSON.stringify(items))
      : AsyncStorage.removeItem(CART_KEY);
    save.catch((e) => console.warn('No se pudo guardar el carrito', e));
  }, [items, hydrated]);

  /** PC-02: la regla de stock también se valida aquí, no solo en la UI. */
  const addItem = useCallback(
    (product) => {
      if (product.stock <= 0) return { ok: false, reason: 'sin_stock' };
      const current = itemsRef.current;
      const existing = current.find((i) => i.id === product.id);
      if (existing && existing.quantity >= product.stock) return { ok: false, reason: 'limite_stock' };

      commit(
        existing
          ? current.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...current, { ...product, quantity: 1 }]
      );
      return { ok: true };
    },
    [commit]
  );

  const updateQuantity = useCallback(
    (id, delta) => {
      commit(
        itemsRef.current
          .map((i) => (i.id === id ? { ...i, quantity: Math.min(i.quantity + delta, i.stock) } : i))
          .filter((i) => i.quantity > 0)
      );
    },
    [commit]
  );

  const removeItem = useCallback((id) => commit(itemsRef.current.filter((i) => i.id !== id)), [commit]);

  /** PC-04: vacía el estado Y borra la memoria local. El contador vuelve a 0. */
  const clearCart = useCallback(async () => {
    commit([]);
    try {
      await AsyncStorage.removeItem(CART_KEY);
    } catch (e) {
      console.warn('No se pudo limpiar el carrito', e);
    }
  }, [commit]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, count, subtotal, hydrated, addItem, updateQuantity, removeItem, clearCart }),
    [items, count, subtotal, hydrated, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
};
