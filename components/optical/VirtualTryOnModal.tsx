"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  ShoppingBag,
  Glasses,
  Maximize2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// Try-On Engine Modules
import { CameraManager } from "@/lib/try-on/camera/CameraManager";
import { FaceLandmarkerService } from "@/lib/try-on/vision/FaceLandmarkerService";
import { FacePoseEstimator } from "@/lib/try-on/vision/FacePoseEstimator";
import { FaceQualityAssessor } from "@/lib/try-on/vision/FaceQualityAssessor";
import { SmoothingEngine } from "@/lib/try-on/tracking/SmoothingEngine";
import { LostTrackingHandler } from "@/lib/try-on/tracking/LostTrackingHandler";
import { ThreeRenderer } from "@/lib/try-on/rendering/ThreeRenderer";
import { applyCalibration } from "@/lib/try-on/calibration/FrameCalibration";
import { CalibrationStore } from "@/lib/try-on/calibration/CalibrationStore";
import { resolveProductTryOnConfig, hasTryOnModel } from "@/lib/try-on/products/TryOnProductConfig";
import { TryOnAnalytics } from "@/lib/try-on/analytics/TryOnAnalytics";
import {
  FaceQualityScore,
  DiagnosticMetrics,
  CameraErrorInfo,
  FacePose,
} from "@/types/tryOn";

// UI Overlays
import { CameraPermissionUI } from "@/components/try-on/CameraPermissionUI";
import { TrackingStatusOverlay } from "@/components/try-on/TrackingStatusOverlay";
import { DevDiagnosticsOverlay } from "@/components/try-on/DevDiagnosticsOverlay";
import { FrameSelectorBar } from "@/components/try-on/FrameSelectorBar";
import { PhotoCaptureModal } from "@/components/try-on/PhotoCaptureModal";

interface VirtualTryOnModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  allProducts?: Product[];
  onOpenLensCustomizer?: (product: Product) => void;
}

export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  product: initialProduct,
  onClose,
  onAddToCart,
  allProducts = [],
  onOpenLensCustomizer,
}) => {
  const [activeProduct, setActiveProduct] = useState<Product>(initialProduct);
  const [cameraState, setCameraState] = useState<"requesting" | "active" | "error">("requesting");
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  const initialDiagnostics: DiagnosticMetrics = {
    renderFps: 0,
    trackingFps: 0,
    trackingLatencyMs: 0,
    confidence: 0,
    facePitchDeg: 0,
    faceYawDeg: 0,
    faceRollDeg: 0,
    appliedScale: 1.0,
    videoWidth: 1280,
    videoHeight: 720,
    canvasWidth: 800,
    canvasHeight: 600,
  };

  const initialQuality: FaceQualityScore = {
    overallConfidence: 0,
    state: "LOST",
    isCentered: false,
    isAdequatelyLit: false,
    isWithinRotationBounds: false,
    message: "Starting camera...",
  };

  // Quality & Diagnostics State
  const [qualityScore, setQualityScore] = useState<FaceQualityScore>(initialQuality);
  const [diagnostics, setDiagnostics] = useState<DiagnosticMetrics>(initialDiagnostics);

  // Real-time telemetry refs
  const latestQualityRef = useRef<FaceQualityScore>(initialQuality);
  const latestDiagnosticsRef = useRef<DiagnosticMetrics>(initialDiagnostics);

  // DOM Refs
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine Instances
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const smoothingRef = useRef<SmoothingEngine>(new SmoothingEngine());
  const lostHandlerRef = useRef<LostTrackingHandler>(new LostTrackingHandler(350));
  const animFrameIdRef = useRef<number | null>(null);

  // FPS & Telemetry Tracking
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(performance.now());
  const lastTrackingTimeRef = useRef<number>(performance.now());
  const trackingCountRef = useRef<number>(0);

  // Settings
  const smoothingEnabledRef = useRef<boolean>(true);

  // Active try-on configuration
  const currentConfig = resolveProductTryOnConfig(activeProduct);
  const activeCalibration = CalibrationStore.getCalibration(activeProduct.id, currentConfig);
  const activeCalibrationRef = useRef(activeCalibration);
  activeCalibrationRef.current = activeCalibration;

  // Throttled UI telemetry sync
  useEffect(() => {
    const syncInterval = setInterval(() => {
      setQualityScore((prev) => {
        const next = latestQualityRef.current;
        if (
          prev.state !== next.state ||
          prev.message !== next.message ||
          Math.abs(prev.overallConfidence - next.overallConfidence) > 0.05
        ) {
          return { ...next };
        }
        return prev;
      });

      setDiagnostics({ ...latestDiagnosticsRef.current });
    }, 200);

    return () => clearInterval(syncInterval);
  }, []);

  /**
   * Initializes or hot-swaps the 3D model
   */
  const loadProductModel = useCallback(
    async (prod: Product) => {
      if (!rendererRef.current) return;
      setIsLoadingModel(true);

      const config = resolveProductTryOnConfig(prod);
      const success = await rendererRef.current.eyewear.loadModel(config.modelUrl);

      if (success) {
        const inspection = rendererRef.current.eyewear.getInspectionData();
        if (inspection) {
          latestDiagnosticsRef.current.rawWidthMm = inspection.rawWidthMm;
          latestDiagnosticsRef.current.normalizedWidthMm = inspection.normalizedWidthMm;
          latestDiagnosticsRef.current.autoScaleFactor = inspection.autoScaleFactor;
        }
      }

      setIsLoadingModel(false);
      TryOnAnalytics.track("vto_frame_switched", {
        productId: prod.id,
        brand: prod.brand,
        modelUrl: config.modelUrl,
        success,
      });
    },
    []
  );

  /**
   * Main Render & Vision Loop
   */
  const runRenderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;

    if (!video || !canvas || !renderer) {
      animFrameIdRef.current = requestAnimationFrame(runRenderLoop);
      return;
    }

    const now = performance.now();

    // 1. Calculate Render FPS
    frameCountRef.current++;
    if (now - fpsTimeRef.current >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / (now - fpsTimeRef.current));
      const currentTrackingFps = Math.round((trackingCountRef.current * 1000) / (now - fpsTimeRef.current));

      latestDiagnosticsRef.current.renderFps = currentFps;
      latestDiagnosticsRef.current.trackingFps = currentTrackingFps;
      latestDiagnosticsRef.current.canvasWidth = canvas.clientWidth;
      latestDiagnosticsRef.current.canvasHeight = canvas.clientHeight;
      latestDiagnosticsRef.current.videoWidth = video.videoWidth || 1280;
      latestDiagnosticsRef.current.videoHeight = video.videoHeight || 720;

      frameCountRef.current = 0;
      trackingCountRef.current = 0;
      fpsTimeRef.current = now;
    }

    // 2. Vision Detection Step
    try {
      if (video.readyState >= 2) {
        lastTrackingTimeRef.current = now;
        trackingCountRef.current++;

        const landmarkerService = FaceLandmarkerService.getInstance();
        const trackStart = performance.now();
        const detectionResult = landmarkerService.detect(video, now);
        const trackLatency = performance.now() - trackStart;

        if (detectionResult && detectionResult.faceLandmarks && detectionResult.faceLandmarks.length > 0) {
          const primaryFace = detectionResult.faceLandmarks[0];
          const matrixData = detectionResult.facialTransformationMatrixes?.[0];

          // Estimate 3D face pose
          const rawPose = FacePoseEstimator.estimate(
            primaryFace,
            matrixData,
            renderer.getCoordinateMapper()
          );

          if (rawPose) {
            // Assess quality
            const quality = FaceQualityAssessor.assess(
              primaryFace,
              rawPose.rotation.pitch,
              rawPose.rotation.yaw,
              rawPose.rotation.roll
            );
            latestQualityRef.current = quality;

            // Apply smoothing
            let processedPose: FacePose = rawPose;
            if (smoothingEnabledRef.current) {
              processedPose = smoothingRef.current.filter(rawPose, now, quality.state);
            }

            lostHandlerRef.current.onPoseDetected(processedPose);

            // Apply optical calibration
            const calibrated = applyCalibration(processedPose, activeCalibrationRef.current);

            // Update transforms
            renderer.eyewear.updateTransformQuaternion(calibrated.position, calibrated.quaternion, calibrated.scale);
            renderer.occlusion.updatePoseQuaternion(calibrated.position, calibrated.quaternion, calibrated.scale);
            renderer.eyewear.setOpacity(1.0);

            latestDiagnosticsRef.current.trackingLatencyMs = trackLatency;
            latestDiagnosticsRef.current.confidence = quality.overallConfidence;
            latestDiagnosticsRef.current.facePitchDeg = (calibrated.rotation.pitch * 180) / Math.PI;
            latestDiagnosticsRef.current.faceYawDeg = (calibrated.rotation.yaw * 180) / Math.PI;
            latestDiagnosticsRef.current.faceRollDeg = (calibrated.rotation.roll * 180) / Math.PI;
            latestDiagnosticsRef.current.appliedScale = calibrated.scale;
            latestDiagnosticsRef.current.metricDepthM = Math.abs(calibrated.position.z);
          }
        } else {
          // Tracking lost
          lostHandlerRef.current.onPoseLost(now);
          const opacity = lostHandlerRef.current.getVisibilityOpacity(now);
          renderer.eyewear.setOpacity(opacity);

          latestQualityRef.current = {
            overallConfidence: 0,
            state: "LOST",
            isCentered: false,
            isAdequatelyLit: false,
            isWithinRotationBounds: false,
            message: "Position your face in the frame",
          };
        }
      }
    } catch (err) {
      console.warn("VirtualTryOnModal vision frame error:", err);
    } finally {
      renderer.render();
      animFrameIdRef.current = requestAnimationFrame(runRenderLoop);
    }
  }, []);

  /**
   * Start camera and initialize Three.js
   */
  const startTryOn = useCallback(async () => {
    setCameraState("requesting");
    setCameraError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!video || !canvas || !stage) return;

    // 1. Initialize MediaPipe Face Landmarker
    await FaceLandmarkerService.getInstance().initialize();

    // 2. Start Camera
    const success = await cameraManagerRef.current.start(video, (err) => {
      setCameraState("error");
      setCameraError(err);
      TryOnAnalytics.track("vto_permission_denied", { error: err.type });
    });

    if (!success) return;

    setCameraState("active");
    TryOnAnalytics.track("vto_permission_granted", { productId: activeProduct.id });

    // 3. Initialize ThreeRenderer
    const stageRect = stage.getBoundingClientRect();
    const containerW = stageRect.width || 800;
    const containerH = stageRect.height || 500;
    const videoDims = cameraManagerRef.current.getVideoDimensions();

    if (!rendererRef.current) {
      rendererRef.current = new ThreeRenderer({
        canvas,
        containerWidth: containerW,
        containerHeight: containerH,
        videoWidth: videoDims.width,
        videoHeight: videoDims.height,
        mirrored: true,
      });
    } else {
      rendererRef.current.resize(containerW, containerH, videoDims.width, videoDims.height);
    }

    // 4. Load initial model
    await loadProductModel(activeProduct);

    // 5. Start Render loop
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    animFrameIdRef.current = requestAnimationFrame(runRenderLoop);
  }, [activeProduct, loadProductModel, runRenderLoop]);

  // Launch on mount
  useEffect(() => {
    startTryOn();
    TryOnAnalytics.track("vto_opened", { productId: initialProduct.id, brand: initialProduct.brand });

    const handleResize = () => {
      if (stageRef.current && rendererRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const videoDims = cameraManagerRef.current.getVideoDimensions();
        rendererRef.current.resize(rect.width, rect.height, videoDims.width, videoDims.height);
      }
    };

    window.addEventListener("resize", handleResize);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      } else {
        if (!animFrameIdRef.current && cameraState === "active") {
          animFrameIdRef.current = requestAnimationFrame(runRenderLoop);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }

      cameraManagerRef.current.stop();

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      TryOnAnalytics.track("vto_closed", { productId: activeProduct.id });
    };
  }, []);

  const handleSelectProduct = (prod: Product) => {
    setActiveProduct(prod);
    loadProductModel(prod);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = canvas.width;
    snapCanvas.height = canvas.height;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.translate(snapCanvas.width, 0);
    ctx.scale(-1, 1);

    if (rendererRef.current) {
      const coordMapper = rendererRef.current.getCoordinateMapper();
      const dims = coordMapper.getDisplayedDimensions();
      const offsets = coordMapper.getCropOffsets();
      ctx.drawImage(video, -offsets.offsetX, -offsets.offsetY, dims.width, dims.height);
    } else {
      ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    }
    ctx.restore();

    ctx.drawImage(canvas, 0, 0, snapCanvas.width, snapCanvas.height);

    const dataUrl = snapCanvas.toDataURL("image/png");
    setCapturedImageUrl(dataUrl);
    TryOnAnalytics.track("vto_photo_captured", { productId: activeProduct.id });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8DEC8] max-w-5xl w-full h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#0A251C] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#C5A059]/30 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-[#C5A059]" />
            <div>
              <h3 className="font-serif text-xs sm:text-sm tracking-widest uppercase font-bold text-[#C5A059]">
                SHIVAM OPTICS 3D VIRTUAL TRY-ON
              </h3>
              <p className="text-[10px] text-stone-300 font-sans tracking-wider uppercase">
                {activeProduct.brand || "SHIVAM OPTICS"} • {activeProduct.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:text-[#C5A059] text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
          {/* Stage Area */}
          <div
            ref={stageRef}
            className="lg:col-span-8 bg-black relative flex items-center justify-center overflow-hidden min-h-[380px] sm:min-h-[500px]"
          >
            {/* Native Hardware Decoded Stream, Mirrored */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 select-none pointer-events-none"
            />

            {/* Three.js Transparent Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Tracking Status Guidance Overlay */}
            <TrackingStatusOverlay quality={qualityScore} isLoadingModel={isLoadingModel} />

            {/* Developer Diagnostics HUD */}
            <DevDiagnosticsOverlay
              metrics={diagnostics}
              onToggleOcclusionDebug={(show) => rendererRef.current?.occlusion.setDebug(show)}
              onToggleSmoothing={(enabled) => (smoothingEnabledRef.current = enabled)}
            />

            {/* Camera Permission Overlay */}
            {cameraState !== "active" && (
              <CameraPermissionUI
                errorInfo={cameraError}
                onRetry={startTryOn}
                onClose={onClose}
              />
            )}

            {/* Floating Control Bar */}
            {cameraState === "active" && (
              <div className="absolute bottom-3 inset-x-3 sm:inset-x-5 flex items-center justify-between z-20 pointer-events-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCapturePhoto}
                  className="bg-black/70 hover:bg-black/90 text-white border-white/20 h-9 px-3.5 text-xs font-semibold backdrop-blur-md cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-[#C5A059]" />
                  <span>Take Photo</span>
                </Button>

                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-stone-300 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">On-device live tracking</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Product & Action Sidebar */}
          <div className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-[#E8DEC8] flex flex-col justify-between p-5 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <span className="font-serif text-[11px] font-bold text-[#C5A059] tracking-widest uppercase block">
                  {activeProduct.brand || "SHIVAM OPTICS"}
                </span>
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#0A251C] leading-tight mt-0.5">
                  {activeProduct.name}
                </h4>
                <p className="font-sans text-xs text-stone-500 mt-1 line-clamp-2">
                  {activeProduct.description}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 pt-1 border-t border-[#E8DEC8]">
                <span className="font-serif text-xl font-bold text-[#0A251C]">
                  {formatCurrency(activeProduct.price)}
                </span>
                {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                  <span className="font-sans text-xs text-stone-400 line-through">
                    {formatCurrency(activeProduct.originalPrice)}
                  </span>
                )}
              </div>

              {/* Optical Specifications */}
              <div className="bg-[#FAF7F2] border border-[#E8DEC8] rounded-xl p-3 space-y-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#0A251C] block">
                  Optical Dimensions
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                  <div className="bg-white p-2 rounded border border-[#E8DEC8]">
                    <span className="text-[10px] text-stone-400 block">Lens</span>
                    <span className="font-bold text-[#0A251C]">{activeProduct.specs?.lensWidth || 53} mm</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#E8DEC8]">
                    <span className="text-[10px] text-stone-400 block">Bridge</span>
                    <span className="font-bold text-[#0A251C]">{activeProduct.specs?.bridgeWidth || 18} mm</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#E8DEC8]">
                    <span className="text-[10px] text-stone-400 block">Temple</span>
                    <span className="font-bold text-[#0A251C]">{activeProduct.specs?.templeLength || 145} mm</span>
                  </div>
                </div>
              </div>

              {/* Frame Color & Material */}
              <div className="text-xs font-sans text-stone-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Color:</span>
                  <span className="font-medium text-[#0A251C]">{activeProduct.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Material:</span>
                  <span className="font-medium text-[#0A251C] capitalize">{activeProduct.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Shape:</span>
                  <span className="font-medium text-[#0A251C] capitalize">{activeProduct.shape}</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-5 space-y-2.5">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  onAddToCart(activeProduct);
                  onClose();
                  TryOnAnalytics.track("vto_add_to_cart", { productId: activeProduct.id });
                }}
                className="w-full py-3.5 text-xs font-bold tracking-widest uppercase bg-[#0A251C] hover:bg-black text-[#C5A059] shadow-md flex items-center justify-center gap-2 cursor-pointer h-auto"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                <span>ADD THIS FRAME TO BAG</span>
              </Button>

              {onOpenLensCustomizer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLensCustomizer(activeProduct);
                  }}
                  className="w-full bg-[#FAF3EB] hover:bg-[#F4E9DD] border border-[#E8DEC8] text-[#0A251C] py-2.5 px-3 font-sans font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Glasses className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>CUSTOMIZE PRESCRIPTION LENSES</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Multi-Frame Quick Selector */}
        {allProducts.length > 0 && (
          <FrameSelectorBar
            products={allProducts}
            activeProduct={activeProduct}
            onSelectProduct={handleSelectProduct}
          />
        )}
      </div>

      {/* Captured Photo Preview Modal */}
      {capturedImageUrl && (
        <PhotoCaptureModal
          imageDataUrl={capturedImageUrl}
          productName={activeProduct.name}
          onClose={() => setCapturedImageUrl(null)}
          onRetake={() => setCapturedImageUrl(null)}
        />
      )}
    </div>
  );
};
