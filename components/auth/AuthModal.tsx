"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthForm } from "./AuthForm";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  returnUrl?: string | null;
  initialMode?: "signin" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSuccess,
  returnUrl: propReturnUrl,
}) => {
  const { isAuthModalOpen, closeAuthModal, authReturnUrl } = useAuth();

  const isModalVisible = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const handleClose = propOnClose || closeAuthModal;
  const targetReturnUrl = propReturnUrl || authReturnUrl;

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalVisible) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalVisible, handleClose]);

  if (!isModalVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Luxury Modal Container */}
      <div className="relative w-full max-w-md bg-[#FCFAF7] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-[#FAF3EB] text-stone-500 hover:text-[#0A251C] flex items-center justify-center transition-colors cursor-pointer shadow-2xs z-20"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Auth Flow Component */}
        <AuthForm
          onSuccess={() => {
            handleClose();
            if (onSuccess) onSuccess();
          }}
          returnUrl={targetReturnUrl}
          mode="modal"
        />
      </div>
    </div>
  );
};
