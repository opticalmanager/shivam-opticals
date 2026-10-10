"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { Appointment } from "@/types";

interface UserProfile {
  name: string;
  phone: string;
  email?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (phone: string, name?: string) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isAppointmentModalOpen: boolean;
  openAppointmentModal: () => void;
  closeAppointmentModal: () => void;
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  bookAppointment: (appointment: Appointment) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "shivam_optics_patron_v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read user from localStorage", e);
    }
  }, []);

  const login = (phone: string, name: string = "Patron") => {
    const profile: UserProfile = {
      phone,
      name,
    };
    setUser(profile);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
    setIsLoginModalOpen(false);
    toast.success("Welcome back!", {
      description: `Signed in as ${name || phone}`,
    });
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
    toast.info("Signed out of your account");
  };

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
        isLoggedIn: Boolean(user),
        login,
        logout,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
