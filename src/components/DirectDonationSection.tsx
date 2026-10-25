"use client";

import { useState } from "react";
import Image from "next/image";
import { useSiteSettings } from "./SiteSettingsContext";
import { useLanguage } from "./LanguageContext";
import { 
  CheckCircle, 
  QrCode, 
  Smartphone, 
  ExternalLink, 
  Heart,
  Sparkles,
  ZoomIn,
  X,
  Download
} from "lucide-react";

export default function DirectDonationSection() {
  const { settings } = useSiteSettings();
  const { lang } = useLanguage();
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(500);
  const [customAmount, setCustomAmount] = useState("");

  const direct = settings?.directDonation || {
    enabled: true,
    upiId: "akkyc5@ybl",
    accountName: "ANKIT KUMAR",
    qrCodeUrl: "/foundation-qr.jpg",
    title: "Direct Foundation Donation",
    subtitle: "Scan with PhonePe, Google Pay, or Paytm to support our zero-commission medical relief mission directly.",
  };

  if (!direct.enabled) {
    return null;
  }

  const amountVal = selectedAmount === "custom" ? Number(customAmount) || 0 : selectedAmount;

  const upiIntentUrl = amountVal > 0
    ? `upi://pay?pa=${encodeURIComponent(direct.upiId)}&pn=${encodeURIComponent(direct.accountName)}&am=${amountVal}&cu=INR&tn=Foundation%20Donation`
    : `upi://pay?pa=${encodeURIComponent(direct.upiId)}&pn=${encodeURIComponent(direct.accountName)}&cu=INR&tn=Foundation%20Donation`;

  return (
    <section id="direct-donate" className="py-14 sm:py-20 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden border-y border-blue-900/40">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === "hi" ? "सीधा लाइव फाउंडेशन दान (0% शुल्क)" : "Live Direct Foundation Donation (0% Fee)"}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3 flex items-center justify-center gap-2.5">
            <Heart className="w-7 h-7 sm:w-9 sm:h-9 text-rose-500 fill-rose-500 shrink-0" />
            <span>{direct.title || (lang === "hi" ? "सीधे फाउंडेशन को दान करें" : "Direct Foundation Donation")}</span>
          </h2>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {direct.subtitle || (lang === "hi"
              ? "फोनपे, गूगल पे, पेटीएम या किसी भी यूपीआई ऐप से सीधे क्यूआर कोड स्कैन करके या आधिकारिक यूपीआई आईडी में 100% पारदर्शी सहायता भेजें।"
              : "Scan with PhonePe, Google Pay, Paytm or any UPI app to transfer funds directly without middlemen or platform deductions.")}
          </p>
        </div>

        {/* Live Donation Interactive Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Payment controls & UPI copy */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>100% Direct Aid Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Zero Platform Commission</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Instant Bank Settlement</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>NGO Reg: IV-190300183</span>
                </div>
              </div>

              {/* Amount Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {lang === "hi" ? "दान राशि चुनें (वैकल्पिक)" : "Choose Donation Amount (Optional)"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[200, 500, 1000, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={`py-2 px-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                        selectedAmount === amt
                          ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md scale-102"
                          : "bg-white/10 text-white border-white/15 hover:bg-white/15"
                      }`}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAmount("custom")}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedAmount === "custom"
                        ? "bg-amber-400 text-slate-950 border-amber-400"
                        : "bg-white/10 text-slate-300 border-white/15 hover:bg-white/15"
                    }`}
                  >
                    {lang === "hi" ? "कस्टम राशि" : "Custom Amount"}
                  </button>

                  {selectedAmount === "custom" && (
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-xs font-bold text-amber-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-black/40 border border-white/20 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile 1-Tap UPI Intent Link (PhonePe / GPay / Paytm) */}
              <div className="space-y-2 pt-2">
                <a
                  href={upiIntentUrl}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white font-black rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition active:scale-98"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>
                    {lang === "hi"
                      ? "PhonePe / GPay / Paytm से सीधे 1-टैप में दान करें"
                      : "Tap to Pay with PhonePe / GPay / Any UPI App"}
                  </span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </a>

                <p className="text-xs text-center text-slate-300">
                  {lang === "hi"
                    ? "PhonePe, Google Pay, Paytm, BHIM या किसी भी UPI ऐप से 0% कटौती के साथ सीधा बैंक ट्रांसफर।"
                    : "Compatible with PhonePe, Google Pay, Paytm, BHIM, Cred, and all bank UPI apps."}
                </p>
              </div>
            </div>

            {/* Right: PhonePe QR Code Container (Zoomed-in & Prominent) */}
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
                <p className="text-[11px] font-semibold text-purple-900 mt-1">
                  {lang === "hi" ? "PhonePe या किसी भी UPI ऐप से स्कैन करके दान करें" : "Scan & Pay directly using PhonePe or any UPI App"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Resolution QR Zoom Modal */}
      {zoomModalOpen && (
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
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "hi" ? "PhonePe, Google Pay, Paytm, BHIM द्वारा स्वीकार्य" : "Accepted on PhonePe, Google Pay, Paytm & all UPI"}
            </p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <a
                href={upiIntentUrl}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs transition shadow-md"
              >
                <Smartphone className="w-4 h-4" />
                <span>{lang === "hi" ? "PhonePe से दान करें" : "Pay via PhonePe / UPI"}</span>
              </a>

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
    </section>
  );
}
