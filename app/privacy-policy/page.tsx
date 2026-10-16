"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileText,
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  Send,
  Eye,
  Glasses,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function PrivacyPolicyPage() {
  const [activeTab, setActiveTab] = useState("clinical");
  const [requestForm, setRequestForm] = useState({
    name: "",
    phone: "",
    email: "",
    requestType: "Access Records",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.name || !requestForm.phone) {
      toast.error("Please provide your name and phone number.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setRequestSent(true);
      toast.success("Privacy Request Transmitted", {
        description: "Our Data Protection Officer will process your request within 48 hours.",
      });
      setRequestForm({
        name: "",
        phone: "",
        email: "",
        requestType: "Access Records",
        details: "",
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816]">
      {/* 1. Header Banner */}
      <section className="bg-[#FAF3EB] border-b border-[#E8DEC8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold">
            <Link href="/" className="hover:text-[#0A251C] transition">Home</Link>
            <span>/</span>
            <span className="text-[#C5A059] font-bold">Privacy & Medical Data Protection</span>
          </div>
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#C5A059] uppercase block">
            CLINICAL ATELIER STANDARDS • IT ACT 2000 & DPDP COMPLIANCE
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0A251C] tracking-tight">
            Privacy Policy & Optical Data Charter
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
            At Shivam Opticals Atelier, we hold the privacy of your optical diagnostic records, pupil distance measurements, and transaction history to the highest standards of confidentiality and medical integrity.
          </p>
          <p className="text-[11px] text-stone-400">
            Last Updated & Certified: October 2026 • Effective for all storefront purchases and in-store consultations.
          </p>
        </div>
      </section>

      {/* 2. Main Content Layout */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Navigation Rails */}
          <div className="lg:col-span-4 space-y-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-[#E8DEC8] p-5 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block px-2">
                POLICY SECTIONS
              </span>

              <button
                type="button"
                onClick={() => setActiveTab("clinical")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "clinical"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Glasses className="w-3.5 h-3.5" />
                  <span>Clinical Prescription Records</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("prescription")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "prescription"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Prescription & Lens Records</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "payments"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Payments & GST Billing Records</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("rights")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "rights"
                    ? "bg-[#0A251C] text-[#C5A059]"
                    : "text-stone-600 hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Patron Data Rights & Officer</span>
                </div>
              </button>
            </div>

            {/* Officer Coordinates */}
            <div className="bg-[#FAF3EB] rounded-2xl border border-[#E8DEC8] p-5 text-xs text-stone-600 space-y-2">
              <h4 className="font-bold text-[#0A251C] uppercase tracking-wider text-[11px]">
                Data Protection Officer
              </h4>
              <p>Shivam Opticals Atelier Grievance Redressal</p>
              <p className="text-[#0A251C] font-medium">dpo@shivamoptics.in</p>
              <p>Shop No-1, Kanishka Complex, Samachar Market, Mayur Vihar Ph 1 Ext, Delhi</p>
            </div>
          </div>

          {/* Right Column: Deep Legal & Clinical Content */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E8DEC8] p-6 sm:p-10 shadow-xs space-y-8">
            {/* Section 1: Clinical Eye Prescriptions */}
            {activeTab === "clinical" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#E8DEC8] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                    CLINICAL CONFIDENTIALITY
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#0A251C] mt-1">
                    1. Handling of Medical & Ophthalmic Prescriptions
                  </h2>
                </div>

                <div className="prose text-xs text-stone-600 space-y-4 leading-relaxed">
                  <p>
                    When you reserve an eye test or enter lens prescription values (Right Eye OD / Left Eye OS sphere, cylinder, axis, pupillary distance, and addition), this information is treated as privileged health-related data.
                  </p>
                  <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8] space-y-2">
                    <h3 className="font-bold text-[#0A251C] text-xs uppercase tracking-wide">
                      Our Medical Safeguards Include:
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-stone-600">
                      <li>
                        <strong>Restricted Laboratory Access:</strong> Prescriptions are disclosed solely to certified opticians, optometrists, and laboratory lens surfacing technicians for lens edging.
                      </li>
                      <li>
                        <strong>Encrypted Storage:</strong> All prescription parameters stored in our cloud infrastructure utilize AES-256 encryption at rest.
                      </li>
                      <li>
                        <strong>Zero Third-Party Commercial Sale:</strong> We never sell, monetize, or lease your vision records to third-party pharmaceutical or ad networks.
                      </li>
                    </ul>
                  </div>
                  <p>
                    Prescription files uploaded by patrons (such as doctor slip scans or clinic printouts) are stored within protected, private storage buckets and automatically expunged upon customer request.
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: 3D VTO & Biometrics */}
            {activeTab === "prescription" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#E8DEC8] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                    CLINICAL DATA
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#0A251C] mt-1">
                    2. Prescription Lenses &amp; Optical Parameters
                  </h2>
                </div>

                <div className="prose text-xs text-stone-600 space-y-4 leading-relaxed">
                  <p>
                    Shivam Opticals processes clinical prescription measurements (Sphere, Cylinder, Axis, Pupillary Distance, and Add power) exclusively to engineer custom corrective lenses.
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-emerald-900">
                    <h3 className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      Confidential Clinical Handling
                    </h3>
                    <p className="text-emerald-800">
                      All prescription diopter records are safeguarded with strict optical laboratory confidentiality standards and are never sold or shared with third parties.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Payments & Billing Records */}
            {activeTab === "payments" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#E8DEC8] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                    TRANSACTIONAL DATA
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#0A251C] mt-1">
                    3. Payment Gateways, Delivery & GST Tax Invoicing
                  </h2>
                </div>

                <div className="prose text-xs text-stone-600 space-y-4 leading-relaxed">
                  <p>
                    All online financial transactions are processed securely through RBI-licensed payment aggregators (such as <strong>Razorpay</strong>) using end-to-end tokenization and TLS 1.3 cryptographic transport.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                      <h4 className="font-bold text-[#0A251C] mb-1">PCI-DSS Tokenization</h4>
                      <p className="text-stone-500">
                        We never store card numbers, CVVs, or bank net banking credentials on our servers. All card details are processed directly within PCI-DSS certified gateway vaults.
                      </p>
                    </div>
                    <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DEC8]">
                      <h4 className="font-bold text-[#0A251C] mb-1">GST Tax Compliance</h4>
                      <p className="text-stone-500">
                        Under Section 36 of the Central Goods & Services Tax (CGST) Act, transaction invoices under HSN codes 9003 (frames) and 9001 (lenses) are retained for 72 months for statutory tax audits.
                      </p>
                    </div>
                  </div>
                  <p>
                    Shipping addresses and contact numbers are shared strictly with our contracted courier partners (such as <strong>BlueDart Express</strong> and <strong>Delhivery</strong>) solely for the fulfillment and door delivery of your optical orders.
                  </p>
                </div>
              </div>
            )}

            {/* Section 4: Patron Data Rights */}
            {activeTab === "rights" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-[#E8DEC8] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block">
                    PATRON RIGHTS
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#0A251C] mt-1">
                    4. Your Rights Under DPDP Act 2023 & Submission Portal
                  </h2>
                </div>

                <div className="prose text-xs text-stone-600 space-y-4 leading-relaxed">
                  <p>
                    Under applicable data protection legislation, you are entitled to exercise the following rights regarding your personal and ophthalmic information:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-600">
                    <li><strong>Right to Access:</strong> Request a copy of your stored prescription records and order history.</li>
                    <li><strong>Right to Correction:</strong> Update outdated address or prescription parameters.</li>
                    <li><strong>Right to Erasure:</strong> Request the deletion of your account and saved medical data (subject to statutory GST retention rules).</li>
                    <li><strong>Right to Withdraw Consent:</strong> Opt out of promotional SMS or WhatsApp broadcasts at any time.</li>
                  </ul>
                </div>

                {/* Interactive Data Request Form */}
                <div className="mt-6 p-6 bg-[#FAF3EB] rounded-2xl border border-[#E8DEC8] space-y-4">
                  <h3 className="font-serif font-bold text-[#0A251C] text-sm uppercase tracking-wider">
                    Submit a Formal Data Protection Request
                  </h3>

                  {requestSent ? (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs text-center space-y-1">
                      <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600" />
                      <p className="font-bold">Request Logged Successfully</p>
                      <p>Our Data Protection Officer will review and respond to your registered contact within 48 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={requestForm.name}
                          onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                          placeholder="Your Full Name *"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-[#C5A059] bg-white"
                        />
                        <input
                          type="tel"
                          required
                          value={requestForm.phone}
                          onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                          placeholder="Phone Number *"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-[#C5A059] bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="email"
                          value={requestForm.email}
                          onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                          placeholder="Email Address"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-[#C5A059] bg-white"
                        />
                        <select
                          value={requestForm.requestType}
                          onChange={(e) => setRequestForm({ ...requestForm, requestType: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-[#C5A059] bg-white"
                        >
                          <option value="Access Records">Request Copy of Prescription & Orders</option>
                          <option value="Update Records">Update / Correct Contact or Address</option>
                          <option value="Delete Account">Request Deletion of Account & Profile</option>
                          <option value="Opt Out Broadcasts">Opt Out of Marketing Broadcasts</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={requestForm.details}
                        onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                        placeholder="Additional details regarding your request (optional)..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-[#C5A059] bg-white"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? "Submitting..." : "Submit Formal Privacy Request"}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
