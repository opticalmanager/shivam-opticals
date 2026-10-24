"use client";

import React from "react";
import { Camera, ShieldCheck, AlertCircle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraErrorInfo } from "@/types/tryOn";

interface CameraPermissionUIProps {
  errorInfo?: CameraErrorInfo | null;
  onRetry: () => void;
  onClose: () => void;
}

export const CameraPermissionUI: React.FC<CameraPermissionUIProps> = ({
  errorInfo,
  onRetry,
  onClose,
}) => {
  const isError = Boolean(errorInfo);

  return (
    <div className="absolute inset-0 z-20 bg-[#FAF7F2]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-[#0A251C] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full bg-[#FAF3EB] border border-[#E8DEC8] flex items-center justify-center mx-auto mb-5">
          {isError ? (
            <AlertCircle className="w-7 h-7 text-[#C5A059]" />
          ) : (
            <Camera className="w-7 h-7 text-[#C5A059]" />
          )}
        </div>

        <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0A251C] tracking-wide mb-2 uppercase">
          {isError ? "Camera Access Needed" : "Enable Live 3D Try-On"}
        </h3>

        <p className="font-sans text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
          {isError
            ? errorInfo?.message || "Please allow camera access to try on luxury frames in real-time."
            : "Shivam Optical uses your device camera to accurately place 3D frames on your face in real time."}
        </p>

        {isError && errorInfo?.instructions && errorInfo.instructions.length > 0 && (
          <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl p-4 mb-6 text-left space-y-2">
            <span className="font-sans text-[11px] font-bold tracking-wider uppercase text-[#0A251C] block mb-1">
              How to enable:
            </span>
            {errorInfo.instructions.map((inst, idx) => (
              <div key={idx} className="flex items-start gap-2 text-stone-700 text-xs font-sans">
                <span className="text-[#C5A059] font-bold text-xs shrink-0">{idx + 1}.</span>
                <span>{inst}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="button"
            variant="default"
            onClick={onRetry}
            className="w-full py-3 text-xs uppercase tracking-widest font-semibold bg-[#0A251C] hover:bg-black text-[#C5A059] flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RotateCcw className="w-4 h-4 text-[#C5A059]" />
            <span>{isError ? "Try Again" : "Allow Camera & Start"}</span>
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-sans pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your video stream stays strictly on your device.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
