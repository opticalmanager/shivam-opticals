"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product } from "@/types";
import { toast } from "sonner";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, color: string, lensConfig?: CartItem["lensConfig"], qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  freeDeliveryThreshold: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_DELIVERY_THRESHOLD = 1999;
const CART_STORAGE_KEY = "shivam_optics_cart_v1";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read cart from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn("Failed to persist cart to localStorage", e);
      }
    }
  }, [items, isHydrated]);

  const addItem = (product: Product, color: string, lensConfig?: CartItem["lensConfig"], qty: number = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.selectedColor === color &&
          i.lensConfig?.packageId === lensConfig?.packageId
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }

      const newItem: CartItem = {
        id: `${product.id}-${color}-${lensConfig?.packageId || "frame"}-${Date.now()}`,
        product,
        selectedColor: color,
        lensConfig,
        quantity: qty,
      };
      return [...prev, newItem];
    });

    toast.success(`${product.name} added to cart!`, {
      description: `${color} • Qty: ${qty}`,
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from cart");
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscountPercent(0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const framePrice = item.product.price;
    const lensPrice = item.lensConfig?.packagePrice || 0;
    return sum + (framePrice + lensPrice) * item.quantity;
  }, 0);

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === "FLAT12" || clean === "SHIVAM12") {
      setAppliedCoupon(clean);
      setDiscountPercent(12);
      toast.success("Promo Code Applied!", { description: "12% discount applied to your order." });
      return true;
    }
    toast.error("Invalid Promo Code", { description: "Please use FLAT12 for 12% off." });
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercent(0);
    toast.info("Coupon removed");
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discountAmount,
        grandTotal,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
