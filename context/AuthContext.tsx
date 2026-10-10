"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Order, UserProfile, PrescriptionData, ShippingAddress, Appointment } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: UserProfile;
  isLoggedIn: boolean;
  isGuest: boolean;
  setGuestCheckout: (val: boolean) => void;
  loginWithPhone: (
    phone: string,
    profileOrName?: string | Partial<UserProfile>,
    ordersList?: Order[]
  ) => void;
  loginWithEmail: (email: string, name?: string) => void;
  login: (phone: string, name?: string) => void; // Backward-compatibility alias
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  saveShippingAddress: (address: ShippingAddress) => void;
  deleteSavedAddress: (index: number) => void;
  orders: Order[];
  gemPoints: number;
  addPoints: (amount: number) => void;
  redeemPoints: (amount: number) => boolean;
  saveOrder: (order: Order) => void;
  savePrescription: (title: string, data: PrescriptionData, doctorName?: string) => void;
  removePrescription: (id: string) => void;
  selectedTrackingOrder: Order | null;
  isTrackingModalOpen: boolean;
  openTrackingModal: (order?: Order) => void;
  closeTrackingModal: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (returnUrl?: string) => void;
  closeAuthModal: () => void;
  isLoginModalOpen: boolean; // Backward-compatibility alias
  openLoginModal: () => void; // Backward-compatibility alias
  closeLoginModal: () => void; // Backward-compatibility alias
  authReturnUrl: string | null;
  isAppointmentModalOpen: boolean;
  openAppointmentModal: () => void;
  closeAppointmentModal: () => void;
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  bookAppointment: (appointment: Appointment) => void;
}

const ORDERS_STORAGE_KEY = "shivam_optics_orders_v2";
const USER_STORAGE_KEY = "shivam_optics_user_v2";
const AUTH_STATUS_KEY = "shivam_optics_auth_status_v2";

const INITIAL_USER: UserProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
  role: "customer",
  joinedDate: "",
  gemPoints: 0,
  savedAddresses: [],
  savedPrescriptions: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Tracking Modal State
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Global Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReturnUrl, setAuthReturnUrl] = useState<string | null>(null);

  // Companion UI Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const openAuthModal = useCallback((returnUrl?: string) => {
    if (returnUrl) setAuthReturnUrl(returnUrl);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      }

      const savedAuth = localStorage.getItem(AUTH_STATUS_KEY);
      if (savedAuth !== null && savedUser) {
        setIsLoggedIn(savedAuth === "true");
      }

      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (e) {
      console.warn("Failed to load user auth data:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Synchronize state changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to save user data:", e);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(AUTH_STATUS_KEY, isLoggedIn ? "true" : "false");
    } catch (e) {
      console.warn("Failed to save auth status:", e);
    }
  }, [isLoggedIn, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("Failed to save orders:", e);
    }
  }, [orders, isLoaded]);

  const loginWithPhone = useCallback(
    (
      phone: string,
      profileOrName?: string | Partial<UserProfile>,
      ordersList?: Order[]
    ) => {
      setUser((prev) => {
        const extraProfile =
          typeof profileOrName === "object"
            ? profileOrName
            : typeof profileOrName === "string"
            ? { name: profileOrName }
            : {};

        return {
          ...prev,
          ...extraProfile,
          phone: phone.startsWith("+91") ? phone : `+91 ${phone}`,
          phoneVerified: true,
          name:
            extraProfile.name ||
            (typeof profileOrName === "string" ? profileOrName : "") ||
            prev.name ||
            "Valued Patron",
        };
      });

      if (ordersList && Array.isArray(ordersList)) {
        setOrders(ordersList);
      }

      setIsLoggedIn(true);
      setIsGuest(false);
      setIsAuthModalOpen(false);
      toast.success("Welcome back!", {
        description: `Signed in to Shivam Optics`,
      });
    },
    []
  );

  const loginWithEmail = useCallback((email: string, name?: string) => {
    setUser((prev) => ({
      ...prev,
      email,
      name: name || prev.name || "Shivam Patron",
    }));
    setIsLoggedIn(true);
    setIsGuest(false);
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback((phone: string, name?: string) => {
    loginWithPhone(phone, name);
  }, [loginWithPhone]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setIsGuest(false);
    setUser(INITIAL_USER);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.setItem(AUTH_STATUS_KEY, "false");
    } catch (e) {
      console.warn("Failed to clear auth storage:", e);
    }
    toast.info("Signed out of your account");
  }, []);

  const setGuestCheckout = useCallback((val: boolean) => {
    setIsGuest(val);
  }, []);

  const updateUserProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...data }));
  }, []);

  const saveShippingAddress = useCallback((address: ShippingAddress) => {
    setUser((prev) => {
      const filtered = prev.savedAddresses.filter(
        (a) =>
          a.streetAddress.toLowerCase() !== address.streetAddress.toLowerCase() ||
          a.pincode !== address.pincode
      );
      return {
        ...prev,
        savedAddresses: [address, ...filtered],
      };
    });
  }, []);

  const deleteSavedAddress = useCallback((index: number) => {
    setUser((prev) => ({
      ...prev,
      savedAddresses: prev.savedAddresses.filter((_, i) => i !== index),
    }));
  }, []);

  const addPoints = useCallback((amount: number) => {
    setUser((prev) => ({ ...prev, gemPoints: prev.gemPoints + amount }));
  }, []);

  const redeemPoints = useCallback(
    (amount: number): boolean => {
      if (user.gemPoints >= amount) {
        setUser((prev) => ({ ...prev, gemPoints: prev.gemPoints - amount }));
        return true;
      }
      return false;
    },
    [user.gemPoints]
  );

  const saveOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
    const earnedPoints = Math.round(order.totalAmount / 100);
    setUser((prev) => ({ ...prev, gemPoints: prev.gemPoints + earnedPoints }));
  }, []);

  const savePrescription = useCallback(
    (title: string, data: PrescriptionData, doctorName?: string) => {
      setUser((prev) => ({
        ...prev,
        savedPrescriptions: [
          ...prev.savedPrescriptions,
          {
            id: `rx-${Date.now()}`,
            title,
            date: new Date().toISOString().split("T")[0],
            doctorName: doctorName || "Shivam Optics Certified Optometrist",
            data,
          },
        ],
      }));
    },
    []
  );

  const removePrescription = useCallback((id: string) => {
    setUser((prev) => ({
      ...prev,
      savedPrescriptions: prev.savedPrescriptions.filter((p) => p.id !== id),
    }));
  }, []);

  const openTrackingModal = useCallback(
    (order?: Order) => {
      if (order) {
        setSelectedTrackingOrder(order);
      } else if (orders.length > 0) {
        setSelectedTrackingOrder(orders[0]);
      }
      setIsTrackingModalOpen(true);
    },
    [orders]
  );

  const closeTrackingModal = useCallback(() => {
    setIsTrackingModalOpen(false);
    setSelectedTrackingOrder(null);
  }, []);

  const bookAppointment = async (appointment: Appointment) => {
    try {
      await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
    } catch (e) {
      console.warn("Failed to sync appointment with admin", e);
    }
    toast.success("Eye Test Consultation Reserved!", {
      description: `${appointment.service} on ${appointment.date} at ${appointment.time}. Confirmation sent to ${appointment.phone}.`,
      duration: 6000,
    });
    setIsAppointmentModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isGuest,
        setGuestCheckout,
        loginWithPhone,
        loginWithEmail,
        login,
        logout,
        updateUserProfile,
        saveShippingAddress,
        deleteSavedAddress,
        orders,
        gemPoints: user.gemPoints,
        addPoints,
        redeemPoints,
        saveOrder,
        savePrescription,
        removePrescription,
        selectedTrackingOrder,
        isTrackingModalOpen,
        openTrackingModal,
        closeTrackingModal,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isLoginModalOpen: isAuthModalOpen,
        openLoginModal: () => setIsAuthModalOpen(true),
        closeLoginModal: () => setIsAuthModalOpen(false),
        authReturnUrl,
        isAppointmentModalOpen,
        openAppointmentModal: () => setIsAppointmentModalOpen(true),
        closeAppointmentModal: () => setIsAppointmentModalOpen(false),
        isSearchModalOpen,
        openSearchModal: () => setIsSearchModalOpen(true),
        closeSearchModal: () => setIsSearchModalOpen(false),
        bookAppointment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
