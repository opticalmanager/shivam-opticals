"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { PRODUCTS } from "@/data/products";
import { Product } from "@/types";

export interface WishlistContextType {
  wishlistIds: string[];
  wishlistCount: number;
  totalWishlist: number; // backward compatibility alias
  wishlistProducts: Product[];
  isWishlisted: (productId: string) => boolean;
  isInWishlist: (productId: string) => boolean; // backward compatibility alias
  toggleWishlist: (productId: string, productName?: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlistDrawer: () => void;
  sessionId: string;
  isSyncing: boolean;
}

const WISHLIST_STORAGE_KEY = "shivam_optics_wishlist_v1";
const SESSION_STORAGE_KEY = "shivam_optics_session_id";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const syncedWithDb = useRef<boolean>(false);

  // 1. Initialize session ID and local storage on client mount
  useEffect(() => {
    try {
      let currentSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!currentSessionId) {
        currentSessionId = `so_sess_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(SESSION_STORAGE_KEY, currentSessionId);
      }
      setSessionId(currentSessionId);

      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load local wishlist:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Persist to local storage whenever wishlistIds changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch (e) {
      console.warn("Failed to save local wishlist:", e);
    }
  }, [wishlistIds, isLoaded]);

  // 3. Background DB synchronization
  useEffect(() => {
    if (!isLoaded || !sessionId || syncedWithDb.current) return;
    syncedWithDb.current = true;

    const syncWithDatabase = async () => {
      try {
        setIsSyncing(true);
        const userId = user?.id || "";
        const queryParams = new URLSearchParams();
        if (userId) queryParams.set("userId", userId);
        if (sessionId) queryParams.set("sessionId", sessionId);

        // Fetch current wishlist from DB
        const res = await fetch(`/api/wishlist?${queryParams.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const dbIds: string[] = Array.isArray(data.wishlistIds) ? data.wishlistIds : [];

        // Merge local storage and database IDs
        const localSaved = localStorage.getItem(WISHLIST_STORAGE_KEY);
        const localIds: string[] = localSaved ? JSON.parse(localSaved) : [];
        const combined = Array.from(new Set([...localIds, ...dbIds]));

        setWishlistIds(combined);

        // If local storage had items that DB didn't have, sync them back
        const missingInDb = localIds.filter((id) => !dbIds.includes(id));
        if (missingInDb.length > 0) {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sync",
              localIds: combined,
              userId: userId || undefined,
              sessionId: sessionId || undefined,
            }),
          });
        }
      } catch (err) {
        console.warn("Background wishlist DB sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithDatabase();
  }, [isLoaded, sessionId, user?.id]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (productId: string, productName?: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        const newIds = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

        const targetProduct = PRODUCTS.find((p) => p.id === productId);
        const name = productName || targetProduct?.name || "Eyewear Frame";

        if (exists) {
          toast.info("Removed from Saved Favorites", {
            description: `${name} removed from wishlist.`,
          });
        } else {
          toast.success("Saved to Favorites", {
            description: `${name} bookmarked in your personal atelier vault.`,
            action: {
              label: "View Vault",
              onClick: () => setIsWishlistOpen(true),
            },
          });
        }

        // Asynchronously sync with backend database
        const userId = user?.id;
        const currentSession = sessionId || (typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : "");
        fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: exists ? "toggle" : "add",
            productId,
            userId: userId || undefined,
            sessionId: currentSession || undefined,
          }),
        }).catch((err) => console.warn("Wishlist toggle DB error:", err));

        return newIds;
      });
    },
    [sessionId, user?.id]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      toast.info("Frame removed from saved favorites.");

      // Background DB delete
      const userId = user?.id;
      const currentSession = sessionId || (typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : "");
      fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userId: userId || undefined,
          sessionId: currentSession || undefined,
        }),
      }).catch((err) => console.warn("Wishlist remove DB error:", err));
    },
    [sessionId, user?.id]
  );

  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    toast.info("All saved frames cleared.");

    // Background DB clear
    const userId = user?.id;
    const currentSession = sessionId || (typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : "");
    fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clearAll: true,
        userId: userId || undefined,
        sessionId: currentSession || undefined,
      }),
    }).catch((err) => console.warn("Wishlist clear DB error:", err));
  }, [sessionId, user?.id]);

  const openWishlist = useCallback(() => setIsWishlistOpen(true), []);
  const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);
  const toggleWishlistDrawer = useCallback(() => setIsWishlistOpen((prev) => !prev), []);

  const wishlistProducts = useMemo(() => {
    return PRODUCTS.filter((p) => wishlistIds.includes(p.id));
  }, [wishlistIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        totalWishlist: wishlistIds.length,
        wishlistProducts,
        isWishlisted,
        isInWishlist: isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        isWishlistOpen,
        openWishlist,
        closeWishlist,
        toggleWishlistDrawer,
        sessionId,
        isSyncing,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
