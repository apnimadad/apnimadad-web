"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Case } from "@/types/database";
import { getCaseById, recordDonation } from "@/lib/actions/cases";
import { formatINR, getProgress } from "@/lib/format";
import { useLanguage } from "@/components/LanguageContext";
import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [c, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  const { lang, t } = useLanguage();
  const { profile } = useAuth();

  // State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("500");
  const [selectedDoc, setSelectedDoc] = useState<{ name: string; url: string; type: string } | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [donatedModalOpen, setDonatedModalOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorRef, setDonorRef] = useState("");
  const [donationRecorded, setDonationRecorded] = useState(false);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);

  useEffect(() => {
    async function fetchCase() {
      setLoading(true);
      try {
        const data = await getCaseById(id);
        setCaseData(data);
      } catch (err) {
        console.error("Failed to load case:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchCase();
    }
  }, [id]);

  useEffect(() => {
    if (profile?.full_name) {
      setDonorName(profile.full_name);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading verified case details...</p>
      </div>
    );
  }

  if (!c || c.category === "women_help" || c.category === "satta_mukt" || c.title?.includes("[CONFIDENTIAL")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Case Not Found</h1>
        <p className="text-slate-600 mb-6">The requested case could not be located, is confidential, or has been archived.</p>
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

  const raw = c as unknown as Record<string, unknown>;
  const patientName = c.patient_name || (typeof raw.patientName === "string" ? raw.patientName : "") || "Patient";
  const upiId = c.upi_id || (typeof raw.upiId === "string" ? raw.upiId : "") || "apnimadad@upi";
  const bankAccount = c.bank_account || (typeof raw.bankAccount === "string" ? raw.bankAccount : "") || "XXXXXX4521";
  const ifsc = c.ifsc || "SBIN0001234";
  const amountRaised = Number(c.amount_raised ?? (typeof raw.amountRaised === "number" ? raw.amountRaised : 0));
  const amountNeeded = Number(c.amount_needed ?? (typeof raw.amountNeeded === "number" ? raw.amountNeeded : 1));
  const photoUrl = c.photo_url || (typeof raw.photoUrl === "string" ? raw.photoUrl : "") || "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop";
  const videoUrl = c.video_url || (typeof raw.videoUrl === "string" ? raw.videoUrl : null);
  const documents = c.documents || [];
  const progress = getProgress(amountRaised, amountNeeded);
  const remaining = Math.max(0, amountNeeded - amountRaised);
  const title = (lang === "hi" ? (c.title_hi || (typeof raw.titleHi === "string" ? raw.titleHi : "") || c.title) : c.title) || "";
  const description = (lang === "hi" ? (c.description_hi || (typeof raw.descriptionHi === "string" ? raw.descriptionHi : "") || c.description) : c.description) || "";
  const city = c.city || "India";
  const age = c.age ? `${c.age} ${lang === "hi" ? "वर्ष" : "Years Old"}` : "";
  const ageGroup = c.age_group || (typeof raw.ageGroup === "string" ? raw.ageGroup : "") || "";

  // Dynamic UPI URL based on selected / entered amount
  const parsedAmount = parseInt(customAmount) > 0 ? customAmount : "500";
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(patientName)}&cu=INR${
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
        title: `${patientName} - Apni Madad Foundation`,
        text: `Please help ${patientName} urgently! 100% direct donation with ₹0 commission.`,
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

  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDonation(true);
    const donAmount = Number(customAmount) > 0 ? Number(customAmount) : 500;

    try {
      await recordDonation({
        case_id: c.id,
        amount: donAmount,
        donor_name: donorName.trim() || profile?.full_name || "Generous Supporter",
        payment_ref: donorRef.trim() || undefined,
      });

      // Update local state
      setCaseData((prev) =>
        prev
          ? {
              ...prev,
              amount_raised: Number(prev.amount_raised || 0) + donAmount,
            }
          : null
      );
    } catch (err) {
      console.error("Donation record error:", err);
    } finally {
      setIsSubmittingDonation(false);
    }

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
                  src={photoUrl}
                  alt={patientName}
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
                    {city} {age ? `· ${age}` : ""} {ageGroup ? `· ${ageGroup}` : ""}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-md">
                    {patientName}
                  </h1>
                </div>
              </div>

              {/* Patient Video Section (if present) */}
              {videoUrl && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-3">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                    <span>{lang === "hi" ? "मरीज / परिवार का वीडियो संदेश" : "Beneficiary Video Appeal"}</span>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xs border border-slate-200">
                    <iframe
                      src={videoUrl}
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
                <span className="text-xs text-slate-500 font-medium font-mono">
                  ID: #{c.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 leading-snug">
                {title}
              </h2>

              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {description}
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

            {/* Verified Medical Documents Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{lang === "hi" ? "सत्यापित दस्तावेज व अस्पताल रिपोर्ट" : "Audited Medical Documents"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Original hospital estimates, prescriptions, and identity verified by our audit team.
                  </p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                  {documents.length} Verified
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-400 uppercase font-mono">
                          {doc.type} Document
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-700" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Direct Donation Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div id="donate" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6">
              {/* Progress Header */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                      {formatINR(amountRaised)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1.5">
                      raised of {formatINR(amountNeeded)}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 font-medium mt-2">
                  <span>Direct to {patientName}&apos;s account</span>
                  <span className="font-bold text-slate-700">Remaining: {formatINR(remaining)}</span>
                </div>
              </div>

              {/* Direct UPI and Bank Payment Section (Open & Transparent for all supporters) */}
              {c.status === "approved" && remaining > 0 && (
                <div className="space-y-5">
                  {/* Verified Direct Transfer Guarantee Badge */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block">Direct Transfer Verified</span>
                        <span className="text-[11px] text-emerald-700">
                          100% reaches {patientName} directly with ₹0 commission
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      UPI Ready
                    </span>
                  </div>

                  {/* Amount Preset Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {lang === "hi" ? "दान राशि चुनें (Select Amount):" : "Choose Direct Contribution:"}
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {["500", "1000", "2500", "5000"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomAmount(amt)}
                          className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition ${
                            customAmount === amt
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          ₹{parseInt(amt).toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Other custom amount"
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Dynamic Direct QR Code Card */}
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-5 text-center shadow-md border border-slate-800 space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <QrCode className="w-4 h-4" />
                      <span>Scan & Pay via any UPI App</span>
                    </div>

                    <div className="relative mx-auto w-48 h-48 bg-white p-2.5 rounded-2xl shadow-inner border-2 border-amber-400 flex items-center justify-center">
                      <Image
                        src={dynamicQrCode}
                        alt="Patient UPI QR Code"
                        width={180}
                        height={180}
                        className="rounded-lg"
                      />
                    </div>

                    <div className="text-[11px] text-slate-300">
                      Amount dynamically set to: <strong>₹{parsedAmount}</strong>
                    </div>

                    {/* Direct Pay with UPI Apps Button (Mobile only) */}
                    <a
                      href={upiIntentUrl}
                      className="lg:hidden w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm active:scale-98"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open Google Pay / PhonePe / Paytm</span>
                    </a>
                  </div>

                  {/* UPI & Bank Copy Cards */}
                  <div className="space-y-2.5">
                    {/* Copy UPI */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="truncate pr-2">
                        <span className="text-slate-400 font-medium block text-[10px] uppercase">Beneficiary UPI ID</span>
                        <span className="font-mono font-bold text-slate-900 truncate block">{upiId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(upiId, "upi")}
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
                        <span className="font-mono font-bold text-slate-900 truncate block">{bankAccount}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankAccount, "bank")}
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
                        <span className="font-mono font-bold text-slate-900 truncate block">{ifsc}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(ifsc, "ifsc")}
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
                Our field officers visited {city}, met {patientName}, and verified original medical bills and doctor estimates.
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
        <a
          href="#donate"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          <span>Donate Direct</span>
        </a>
      </div>

      {/* Document View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-modal">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>{selectedDoc.name}</span>
                </h3>
                <p className="text-xs text-slate-500">Apni Madad Foundation Field Audit</p>
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
                  This document was authenticated against hospital records by Apni Madad Foundation.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 text-left space-y-1">
                  <div><strong>Patient:</strong> {patientName}</div>
                  <div><strong>City:</strong> {city}</div>
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
                  Your direct contribution of ₹{customAmount} to {patientName} brings them one step closer to life-saving care.
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
                      placeholder="e.g. 12-digit UPI UTR"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount Transferred</label>
                    <input
                      type="number"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingDonation}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingDonation ? "Recording..." : "Confirm & Update Live Counter"}</span>
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
