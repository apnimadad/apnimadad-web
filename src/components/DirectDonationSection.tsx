"use client";

import { useState } from "react";
import Image from "next/image";
import { useSiteSettings } from "./SiteSettingsContext";
import { useLanguage } from "./LanguageContext";
import { 
  CheckCircle, 
  QrCode, 
  Copy, 
  Check, 
  Smartphone, 
  ExternalLink, 
  Heart,
  Sparkles
} from "lucide-react";

export default function DirectDonationSection() {
  const { settings } = useSiteSettings();
  const { lang } = useLanguage();
  const [copiedUpi, setCopiedUpi] = useState(false);
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

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(direct.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

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

              {/* Official UPI ID Box with 1-click Copy */}
              <div className="p-4 sm:p-5 bg-black/40 rounded-2xl border border-white/15 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Official Foundation UPI ID</span>
                  </span>
                  <span className="text-slate-300 text-[11px]">
                    Payee: <strong className="text-white">{direct.accountName}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wide select-all bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10 truncate">
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

              {/* Mobile 1-Tap UPI Intent Link */}
              <div className="space-y-2">
                <a
                  href={upiIntentUrl}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {lang === "hi"
                      ? "फोनपे / गूगल पे / पेटीएम से 1-टैप में दान करें"
                      : "Tap to Pay with PhonePe / GPay / Any UPI App"}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <p className="text-[11px] text-center text-slate-400">
                  Compatible with PhonePe, Google Pay, Paytm, BHIM, Cred, and all bank UPI apps.
                </p>
              </div>
            </div>

            {/* Right: PhonePe QR Code Container */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border-4 border-amber-400 text-slate-900 max-w-xs w-full text-center">
                <div className="text-[11px] font-black uppercase tracking-wider text-purple-900 mb-2 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-800" />
                  <span>PhonePe Accepted Here</span>
                </div>

                <div className="relative w-full aspect-[9/16] max-h-88 rounded-2xl overflow-hidden bg-black mb-3 shadow-inner">
                  <Image
                    src={direct.qrCodeUrl || "/foundation-qr.jpg"}
                    alt="PhonePe Accepted Here QR Code"
                    fill
                    priority
                    className="object-contain"
                    sizes="(max-width: 640px) 260px, 300px"
                  />
                </div>

                <div className="text-xs font-black text-slate-900 tracking-tight">
                  {direct.accountName}
                </div>
                <div className="text-[11px] font-mono font-bold text-purple-800 mt-0.5">
                  {direct.upiId}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Scan &amp; Pay directly using any UPI App
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
