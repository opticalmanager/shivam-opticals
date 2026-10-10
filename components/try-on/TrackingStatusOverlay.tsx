"use client";

import React from "react";
import { AlertCircle, Focus, Sun, CheckCircle2 } from "lucide-react";
import { FaceQualityScore } from "@/types/tryOn";

interface TrackingStatusOverlayProps {
  quality: FaceQualityScore;
  isLoadingModel?: boolean;
}

export const TrackingStatusOverlay: React.FC<TrackingStatusOverlayProps> = ({
  quality,
  isLoadingModel = false,
}) => {
  if (isLoadingModel) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/65 backdrop-blur-md text-white border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-sans shadow-lg animate-pulse">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-[#C5A059] border-t-transparent animate-spin" />
        <span className="tracking-wide">Loading 3D Frame...</span>
      </div>
    );
  }

  // If tracking is high confidence and well-centered, keep view clean
  if (quality.state === "HIGH_CONFIDENCE") {
    return null;
  }

  const isWarning = quality.state === "LOW_CONFIDENCE" || quality.state === "LOST";

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 pointer-events-none">
      <div
        className={`backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-sans shadow-lg border transition-all ${
          isWarning
            ? "bg-stone-900/85 text-[#C5A059] border-[#C5A059]/40"
            : "bg-black/60 text-white/90 border-white/15"
        }`}
      >
        {quality.state === "LOST" ? (
          <Focus className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
        ) : !quality.isWithinRotationBounds ? (
          <AlertCircle className="w-3.5 h-3.5 text-[#C5A059]" />
        ) : !quality.isAdequatelyLit ? (
          <Sun className="w-3.5 h-3.5 text-[#C5A059]" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className="tracking-wide font-medium">
          {quality.message || "Align face with camera"}
        </span>
      </div>
    </div>
  );
};
