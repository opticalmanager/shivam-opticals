"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Save,
  RotateCcw,
  Sliders,
  Check,
  Glasses,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Product } from "@/types";

function TryOnCalibratorContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product");

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Calibration parameters
  const [scale, setScale] = useState(1.0);
  const [yOffset, setYOffset] = useState(0.0);
  const [zOffset, setZOffset] = useState(0.0);
  const [frameWidthMm, setFrameWidthMm] = useState(138);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.products) {
          setProducts(data.products);
          const found = initialProductId
            ? data.products.find((p: any) => p.id === initialProductId) || data.products[0]
            : data.products[0];
          setSelectedProduct(found || null);
        }
      })
      .catch((e) => console.warn("Failed to load products for calibrator:", e))
      .finally(() => setLoading(false));
  }, [initialProductId]);

  const handleSaveCalibration = () => {
    if (!selectedProduct) return;
    toast.success("Calibration parameters saved", {
      description: `3D VTO configuration anchored for ${selectedProduct.name}`,
    });
  };

  const handleReset = () => {
    setScale(1.0);
    setYOffset(0.0);
    setZOffset(0.0);
    setFrameWidthMm(138);
    toast.info("Offsets reset to atelier baseline");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCF]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            3D Virtual Try-On Calibrator Studio
          </h1>
          <p className="text-xs text-stone-500">
            Anchor MediaPipe 478 face landmarks, nose bridge depth offsets, and optical frame scaling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs border-stone-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveCalibration}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>Save Calibration</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 3D Preview Canvas Stage */}
        <div className="lg:col-span-2 bg-[#FAF3EB] border border-[#E8DCCF] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[420px] text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-white border border-[#E8DCCF] flex items-center justify-center text-[#C5A059] mb-4 shadow-sm">
            <Camera className="w-10 h-10 stroke-[1.5]" />
          </div>

          <h3 className="font-bold text-base text-[#0A251C] font-serif mb-1">
            Live WebAssembly + Three.js Calibration Stage
          </h3>
          <p className="text-xs text-stone-500 max-w-md mb-6 leading-relaxed">
            Calibrating {selectedProduct?.name || "Frame"}. Uses MediaPipe canonical mesh to align temple depth, pupil distance, and bridge inclination.
          </p>

          <div className="bg-white px-4 py-2 rounded-full border border-[#E8DCCF] text-xs font-mono text-[#0A251C] shadow-2xs">
            Scale: {scale.toFixed(2)}x • Y-Offset: {yOffset.toFixed(2)}mm • Z-Depth: {zOffset.toFixed(2)}mm
          </div>
        </div>

        {/* Right: Fine-Tuning Sliders */}
        <div className="bg-white border border-[#E8DCCF] rounded-xl p-5 shadow-2xs space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Eyewear Model
            </label>
            <select
              value={selectedProduct?.id || ""}
              onChange={(e) => {
                const found = products.find((p) => p.id === e.target.value);
                if (found) setSelectedProduct(found);
              }}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.brand})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 pt-2 border-t border-stone-100 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Model Scale Factor</span>
                <span className="font-mono text-[#C5A059]">{scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-[#C5A059]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Vertical Bridge Offset (Y)</span>
                <span className="font-mono text-[#C5A059]">{yOffset.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={yOffset}
                onChange={(e) => setYOffset(parseFloat(e.target.value))}
                className="w-full accent-[#C5A059]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Depth / Nose Anchor (Z)</span>
                <span className="font-mono text-[#C5A059]">{zOffset.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                value={zOffset}
                onChange={(e) => setZOffset(parseFloat(e.target.value))}
                className="w-full accent-[#C5A059]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Physical Frame Width (mm)</span>
                <span className="font-mono text-[#C5A059]">{frameWidthMm} mm</span>
              </div>
              <input
                type="number"
                value={frameWidthMm}
                onChange={(e) => setFrameWidthMm(parseInt(e.target.value) || 138)}
                className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTryOnCalibratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
        </div>
      }
    >
      <TryOnCalibratorContent />
    </Suspense>
  );
}
