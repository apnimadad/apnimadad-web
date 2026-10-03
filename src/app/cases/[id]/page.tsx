"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { mockCases, formatINR, getProgress } from "@/lib/mock-data";
import { useLanguage } from "@/components/LanguageContext";
import { useState } from "react";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  FileText,
  Heart,
  Share2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Eye,
  X,
  Smartphone,
  CheckCircle2,
  Send,
  Lock,
  User
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const c = mockCases.find((x) => x.id === id);
  const { lang, t } = useLanguage();
  const { user, profile, role, loginAsDemo } = useAuth();
  const isDonor = role === "donor" || role === "admin";

  // State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("500");
  const [selectedDoc, setSelectedDoc] = useState<{ name: string; url: string; type: string } | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [donatedModalOpen, setDonatedModalOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorRef, setDonorRef] = useState("");
  const [donationRecorded, setDonationRecorded] = useState(false);

  if (!c || c.category === "women_help" || c.category === "satta_mukt" || c.title?.includes("[CONFIDENTIAL")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Case Not Found</h1>
        <p className="text-slate-600 mb-6">The requested case could not be located or has been archived.</p>
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("verifiedCases")}</span>
        </Link>
      </div>
    );
  }

  const progress = getProgress(c.amountRaised, c.amountNeeded);
  const remaining = Math.max(0, c.amountNeeded - c.amountRaised);

  // Dynamic UPI URL based on selected / entered amount
  const parsedAmount = parseInt(customAmount) > 0 ? customAmount : "500";
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(c.upiId)}&pn=${encodeURIComponent(c.patientName)}&cu=INR${
    parsedAmount ? `&am=${parsedAmount}` : ""
  }`;
  const dynamicQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiIntentUrl
  )}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      const shareData = {
        title: `${c.patientName} - Apni Madad Foundation`,
        text: `Please help ${c.patientName} urgently! 100% direct donation with ₹0 commission.`,
        url: window.location.href,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // fallback to clipboard
        }
      }
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  const handleConfirmDonation = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setDonationRecorded(true);
    setTimeout(() => {
      setDonatedModalOpen(false);
      setDonationRecorded(false);
      setDonorName("");
      setDonorRef("");
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 lg:pb-16">
      {/* Toast Notification */}
      {showShareToast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-modal">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Case link copied to clipboard! Share with friends.</span>
        </div>
      )}

      {/* Breadcrumb + Share Bar */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("verifiedCases")}</span>
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-700" />
            <span>{lang === "hi" ? "साझा करें" : "Share Case"}</span>
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Visual Header */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
              <div className="relative aspect-video w-full bg-slate-900">
                <Image
                  src={c.photoUrl}
                  alt={c.patientName}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  {c.verified && (
                    <span className="verified-badge bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <ShieldCheck className="w-4 h-4 text-emerald-100" />
                      <span>{t("verified")}</span>
                    </span>
                  )}
                  <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full capitalize shadow-xs border border-white/60">
                    {c.category}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs sm:text-sm font-medium text-amber-300 mb-0.5">
                    {c.city} · {c.age} {lang === "hi" ? "वर्ष" : "Years Old"} · {c.ageGroup}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-md">
                    {c.patientName}
                  </h1>
                </div>
              </div>

              {/* Patient Video Section (if present) */}
              {c.videoUrl && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-3">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                    <span>{lang === "hi" ? "मरीज / परिवार का वीडियो संदेश" : "Beneficiary Video Appeal"}</span>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xs border border-slate-200">
                    <iframe
                      src={c.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Beneficiary Appeal Video"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Case Story & Medical Summary */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    c.status === "funded"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {c.status === "funded" ? t("funded") : t("active")}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ID: #{c.id.toUpperCase()}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 leading-snug">
                {lang === "hi" ? c.titleHi : c.title}
              </h2>

              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {lang === "hi" ? c.descriptionHi : c.description}
              </div>

              {/* Zero-Commission Commitment Callout */}
              <div className="mt-8 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-100 flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-blue-900 font-bold block mb-0.5">
                    {lang === "hi" ? "अपनी मदद फाउंडेशन की 100% पारदर्शिता गारंटी" : "Apni Madad Zero-Commission Guarantee"}
                  </strong>
                  {lang === "hi"
                    ? "आपकी पूरी राशि सीधे मरीज या उनके अधिकृत अस्पताल के बैंक खाते / यूपीआई में पहुंचती है। हमारा एनजीओ कोई शुल्क, कमीशन या बिचौलिया कटौती नहीं करता।"
                    : "Your donation goes 100% directly to the beneficiary's verified UPI or hospital account. Our foundation takes zero fees and holds no donor funds."}
                </div>
              </div>
            </div>

            {/* Verified Medical Documents & Prescriptions */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{t("documents")} ({c.documents.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "hi" ? "सत्यापित अस्पताल पर्ची, बिल व पहचान प्रमाण" : "Verified medical bills, prescriptions & ID proofs"}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {c.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-800">
                          {doc.name}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Admin Verified</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 text-slate-400 group-hover:text-blue-700 transition">
                      <Eye className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Direct Donation Box (5 cols) */}
          <div className="lg:col-span-5">
            <div id="donate" className="sticky top-24 space-y-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                {/* Progress Header */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                      {formatINR(c.amountRaised)}
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {progress}%
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mb-3">
                    {t("raised")} of {formatINR(c.amountNeeded)}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full progress-bar"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs mt-2 font-medium">
                    <span className="text-slate-500">Remaining to be raised</span>
                    <span className="font-bold text-amber-700">{formatINR(remaining)}</span>
                  </div>
                </div>

                {/* Direct Donation Form or Protected Donor Gate */}
                {c.status === "approved" && remaining > 0 && (
                  <>
                    {!isDonor ? (
                      /* Protected: Donor Verification Required */
                      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 border border-blue-900/60 text-center space-y-4 shadow-lg">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Lock className="w-6 h-6 text-amber-400" />
                        </div>

                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold mb-2 border border-amber-400/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verified Donor Access Required</span>
                          </div>
                          <h3 className="text-lg font-black text-white tracking-tight">
                            Direct Payment Details Protected
                          </h3>
                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            To protect patient privacy, prevent unauthorized fraud, and verify genuine help, direct UPI QR codes, UPI IDs, and bank account numbers are visible only to verified donors.
                          </p>
                        </div>

                        {user && role === "beneficiary" ? (
                          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-left">
                            <p className="font-bold text-amber-300">You are logged in as a Beneficiary / Needy account.</p>
                            <p className="text-[11px] text-amber-200/80 mt-1">
                              Beneficiary accounts are registered to receive help. To transfer funds directly to this patient, please switch or log in as a Donor.
                            </p>
                            <Link
                              href={`/login?role=donor&redirect=/cases/${c.id}`}
                              className="mt-3 block w-full text-center py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs shadow-xs"
                            >
                              Switch or Login as Donor
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1">
                            <Link
                              href={`/login?role=donor&redirect=/cases/${c.id}`}
                              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold rounded-xl shadow-md transition active:scale-98 text-sm"
                            >
                              <User className="w-4 h-4" />
                              <span>Login or Register as Donor to Donate</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => loginAsDemo("donor")}
                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 transition"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Instant Test: Unlock as Demo Donor</span>
                            </button>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>100% direct patient transfer with zero commission</span>
                        </div>
                      </div>
                    ) : (
                      /* Unlocked: Full Direct Payment Options for Verified Donor */
                      <div className="space-y-5">
                        {/* Verified Donor Badge */}
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                            <div>
                              <span className="font-bold text-emerald-950 block">Payment Details Unlocked</span>
                              <span className="text-[11px] text-emerald-700">
                                Verified Donor: {profile?.full_name || user?.email || "Donor"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                            Direct UPI Ready
                          </span>
                        </div>

                        {/* Amount Preset Buttons */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            {lang === "hi" ? "दान राशि चुनें (रुपये)" : "Select Amount (INR)"}
                          </label>
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            {["200", "500", "1000", "2500"].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setCustomAmount(amt)}
                                className={`py-2 px-1 text-xs font-bold rounded-xl transition ${
                                  customAmount === amt
                                    ? "bg-blue-800 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                ₹{amt}
                              </button>
                            ))}
                          </div>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                            <input
                              type="number"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder="Or enter custom amount"
                              className="w-full pl-8 pr-4 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                          </div>
                        </div>

                        {/* QR Code Card */}
                        <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 text-center space-y-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scan with any UPI App</span>
                          </div>

                          <div className="relative w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl border border-amber-300 shadow-sm flex items-center justify-center">
                            <Image
                              src={dynamicQrCode}
                              alt="Dynamic Beneficiary UPI QR"
                              width={190}
                              height={190}
                              className="rounded-lg"
                              unoptimized
                            />
                          </div>

                          <div className="text-xs text-slate-600 font-medium">
                            GPay · PhonePe · Paytm · BHIM · Amazon Pay
                          </div>

                          {/* 1-Click Mobile Launch Button */}
                          <a
                            href={upiIntentUrl}
                            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-98 text-sm"
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>{lang === "hi" ? "UPI ऐप से भुगतान करें" : "Pay via UPI App Directly"}</span>
                          </a>
                        </div>

                        {/* UPI & Bank Copy Cards */}
                        <div className="space-y-2.5">
                          {/* Copy UPI */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <div className="truncate pr-2">
                              <span className="text-slate-400 font-medium block text-[10px] uppercase">Beneficiary UPI ID</span>
                              <span className="font-mono font-bold text-slate-900 truncate block">{c.upiId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.upiId, "upi")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition shrink-0"
                            >
                              {copiedKey === "upi" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Copy Bank Account */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <div className="truncate pr-2">
                              <span className="text-slate-400 font-medium block text-[10px] uppercase">Bank Account Number</span>
                              <span className="font-mono font-bold text-slate-900 truncate block">{c.bankAccount}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.bankAccount, "bank")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition shrink-0"
                            >
                              {copiedKey === "bank" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Copy IFSC */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <div className="truncate pr-2">
                              <span className="text-slate-400 font-medium block text-[10px] uppercase">IFSC Code</span>
                              <span className="font-mono font-bold text-slate-900 truncate block">{c.ifsc}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.ifsc, "ifsc")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition shrink-0"
                            >
                              {copiedKey === "ifsc" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Donated Confirmation Button */}
                        <button
                          type="button"
                          onClick={() => setDonatedModalOpen(true)}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-2"
                        >
                          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                          <span>{lang === "hi" ? "मैंने दान कर दिया है (पुष्टि करें)" : "I Have Made a Donation"}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {c.status === "funded" && (
                  <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-200 p-6">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-extrabold text-amber-900 text-lg mb-1">{t("funded")}</h3>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Target achieved thanks to compassionate donors like you. 100% transferred directly.
                    </p>
                  </div>
                )}
              </div>

              {/* Trust Badge Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold mb-0.5">Physical Verification Completed</strong>
                  Our field officers visited {c.city}, met {c.patientName}, verified original medical bills and doctor estimates.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Donate Bar (Visible only on mobile/tablet) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-medium">Goal Remaining</div>
          <div className="text-base font-extrabold text-slate-900">{formatINR(remaining)}</div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={upiIntentUrl}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pay UPI</span>
          </a>
          <a
            href="#donate"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>View QR</span>
          </a>
        </div>
      </div>

      {/* Document Inspection Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-modal">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{selectedDoc.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-center bg-slate-50">
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto space-y-3">
                <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900">Verified Medical Document</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This document was authenticated against hospital records by Apni Madad Foundation on {c.createdAt}.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 text-left space-y-1">
                  <div><strong>Patient:</strong> {c.patientName}</div>
                  <div><strong>City:</strong> {c.city}</div>
                  <div><strong>Doc Type:</strong> {selectedDoc.type.toUpperCase()}</div>
                  <div><strong>Status:</strong> Genuine & Certified</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "I Have Donated" Recognition Modal */}
      {donatedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-modal relative">
            <button
              onClick={() => setDonatedModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {donationRecorded ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-slate-900">Thank You, Champion!</h3>
                <p className="text-xs text-slate-600">
                  Your direct contribution of ₹{customAmount} to {c.patientName} brings them one step closer to life-saving care.
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {lang === "hi" ? "दान रसीद / पुष्टि दर्ज करें" : "Record Your Contribution"}
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Since you paid directly via UPI, letting us know helps us update the target counter on the website.
                </p>

                <form onSubmit={handleConfirmDonation} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI Ref / UTR (Optional)</label>
                    <input
                      type="text"
                      value={donorRef}
                      onChange={(e) => setDonorRef(e.target.value)}
                      placeholder="12-digit UTR from your UPI App"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirm & Update Goal</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
