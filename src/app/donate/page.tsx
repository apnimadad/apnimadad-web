"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";
import { useAuth } from "@/components/AuthContext";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import CaseCard from "@/components/CaseCard";
import { useState, useEffect } from "react";
import { Case } from "@/types/database";
import { 
  ShieldCheck, 
  QrCode, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Lock,
  User,
  Loader2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Heart,
  ZoomIn,
  X,
  Download
} from "lucide-react";

export default function DonatePage() {
  const { lang, t } = useLanguage();
  const { user, profile, role } = useAuth();
  const { settings } = useSiteSettings();
  const isDonor = role === "donor" || role === "admin";
  const [active, setActive] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  const direct = settings?.directDonation || {
    enabled: true,
    upiId: "akkyc5@ybl",
    accountName: "ANKIT KUMAR",
    qrCodeUrl: "/foundation-qr.jpg",
    title: "Direct Foundation Donation",
    subtitle: "Scan with PhonePe, Google Pay, or Paytm to support our zero-commission medical relief mission directly.",
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(direct.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetch("/api/cases");
        const json = await res.json();
        if (json.success && Array.isArray(json.cases)) {
          setActive(json.cases);
        }
      } catch (e) {
        console.error("Failed to load donate cases:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-emerald-400 mb-3 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Commission Direct Transfer Pledge</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
              {t("donate")} Directly To Beneficiaries & Foundation
            </h1>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
              {lang === "hi"
                ? "हमारी वेबसाइट पर दिए गए किसी भी सत्यापित केस को चुनें या सीधे फाउंडेशन के आधिकारिक फोनपे QR / यूपीआई पर दान करें। हमारा एनजीओ कोई कमीशन या कट नहीं लेता।"
                : "Support verified emergency patient cases or contribute directly to our zero-commission medical foundation via official PhonePe QR and UPI ID."}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* SECTION A: Direct Foundation Donation Card (PhonePe QR & UPI) */}
        {direct.enabled && (
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-xl border border-blue-800/80">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left / Info */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Direct Option (No Login Needed)</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
                  <span>{direct.title || (lang === "hi" ? "सीधा फाउंडेशन दान" : "Direct Foundation Donation")}</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {direct.subtitle || (lang === "hi"
                    ? "फोनपे, गूगल पे, पेटीएम या किसी भी बैंक यूपीआई ऐप से सीधे क्यूआर कोड स्कैन करके या यूपीआई आईडी में बिना किसी बिचौलिये के सहायता भेजें।"
                    : "Pay directly via PhonePe QR code or UPI ID. 100% of your generous aid goes straight to emergency medical relief with zero deductions.")}
                </p>

                {/* Key Points */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>0% Platform Deduction</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Instant Bank Settlement</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>NGO Registered: IV-190300183</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>All UPI Apps Supported</span>
                  </div>
                </div>

                {/* UPI ID Bar */}
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
                      Official Foundation UPI ID
                    </span>
                    <span className="text-slate-300">Account: <strong className="text-white">{direct.accountName}</strong></span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wide select-all bg-black/30 px-3.5 py-2 rounded-xl border border-white/10 truncate">
                      {direct.upiId}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm ${
                        copiedUpi
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black"
                      }`}
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick mobile intent pay button */}
                <a
                  href={`upi://pay?pa=${encodeURIComponent(direct.upiId)}&pn=${encodeURIComponent(direct.accountName)}&cu=INR&tn=Foundation%20Support`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Tap to Pay with PhonePe / GPay / Paytm App</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

              {/* Right / PhonePe QR Code Container (Zoomed-in & Prominent) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-2xl border-4 border-amber-400 text-slate-900 max-w-sm w-full text-center">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-[11px] font-black uppercase tracking-wider">
                      <QrCode className="w-3.5 h-3.5 text-purple-800" />
                      <span>PhonePe Accepted</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setZoomModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition cursor-pointer"
                      title="Click to Zoom Fullscreen"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>{lang === "hi" ? "बड़ा करें" : "Zoom"}</span>
                    </button>
                  </div>

                  {/* Big Zoomed QR Code Box */}
                  <div 
                    onClick={() => setZoomModalOpen(true)}
                    className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto rounded-2xl overflow-hidden bg-black p-3.5 shadow-inner cursor-zoom-in group mb-4 border-2 border-slate-900"
                  >
                    <Image
                      src={direct.qrCodeUrl || "/foundation-qr.jpg"}
                      alt="PhonePe Accepted Here QR Code"
                      fill
                      priority
                      className="object-contain p-2 group-hover:scale-105 transition duration-200"
                      sizes="(max-width: 640px) 280px, 320px"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                      <ZoomIn className="w-4 h-4 text-amber-400" />
                      <span>Click to Enlarge</span>
                    </div>
                  </div>

                  <div className="text-sm font-black text-slate-950 tracking-tight">
                    {direct.accountName}
                  </div>
                  <div className="text-xs font-mono font-black text-purple-900 mt-0.5 select-all">
                    {direct.upiId}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    Scan with any UPI app on your phone
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen High-Resolution QR Zoom Modal */}
        {zoomModalOpen && direct.enabled && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setZoomModalOpen(false)}
          >
            <div 
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-amber-400 text-slate-900 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs font-black uppercase tracking-wider text-purple-900 mb-2 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-purple-800" />
                <span>Official Foundation QR Code</span>
              </div>

              <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[380px] mx-auto rounded-2xl overflow-hidden bg-black p-4 mb-4 shadow-xl border-2 border-slate-900">
                <Image
                  src={direct.qrCodeUrl || "/foundation-qr.jpg"}
                  alt="PhonePe Accepted Here QR Code Large"
                  fill
                  priority
                  className="object-contain p-2"
                  sizes="380px"
                />
              </div>

              <div className="text-base font-black text-slate-950">
                {direct.accountName}
              </div>
              <div className="text-sm font-mono font-black text-purple-900 select-all mt-0.5">
                {direct.upiId}
              </div>

              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition"
                >
                  {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUpi ? "Copied UPI!" : "Copy UPI ID"}</span>
                </button>

                <a
                  href={direct.qrCodeUrl || "/foundation-qr.jpg"}
                  download="foundation-qr.jpg"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Save QR</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Direct Process Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 sm:mb-10">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Direct UPI Scan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan patient&apos;s QR code via Google Pay, PhonePe, or Paytm with instant bank settlement.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">₹0 Deducted</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                No 5-10% fees. No wallet escrow. Every single rupee goes directly towards medical care.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">100% Audited Proofs</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All patient bills, doctor prescriptions, and hospital estimates are physically audited.
              </p>
            </div>
          </div>
        </div>

        {/* Donor Access Gate / Advisory */}
        {!isDonor ? (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 mb-10 border border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Donor Login Required to Unlock Direct Payment Options
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Simple visitors can view all verified case proofs. Direct beneficiary UPI QR codes and bank details are exclusively accessible once you login or register as a Donor.
                </p>
              </div>
            </div>
            <Link
              href="/login?role=donor&redirect=/donate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold rounded-xl transition text-xs sm:text-sm shrink-0 shadow-xs"
            >
              <User className="w-4 h-4" />
              <span>Login as Donor</span>
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-4 mb-8 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <div>
                <span className="font-bold block">Verified Donor Session Active</span>
                <span className="text-emerald-700">
                  Logged in as {profile?.full_name || user?.email}. You can open any case to view and pay via its direct UPI QR.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              Full Payment Access
            </span>
          </div>
        )}

        {/* Active Cases Grid */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Active Urgent Cases ({active.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified families waiting for urgent financial intervention
            </p>
          </div>
          <Link
            href="/cases"
            className="text-xs sm:text-sm font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading urgent verified cases...</p>
          </div>
        ) : active.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900">All Active Cases Funded</h3>
            <p className="text-xs text-slate-500 mt-1">
              All ongoing emergencies have reached their goals! New verified cases will be posted shortly.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {active.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
