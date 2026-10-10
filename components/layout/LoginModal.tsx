"use client";

import React from "react";
import { AuthModal } from "@/components/auth/AuthModal";

/**
 * LoginModal proxy for backward compatibility.
 * Seamlessly routes all login modal interactions to the verified AuthModal.
 */
export const LoginModal: React.FC = () => {
  return <AuthModal />;
};
