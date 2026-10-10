"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export type CheckoutStep = "login" | "address" | "payment" | "summary";

interface CheckoutBreadcrumbsProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  canNavigateTo: (step: CheckoutStep) => boolean;
}

export const CheckoutBreadcrumbs: React.FC<CheckoutBreadcrumbsProps> = ({
  currentStep,
  onStepClick,
  canNavigateTo,
}) => {
  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "login", label: "Identification" },
    { key: "address", label: "Shipping Address" },
    { key: "payment", label: "Payment & Verification" },
    { key: "summary", label: "Order Receipt" },
  ];

  return (
    <nav className="w-full py-3.5 border-b border-[#E8DEC8] bg-[#FAF7F2] select-none">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 sm:gap-3 text-xs sm:text-[13px] font-medium">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.key;
            const isClickable = canNavigateTo(step.key);

            return (
              <React.Fragment key={step.key}>
                <li className="flex items-center">
                  <button
                    type="button"
                    disabled={!isClickable || step.key === "summary"}
                    onClick={() => onStepClick && onStepClick(step.key)}
                    className={`transition-all cursor-pointer ${
                      isActive
                        ? "text-[#C5A059] font-bold border-b-2 border-[#C5A059] pb-0.5"
                        : isClickable
                        ? "text-[#716B64] hover:text-[#0A251C]"
                        : "text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    {step.label}
                  </button>
                </li>
                {idx < steps.length - 1 && (
                  <span className="text-neutral-400 text-xs select-none">
                    <ChevronRight className="w-3.5 h-3.5 inline text-neutral-400" />
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
