"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { CartItem, Product, ProductVariant, SelectedLensConfig } from "@/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export interface CartContextType {
  items: CartItem[];
  cartCount: number;
  totalItems: number; // backward compatibility alias
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCartDirect: (product: Product, variant?: ProductVariant, selectedColor?: string) => void;
  addCustomLensToCart: (product: Product, config: SelectedLensConfig, variant?: ProductVariant, selectedColor?: string) => void;
  addItem: (product: Product, color?: string, lensConfig?: SelectedLensConfig, qty?: number) => void; // legacy bridge
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  discountPercentage: number;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  includeCleaningKit: boolean;
  setIncludeCleaningKit: (include: boolean) => void;
  cleaningKitPrice: number;
  rawSubtotal: number;
  subtotal: number; // backward compatibility alias
  grandTotal: number;
  freeDeliveryThreshold: number;
}

const CART_STORAGE_KEY = "shivam_optics_cart_v1";
const CLEANING_KIT_PRICE = 100;
const FREE_DELIVERY_THRESHOLD = 1999;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDetails, setCouponDetails] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    maxDiscount: number | null;
  } | null>(null);
  const [includeCleaningKit, setIncludeCleaningKit] = useState<boolean>(false);

  // Load from localStorage on mount (hydration safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load cart from storage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save cart to storage:", e);
    }
  }, [items, isLoaded]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addToCartDirect = useCallback(
    (product: Product, variant?: ProductVariant, selectedColor?: string) => {
      const color = selectedColor || variant?.colorName || (product.colors && product.colors[0]) || "Standard";
      const variantSuffix = variant ? `-${variant.id}` : `-${color.replace(/\s+/g, "_")}`;
      const newItemId = `${product.id}${variantSuffix}-frame-only`;

      setItems((prev) => {
        const existing = prev.find((item) => item.id === newItemId);
        if (existing) {
          return prev.map((item) =>
            item.id === newItemId ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: newItemId,
            product,
            quantity: 1,
            selectedColor: color,
            selectedVariant: variant,
          },
        ];
      });

      toast.success("Added to Shopping Bag", {
        description: `${product.name} (${color}) added.`,
        action: {
          label: "View Cart",
          onClick: () => setIsCartOpen(true),
        },
      });
      setIsCartOpen(true);
    },
    []
  );

  const addCustomLensToCart = useCallback(
    (product: Product, config: SelectedLensConfig, variant?: ProductVariant, selectedColor?: string) => {
      const color = selectedColor || variant?.colorName || (product.colors && product.colors[0]) || "Standard";
      const variantSuffix = variant ? `-${variant.id}` : `-${color.replace(/\s+/g, "_")}`;
      const newItemId = `${product.id}${variantSuffix}-lens-${Date.now()}`;

      setItems((prev) => [
        ...prev,
        {
          id: newItemId,
          product,
          quantity: 1,
          selectedColor: color,
          selectedVariant: variant,
          lensConfig: config,
        },
      ]);

      const lensTitle = config.lensPackage ? config.lensPackage.name : "Custom Rx Lenses";
      toast.success("Custom Lenses Configured", {
        description: `${product.name} fitted with ${lensTitle}.`,
        action: {
          label: "View Cart",
          onClick: () => setIsCartOpen(true),
        },
      });
      setIsCartOpen(true);
    },
    []
  );

  // Backward compatible addItem bridge
  const addItem = useCallback(
    (product: Product, color: string = "Standard", lensConfig?: SelectedLensConfig, qty: number = 1) => {
      if (lensConfig) {
        addCustomLensToCart(product, lensConfig, undefined, color);
      } else {
        addToCartDirect(product, undefined, color);
      }
    },
    [addCustomLensToCart, addToCartDirect]
  );

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === cartItemId);
      if (item) {
        toast.info("Item Removed", {
          description: `${item.product.name} removed from your bag.`,
        });
      }
      return prev.filter((i) => i.id !== cartItemId);
    });
  }, []);

  // Subtotal Calculations
  const rawSubtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const itemLensPrice = item.lensConfig ? (item.lensConfig.totalLensPrice ?? item.lensConfig.packagePrice ?? 0) : 0;
      return acc + (item.product.price + itemLensPrice) * item.quantity;
    }, 0);
  }, [items]);

  const cleaningKitPrice = includeCleaningKit ? CLEANING_KIT_PRICE : 0;
  const currentSubtotal = rawSubtotal + cleaningKitPrice;

  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; message: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        toast.error("Please enter a promo code");
        return { success: false, message: "Please enter a promo code" };
      }

      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: cleanCode, orderAmount: currentSubtotal }),
        });
        const data = await res.json();
        if (data.success && data.coupon) {
          setAppliedCoupon(data.coupon.code);
          setCouponDetails({
            code: data.coupon.code,
            discountType: data.coupon.discountType,
            discountValue: Number(data.coupon.discountValue),
            maxDiscount: data.coupon.maxDiscount ? Number(data.coupon.maxDiscount) : null,
          });
          toast.success("Privilege Code Applied", {
            description: data.message,
          });
          return { success: true, message: data.message };
        } else {
          toast.error("Voucher Declined", {
            description: data.error || "Invalid privilege code",
          });
          return { success: false, message: data.error || "Invalid code" };
        }
      } catch (e: any) {
        toast.error("Validation Error", { description: e.message });
        return { success: false, message: e.message };
      }
    },
    [currentSubtotal]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDetails(null);
    toast.info("Coupon Removed");
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponDetails(null);
    setIncludeCleaningKit(false);
  }, []);

  // Discount and Grand Total Calculations
  const discountAmount = useMemo(() => {
    if (!couponDetails) return 0;
    if (couponDetails.discountType === "percentage") {
      const raw = Math.round((currentSubtotal * couponDetails.discountValue) / 100);
      return couponDetails.maxDiscount ? Math.min(raw, couponDetails.maxDiscount) : raw;
    }
    // Fixed amount
    return Math.min(couponDetails.discountValue, currentSubtotal);
  }, [couponDetails, currentSubtotal]);

  const discountPercentage = useMemo(() => {
    return currentSubtotal > 0 ? Math.round((discountAmount / currentSubtotal) * 100) : 0;
  }, [discountAmount, currentSubtotal]);

  const grandTotal = Math.max(0, currentSubtotal - discountAmount);

  const cartCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        totalItems: cartCount,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCartDirect,
        addCustomLensToCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        appliedCoupon,
        discountPercentage,
        discountAmount,
        applyCoupon,
        removeCoupon,
        includeCleaningKit,
        setIncludeCleaningKit,
        cleaningKitPrice,
        rawSubtotal,
        subtotal: rawSubtotal,
        grandTotal,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
