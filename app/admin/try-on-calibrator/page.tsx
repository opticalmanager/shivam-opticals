"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  ArrowLeft,
  Save,
  RotateCcw,
  Sliders,
  Check,
  Copy,
  Layers,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { FrameCalibration } from "@/types/tryOn";
import { CameraManager } from "@/lib/try-on/camera/CameraManager";
import { FaceLandmarkerService } from "@/lib/try-on/vision/FaceLandmarkerService";
import { FacePoseEstimator } from "@/lib/try-on/vision/FacePoseEstimator";
import { ThreeRenderer } from "@/lib/try-on/rendering/ThreeRenderer";
import { applyCalibration } from "@/lib/try-on/calibration/FrameCalibration";
import { CalibrationStore } from "@/lib/try-on/calibration/CalibrationStore";
import { resolveProductTryOnConfig, hasTryOnModel } from "@/lib/try-on/products/TryOnProductConfig";
import { getCatalogProducts } from "@/lib/productsService";

function AdminTryOnCalibratorContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product");

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOccluder, setShowOccluder] = useState(false);

  // Calibration state
  const [calibration, setCalibration] = useState<FrameCalibration>(() => {
    const cfg = resolveProductTryOnConfig(PRODUCTS[0]);
    return CalibrationStore.getCalibration(PRODUCTS[0].id, cfg);
  });
  const calibrationRef = useRef(calibration);
  calibrationRef.current = calibration;

  // Hydrate all products from catalog (including newly added DB products)
  useEffect(() => {
    getCatalogProducts(true).then((catalog) => {
      if (catalog && catalog.length > 0) {
        setProducts(catalog);
        if (initialProductId) {
          const match = catalog.find(
            (p) =>
              p.id === initialProductId ||
              p.id.toLowerCase() === initialProductId.toLowerCase() ||
              p.name.toLowerCase().includes(initialProductId.toLowerCase())
          );
          if (match) {
            setSelectedProduct(match);
            const cfg = resolveProductTryOnConfig(match);
            const saved = CalibrationStore.getCalibration(match.id, cfg);
            setCalibration(saved);
            if (rendererRef.current) {
              rendererRef.current.eyewear.loadModel(cfg.modelUrl);
            }
          }
        }
      }
    });
  }, [initialProductId]);

  // DOM Refs
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine Refs
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // When selected product changes, load its calibration
  const handleProductChange = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId) || products[0];
    setSelectedProduct(prod);

    const cfg = resolveProductTryOnConfig(prod);
    const saved = CalibrationStore.getCalibration(prod.id, cfg);
    setCalibration(saved);

    if (rendererRef.current) {
      rendererRef.current.eyewear.loadModel(cfg.modelUrl);
    }
  };

  /**
   * Render & Vision Loop
   */
  const runCalibratorLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;

    if (!video || !canvas || !renderer) {
      animFrameRef.current = requestAnimationFrame(runCalibratorLoop);
      return;
    }

    const now = performance.now();

    try {
      if (video.readyState >= 2) {
        const landmarker = FaceLandmarkerService.getInstance();
        const results = landmarker.detect(video, now);

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
          const primaryFace = results.faceLandmarks[0];
          const matrixData = results.facialTransformationMatrixes?.[0];

          const rawPose = FacePoseEstimator.estimate(
            primaryFace,
            matrixData,
            renderer.getCoordinateMapper()
          );

          if (rawPose) {
            // Apply current active calibration
            const calibrated = applyCalibration(rawPose, calibrationRef.current);

            renderer.eyewear.updateTransformQuaternion(calibrated.position, calibrated.quaternion, calibrated.scale);
            renderer.occlusion.updatePoseQuaternion(calibrated.position, calibrated.quaternion, calibrated.scale);
            renderer.eyewear.setOpacity(1.0);
          }
        }
      }
    } catch (err) {
      console.warn("Calibrator vision error:", err);
    } finally {
      renderer.render();
      animFrameRef.current = requestAnimationFrame(runCalibratorLoop);
    }
  }, []);

  /**
   * Start Camera & WebGL
   */
  const startCamera = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!video || !canvas || !stage) return;

    await FaceLandmarkerService.getInstance().initialize();

    const success = await cameraManagerRef.current.start(video);
    if (!success) {
      toast.error("Failed to start camera. Please verify permissions.");
      return;
    }

    setIsCameraActive(true);

    const stageRect = stage.getBoundingClientRect();
    const videoDims = cameraManagerRef.current.getVideoDimensions();

    if (!rendererRef.current) {
      rendererRef.current = new ThreeRenderer({
        canvas,
        containerWidth: stageRect.width,
        containerHeight: stageRect.height,
        videoWidth: videoDims.width,
        videoHeight: videoDims.height,
        mirrored: true,
      });
    }

    const cfg = resolveProductTryOnConfig(selectedProduct);
    await rendererRef.current.eyewear.loadModel(cfg.modelUrl);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(runCalibratorLoop);
  };

  useEffect(() => {
    startCamera();

    const handleResize = () => {
      if (stageRef.current && rendererRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const dims = cameraManagerRef.current.getVideoDimensions();
        rendererRef.current.resize(rect.width, rect.height, dims.width, dims.height);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      cameraManagerRef.current.stop();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const handleSave = async () => {
    CalibrationStore.saveCalibration(selectedProduct.id, calibration);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedProduct.name,
          basePrice: (selectedProduct as any).base_price || selectedProduct.price,
          tryOnConfiguration: calibration,
          tryOnEnabled: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Calibration saved to database for ${selectedProduct.name}`);
        return;
      }
    } catch (e) {
      console.warn("Could not persist to database:", e);
    }
    toast.success(`Calibration saved for ${selectedProduct.name}`);
  };

  const handleReset = () => {
    CalibrationStore.resetCalibration(selectedProduct.id);
    const cfg = resolveProductTryOnConfig(selectedProduct);
    setCalibration(cfg);
    toast.info("Reset to factory defaults");
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(calibration, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Calibration JSON copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#0A251C] flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0A251C] text-white px-6 py-4 flex items-center justify-between border-b border-[#C5A059]/20 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="text-stone-300 hover:text-white flex items-center gap-1.5 text-xs font-sans transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Products</span>
          </Link>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#C5A059]" />
            <h1 className="font-serif text-sm font-bold uppercase tracking-widest text-[#C5A059]">
              3D Eyewear Frame Calibrator Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="text-white border-stone-600 bg-white/10 hover:bg-white/20 text-xs h-8 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1 text-[#C5A059]" />}
            <span>Copy JSON</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            className="bg-[#C5A059] hover:bg-[#b59049] text-white text-xs h-8 cursor-pointer font-semibold shadow-md"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>Save Calibration</span>
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stage Left */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Product Selector */}
          <div className="bg-white border border-[#E8DCCF] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Select Eyewear Product
              </label>
              <select
                value={selectedProduct.id}
                onChange={(e) => handleProductChange(e.target.value)}
                className="bg-[#FAF7F2] border border-[#E8DCCF] rounded-lg px-3 py-2 text-xs font-semibold text-[#0A251C] focus:outline-none focus:ring-1 focus:ring-[#C5A059] min-w-[280px] cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand ? `${p.brand} - ` : ""}
                    {p.name} {hasTryOnModel(p) ? "(3D Model Ready)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = !showOccluder;
                  setShowOccluder(next);
                  rendererRef.current?.occlusion.setDebug(next);
                }}
                className={`h-8 text-xs cursor-pointer ${showOccluder ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "border-[#E8DCCF] text-stone-700 bg-white"}`}
              >
                <Layers className="w-3.5 h-3.5 mr-1 text-[#C5A059]" />
                <span>{showOccluder ? "Hide Occluder" : "Show Occluder"}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs border-[#E8DCCF] text-stone-600 hover:text-[#0A251C] bg-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          {/* Camera & WebGL Stage */}
          <div
            ref={stageRef}
            className="w-full bg-black rounded-2xl overflow-hidden relative shadow-inner min-h-[460px] sm:min-h-[540px] flex items-center justify-center"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {!isCameraActive && (
              <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center text-white p-6 text-center z-20">
                <Camera className="w-10 h-10 text-[#C5A059] mb-3 animate-pulse" />
                <span className="text-sm font-bold tracking-wide">Starting Camera Stream...</span>
                <span className="text-xs text-stone-400 mt-1">Please allow camera permissions if prompted.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sliders Panel Right */}
        <div className="lg:col-span-4 bg-white border border-[#E8DCCF] rounded-2xl p-5 space-y-6 shadow-xs overflow-y-auto max-h-[85vh]">
          <div>
            <span className="font-serif text-xs font-bold text-[#C5A059] tracking-widest uppercase block">
              Live Frame Calibration
            </span>
            <h2 className="font-serif text-lg font-bold text-[#0A251C] mt-0.5">
              Precision Optical Offsets
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Adjust position and scale to seat the frame realistically on facial landmarks.
            </p>
          </div>

          {/* Scale Multiplier */}
          <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCCF]">
            <div className="flex justify-between text-xs font-semibold">
              <span>Scale Multiplier</span>
              <span className="font-mono text-[#C5A059]">{calibration.scaleMultiplier.toFixed(3)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.35"
              step="0.005"
              value={calibration.scaleMultiplier}
              onChange={(e) =>
                setCalibration((prev) => ({ ...prev, scaleMultiplier: parseFloat(e.target.value) }))
              }
              className="w-full accent-[#C5A059] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>0.75x</span>
              <span>1.00x</span>
              <span>1.35x</span>
            </div>
          </div>

          {/* Position (Y, Z, X) */}
          <div className="space-y-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCCF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A251C] block">
              Translation Offsets (Meters)
            </span>

            {/* Vertical (Y) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600">Nose Bridge Height (Y):</span>
                <span className="font-mono text-[#C5A059]">{(calibration.verticalOffset * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="-0.04"
                max="0.04"
                step="0.002"
                value={calibration.verticalOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, verticalOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>

            {/* Depth (Z) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600">Eye-to-Lens Depth (Z):</span>
                <span className="font-mono text-[#C5A059]">{(calibration.depthOffset * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="-0.02"
                max="0.05"
                step="0.002"
                value={calibration.depthOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, depthOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>

            {/* Horizontal (X) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600">Horizontal Shift (X):</span>
                <span className="font-mono text-[#C5A059]">
                  {((calibration.horizontalOffset || 0) * 100).toFixed(1)} cm
                </span>
              </div>
              <input
                type="range"
                min="-0.03"
                max="0.03"
                step="0.002"
                value={calibration.horizontalOffset || 0}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, horizontalOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>
          </div>

          {/* Rotations (Pitch, Yaw, Roll) */}
          <div className="space-y-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCCF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A251C] block">
              Angular Offsets (Degrees)
            </span>

            {/* Pantoscopic Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600">Pantoscopic Tilt (Pitch):</span>
                <span className="font-mono text-[#C5A059]">
                  {((calibration.pitchOffset * 180) / Math.PI).toFixed(1)}°
                </span>
              </div>
              <input
                type="range"
                min="-0.2"
                max="0.2"
                step="0.01"
                value={calibration.pitchOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, pitchOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>

            {/* Wrap Yaw */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600">Face-Form Angle (Yaw):</span>
                <span className="font-mono text-[#C5A059]">
                  {((calibration.yawOffset * 180) / Math.PI).toFixed(1)}°
                </span>
              </div>
              <input
                type="range"
                min="-0.15"
                max="0.15"
                step="0.01"
                value={calibration.yawOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, yawOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>

            {/* Roll */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-stone-600">Frame Level (Roll):</span>
                <span className="font-mono text-[#C5A059]">
                  {((calibration.rollOffset * 180) / Math.PI).toFixed(1)}°
                </span>
              </div>
              <input
                type="range"
                min="-0.1"
                max="0.1"
                step="0.01"
                value={calibration.rollOffset}
                onChange={(e) =>
                  setCalibration((prev) => ({ ...prev, rollOffset: parseFloat(e.target.value) }))
                }
                className="w-full accent-[#C5A059] cursor-pointer"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            className="w-full py-3 text-xs uppercase font-bold tracking-wider bg-[#0A251C] hover:bg-[#143e30] text-white cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4 text-[#C5A059] mr-2" />
            <span>SAVE CALIBRATION FOR THIS MODEL</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTryOnCalibratorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="flex items-center gap-2 text-stone-600 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
            <span>Loading Calibration Studio...</span>
          </div>
        </div>
      }
    >
      <AdminTryOnCalibratorContent />
    </Suspense>
  );
}
