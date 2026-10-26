"use client";

import React, { useState } from "react";
import { X, Check, FileText, Upload, Glasses, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Product, LensTypeOption, LensPackage, SelectedLensConfig } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LensCustomizerModalProps {
  product: Product;
  onClose: () => void;
  onConfirmLensConfig: (config: SelectedLensConfig) => void;
}

const LENS_PACKAGES: LensPackage[] = [
  {
    id: "standard-ar",
    name: "Standard Anti-Reflective 1.56 Index",
    description: "Crisp optical clarity, multi-layer anti-reflective coating, anti-scratch hard coat, 100% UV400 shield.",
    price: 1500,
  },
  {
    id: "blue-block-thin",
    name: "Blue Block High Index 1.60 (Thin & Light)",
    description: "Filters high-energy digital blue light from monitors & smartphones. 25% thinner and lighter than standard lenses.",
    price: 2800,
    badge: "POPULAR",
  },
  {
    id: "zeiss-smartlife",
    name: "Zeiss SmartLife Ultra-Thin 1.67",
    description: "German precision optics calibrated for dynamic connected lifestyle, 40% thinner profile, oleophobic smudge resistance.",
    price: 5200,
    badge: "ZEISS GERMAN LAB",
  },
  {
    id: "essilor-crizal",
    name: "Essilor Crizal Rock Transitions Gen 8",
    description: "Intelligent photochromic optics that darken rapidly under sunlight and clear indoors with advanced scratch defense.",
    price: 7500,
    badge: "PHOTOCHROMIC",
  },
];

export const LensCustomizerModal: React.FC<LensCustomizerModalProps> = ({
  product,
  onClose,
  onConfirmLensConfig,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lensType, setLensType] = useState<LensTypeOption>("single-vision");
  const [selectedPackage, setSelectedPackage] = useState<LensPackage>(LENS_PACKAGES[1]);
  const [rxRight, setRxRight] = useState({ sph: "0.00", cyl: "0.00", axis: "0", add: "0.00" });
  const [rxLeft, setRxLeft] = useState({ sph: "0.00", cyl: "0.00", axis: "0", add: "0.00" });
  const [pdValue, setPdValue] = useState("63");
  const [prescriptionMethod, setPrescriptionMethod] = useState<"enter" | "upload" | "later">("enter");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const calculateTotalLensPrice = () => {
    if (lensType === "frame-only") return 0;
    return selectedPackage.price;
  };

  const handleFinish = () => {
    const totalLensPrice = calculateTotalLensPrice();
    const config: SelectedLensConfig = {
      lensType,
      lensPackage: lensType !== "frame-only" ? selectedPackage : undefined,
      coatings: lensType !== "frame-only" ? ["Anti-Reflective", "UV400 Shield", "Scratch-Resistant"] : [],
      prescription:
        prescriptionMethod === "enter"
          ? {
              rightEye: rxRight,
              leftEye: rxLeft,
              pd: pdValue,
            }
          : prescriptionMethod === "upload"
          ? {
              rightEye: { sph: "See Upload", cyl: "0", axis: "0", add: "0" },
              leftEye: { sph: "See Upload", cyl: "0", axis: "0", add: "0" },
              pd: pdValue,
              fileName: uploadedFileName || "Doctor_Prescription_Slip.jpg",
            }
          : undefined,
      totalLensPrice,
      packageId: lensType !== "frame-only" ? selectedPackage.id : undefined,
      packageName: lensType !== "frame-only" ? selectedPackage.name : "Frame Only (Demo Lenses)",
      packagePrice: totalLensPrice,
    };

    onConfirmLensConfig(config);
  };

  const grandTotal = product.price + calculateTotalLensPrice();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-[#E8DEC8] max-w-3xl w-full my-0 sm:my-8 shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A251C] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#C5A059]/30 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#C5A059] flex items-center justify-center font-serif text-[11px] sm:text-xs font-bold text-[#C5A059] shrink-0">
              SO
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-xs sm:text-sm tracking-wider uppercase font-bold text-[#C5A059] truncate">
                CUSTOMIZE OPTICAL LENSES
              </h3>
              <p className="text-[9px] sm:text-[10px] text-stone-300 font-sans tracking-wider uppercase truncate">
                {product.brand} • {product.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:text-[#C5A059] text-white transition cursor-pointer shrink-0" aria-label="Close modal">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-[#FAF7F2] border-b border-[#E8DEC8] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 text-[11px] sm:text-xs font-serif font-bold uppercase tracking-wider">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1 sm:gap-1.5 cursor-pointer ${step === 1 ? "text-[#C5A059]" : "text-stone-500"}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? "bg-[#0A251C] text-[#C5A059]" : "bg-stone-200 text-stone-700"}`}>1</span>
            <span><span className="hidden sm:inline">Lens </span>Type</span>
          </button>

          <span className="text-stone-300">→</span>

          <button
            onClick={() => setStep(2)}
            disabled={lensType === "frame-only"}
            className={`flex items-center gap-1 sm:gap-1.5 cursor-pointer ${step === 2 ? "text-[#C5A059]" : "text-stone-500"} disabled:opacity-40`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? "bg-[#0A251C] text-[#C5A059]" : "bg-stone-200 text-stone-700"}`}>2</span>
            <span><span className="hidden sm:inline">Coating &amp; </span>Lab</span>
          </button>

          <span className="text-stone-300">→</span>

          <button
            onClick={() => setStep(3)}
            disabled={lensType === "frame-only"}
            className={`flex items-center gap-1 sm:gap-1.5 cursor-pointer ${step === 3 ? "text-[#C5A059]" : "text-stone-500"} disabled:opacity-40`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-[#0A251C] text-[#C5A059]" : "bg-stone-200 text-stone-700"}`}>3</span>
            <span>Rx<span className="hidden sm:inline"> Prescription</span></span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs font-sans text-stone-800">
          {/* STEP 1: Lens Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-sm text-[#0A251C] uppercase tracking-wider">
                1. Select Visual Correction Type
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "single-vision",
                    title: "Single Vision (Distance or Reading)",
                    desc: "Standard optical correction for nearsightedness (-), farsightedness (+), or astigmatism.",
                  },
                  {
                    id: "progressive",
                    title: "Zeiss Digital Progressives",
                    desc: "No-line multifocal lenses for seamless vision across distance, intermediate screens, and close reading.",
                  },
                  {
                    id: "zero-power-blue",
                    title: "Zero Power Blue-Light Screen Shield",
                    desc: "No power correction with high-grade blue light filtering for software engineers, digital professionals, and gamers.",
                  },
                  {
                    id: "frame-only",
                    title: "Frame Only (Demo Lenses)",
                    desc: "Receive the genuine frame with demo protective lenses to fit custom prescriptions at your local atelier.",
                  },
                ].map((typeOption) => {
                  const isSelected = lensType === typeOption.id;
                  return (
                    <div
                      key={typeOption.id}
                      onClick={() => setLensType(typeOption.id as LensTypeOption)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#C5A059] bg-[#FAF3EB] ring-2 ring-[#C5A059]/30 shadow-xs"
                          : "border-stone-200 bg-white hover:border-[#C5A059]/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold text-[#0A251C] uppercase text-xs">{typeOption.title}</h5>
                          {isSelected && <Check className="w-4 h-4 text-[#C5A059]" />}
                        </div>
                        <p className="text-stone-600 text-[11px] leading-relaxed">{typeOption.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Lens Packages */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-sm text-[#0A251C] uppercase tracking-wider">
                2. Select Optical Coating & Lab Package
              </h4>

              <div className="space-y-3">
                {LENS_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-[#C5A059] bg-[#FAF3EB] ring-2 ring-[#C5A059]/30 shadow-xs"
                          : "border-stone-200 bg-white hover:border-[#C5A059]/50"
                      }`}
                    >
                      <div className="space-y-1 max-w-lg">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-[#0A251C] uppercase text-xs">{pkg.name}</h5>
                          {pkg.badge && (
                            <span className="bg-[#0A251C] text-[#C5A059] text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-stone-600 text-[11px] leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <span className="font-serif font-bold text-sm text-[#C5A059]">
                          +{formatCurrency(pkg.price)}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#C5A059] ml-auto mt-1" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Prescription Input */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-sm text-[#0A251C] uppercase tracking-wider">
                3. Submit Your Optical Prescription
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "enter", label: "Enter Power Values" },
                  { id: "upload", label: "Upload Doctor Slip" },
                  { id: "later", label: "Submit via WhatsApp" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPrescriptionMethod(m.id as any)}
                    className={`py-2 px-3 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer text-center ${
                      prescriptionMethod === m.id
                        ? "bg-[#0A251C] text-white border-[#0A251C]"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {prescriptionMethod === "enter" && (
                <div className="bg-[#FAF7F2] p-3 sm:p-4 border border-[#E8DEC8] space-y-4 rounded-xl">
                  {/* OD Right Eye */}
                  <div>
                    <span className="font-bold text-xs uppercase text-[#C5A059] block mb-2">Right Eye (OD)</span>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">SPH</label>
                        <Input
                          value={rxRight.sph}
                          onChange={(e) => setRxRight({ ...rxRight, sph: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">CYL</label>
                        <Input
                          value={rxRight.cyl}
                          onChange={(e) => setRxRight({ ...rxRight, cyl: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">AXIS</label>
                        <Input
                          value={rxRight.axis}
                          onChange={(e) => setRxRight({ ...rxRight, axis: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">ADD</label>
                        <Input
                          value={rxRight.add}
                          onChange={(e) => setRxRight({ ...rxRight, add: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OS Left Eye */}
                  <div>
                    <span className="font-bold text-xs uppercase text-[#C5A059] block mb-2">Left Eye (OS)</span>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">SPH</label>
                        <Input
                          value={rxLeft.sph}
                          onChange={(e) => setRxLeft({ ...rxLeft, sph: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">CYL</label>
                        <Input
                          value={rxLeft.cyl}
                          onChange={(e) => setRxLeft({ ...rxLeft, cyl: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">AXIS</label>
                        <Input
                          value={rxLeft.axis}
                          onChange={(e) => setRxLeft({ ...rxLeft, axis: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">ADD</label>
                        <Input
                          value={rxLeft.add}
                          onChange={(e) => setRxLeft({ ...rxLeft, add: e.target.value })}
                          className="bg-white text-center font-mono text-xs sm:text-sm px-1 py-1 h-9 sm:h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PD */}
                  <div className="w-full sm:w-1/2">
                    <label className="text-[9px] sm:text-[10px] text-stone-500 uppercase font-semibold">Pupillary Distance (PD mm)</label>
                    <Input
                      value={pdValue}
                      onChange={(e) => setPdValue(e.target.value)}
                      className="bg-white text-center font-mono text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                </div>
              )}

              {prescriptionMethod === "upload" && (
                <div className="border-2 border-dashed border-[#E8DEC8] p-8 text-center rounded-xl bg-stone-50 space-y-2">
                  <Upload className="w-8 h-8 text-[#C5A059] mx-auto" />
                  <p className="font-bold text-xs text-[#0A251C]">Upload your prescription photo or PDF card</p>
                  <p className="text-[11px] text-stone-500">Supports JPG, PNG, PDF up to 10MB</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFileName(e.target.files[0].name);
                      }
                    }}
                    className="text-xs text-stone-600 mt-2"
                  />
                  {uploadedFileName && (
                    <span className="text-emerald-700 font-bold flex items-center justify-center gap-1 mt-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Attached: {uploadedFileName}</span>
                    </span>
                  )}
                </div>
              )}

              {prescriptionMethod === "later" && (
                <div className="bg-[#FAF3EB] p-4 border border-[#E8DEC8] rounded-xl text-xs space-y-1">
                  <p className="font-bold text-[#0A251C]">Submit Prescription After Ordering</p>
                  <p className="text-stone-600 text-[11px]">
                    Our clinical optical specialist will reach out via WhatsApp/Phone after you place the order to verify your prescription numbers before lens cutting.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-[#FAF7F2] border-t border-[#E8DEC8] p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-between sm:block">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Customized Price</span>
            <span className="font-serif font-bold text-sm sm:text-base text-[#0A251C]">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="h-10 px-3 sm:px-4 text-xs"
              >
                Back
              </Button>
            )}

            {step < 3 && lensType !== "frame-only" ? (
              <Button
                type="button"
                variant="default"
                onClick={() => setStep((prev) => (prev + 1) as any)}
                className="h-10 px-4 sm:px-5 text-xs flex-1 sm:flex-initial"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleFinish}
                className="h-10 px-4 sm:px-6 shadow-md font-bold text-xs flex-1 sm:flex-initial"
              >
                <Check className="w-4 h-4" />
                <span>CONFIRM & ADD TO BAG</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
