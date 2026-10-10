"use client";

import React, { useState } from "react";
import { Activity, Layers, Sliders } from "lucide-react";
import { DiagnosticMetrics } from "@/types/tryOn";

interface DevDiagnosticsOverlayProps {
  metrics: DiagnosticMetrics;
  onToggleOcclusionDebug?: (show: boolean) => void;
  onToggleSmoothing?: (enabled: boolean) => void;
}

export const DevDiagnosticsOverlay: React.FC<DevDiagnosticsOverlayProps> = ({
  metrics,
  onToggleOcclusionDebug,
  onToggleSmoothing,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOcclusion, setShowOcclusion] = useState(false);
  const [smoothingEnabled, setSmoothingEnabled] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-16 z-20 bg-black/60 hover:bg-black/80 text-stone-300 hover:text-white p-1.5 rounded-md backdrop-blur-md text-[10px] font-mono flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
        title="Open Developer Diagnostics"
      >
        <Activity className="w-3.5 h-3.5 text-[#C5A059]" />
        <span>{metrics.renderFps} FPS</span>
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-30 w-72 bg-black/90 text-stone-200 border border-white/20 rounded-xl p-3.5 font-mono text-[11px] shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <span className="text-[#C5A059] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          AR Diagnostics HUD
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-stone-400 hover:text-white text-xs px-1 cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="space-y-1.5 text-[10.5px]">
        <div className="flex justify-between">
          <span className="text-stone-400">Render FPS:</span>
          <span className={metrics.renderFps < 30 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
            {metrics.renderFps} FPS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-stone-400">Vision Tracker:</span>
          <span className="text-stone-200">{metrics.trackingFps} Hz</span>
        </div>

        <div className="flex justify-between">
          <span className="text-stone-400">Tracking Latency:</span>
          <span className="text-stone-200">{metrics.trackingLatencyMs.toFixed(1)} ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-stone-400">Confidence:</span>
          <span className="text-stone-200">{(metrics.confidence * 100).toFixed(0)}%</span>
        </div>

        <div className="border-t border-white/10 my-1 pt-1 space-y-1">
          {metrics.metricDepthM !== undefined && (
            <div className="flex justify-between">
              <span className="text-stone-400">Metric Depth (Z):</span>
              <span className="text-[#C5A059] font-semibold">{(metrics.metricDepthM * 100).toFixed(1)} cm</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-400">Pitch (nod):</span>
            <span>{metrics.facePitchDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Yaw (turn):</span>
            <span>{metrics.faceYawDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Roll (tilt):</span>
            <span>{metrics.faceRollDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Scale factor:</span>
            <span>{metrics.appliedScale.toFixed(3)}x</span>
          </div>
          {metrics.normalizedWidthMm !== undefined && (
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">Physical Frame:</span>
              <span>{metrics.normalizedWidthMm.toFixed(0)} mm</span>
            </div>
          )}
          {metrics.rawWidthMm !== undefined && (
            <div className="flex justify-between text-stone-400 text-[9.5px]">
              <span>Raw GLB Width:</span>
              <span>{metrics.rawWidthMm.toFixed(1)} mm</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 my-1 pt-1 space-y-1 text-[10px] text-stone-400">
          <div>Camera: {metrics.videoWidth}x{metrics.videoHeight}</div>
          <div>Canvas: {metrics.canvasWidth}x{metrics.canvasHeight}</div>
        </div>

        <div className="border-t border-white/10 my-1 pt-2 flex gap-2">
          <button
            onClick={() => {
              const next = !showOcclusion;
              setShowOcclusion(next);
              onToggleOcclusionDebug?.(next);
            }}
            className={`flex-1 py-1 rounded text-[10px] font-sans font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              showOcclusion
                ? "bg-cyan-600/30 text-cyan-300 border-cyan-500"
                : "bg-white/5 text-stone-300 border-white/10"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Occluder</span>
          </button>

          <button
            onClick={() => {
              const next = !smoothingEnabled;
              setSmoothingEnabled(next);
              onToggleSmoothing?.(next);
            }}
            className={`flex-1 py-1 rounded text-[10px] font-sans font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              smoothingEnabled
                ? "bg-emerald-600/30 text-emerald-300 border-emerald-500"
                : "bg-white/5 text-stone-300 border-white/10"
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Smoothing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
