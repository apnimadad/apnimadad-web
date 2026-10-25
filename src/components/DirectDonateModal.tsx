"use client";

import { useState } from "react";
import Image from "next/image";
import { useSiteSettings } from "./SiteSettingsContext";
import { useLanguage } from "./LanguageContext";
import { 
  X, 
  ShieldCheck, 
  Smartphone, 
  ExternalLink,
  Heart
} from "lucide-react";

interface DirectDonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DirectDonateModal({ isOpen, onClose }: DirectDonateModalProps) {
  const { settings } = useSiteSettings();
  const { lang } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(500);
  const [customAmount, setCustomAmount] = useState("");

  if (!isOpen) return null;

  const direct = settings.directDonation || {
    enabled: true,
    upiId: "akkyc5@ybl",
    accountName: "ANKIT KUMAR",
    qrCodeUrl: "/foundation-qr.jpg",
    title: "Direct Foundation Donation",
    subtitle: "Scan with PhonePe, Google Pay, or Paytm with 0% platform deduction.",
  };

  const amountVal = selectedAmount === "custom" ? Number(customAmount) || 0 : selectedAmount;

  // Generate UPI Intent URL
  const upiIntentUrl = amountVal > 0
    ? `upi://pay?pa=${encodeURIComponent(direct.upiId)}&pn=${encodeURIComponent(direct.accountName)}&am=${amountVal}&cu=INR&tn=Foundation%20Donation`
    : `upi://pay?pa=${encodeURIComponent(direct.upiId)}&pn=${encodeURIComponent(direct.accountName)}&cu=INR&tn=Foundation%20Donation`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-modal overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient badge */}
        <div className="relative bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0% Platform Commission · 100% Direct</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <span>{direct.title || (lang === "hi" ? "सीधे फाउंडेशन को दान करें" : "Direct Foundation Donation")}</span>
          </h3>

          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {direct.subtitle || (lang === "hi"
              ? "फोनपे या किसी भी यूपीआई ऐप से सीधे स्कैन करके तुरंत मदद भेजें।"
              : "Scan with PhonePe, Google Pay, or Paytm to support emergency medical relief directly.")}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Amount selector presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {lang === "hi" ? "दान राशि चुनें (वैकल्पिक)" : "Select Amount (Optional)"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[200, 500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                    selectedAmount === amt
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs scale-102"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedAmount("custom")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition ${
                  selectedAmount === "custom"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {lang === "hi" ? "कस्टम राशि" : "Custom Amount"}
              </button>

              {selectedAmount === "custom" && (
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>
          </div>

          {/* QR Code and Payee Details */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/80 p-4 sm:p-5 rounded-2xl border border-slate-200 text-center">
            <div className="relative w-52 h-64 sm:w-60 sm:h-72 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-slate-900 bg-black mb-3">
              <Image
                src={direct.qrCodeUrl || "/foundation-qr.jpg"}
                alt="PhonePe QR Code - Apni Madad"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 640px) 208px, 240px"
              />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Official Payee Account
              </div>
              <div className="text-base font-black text-slate-900 tracking-tight">
                {direct.accountName}
              </div>
            </div>
          </div>

          {/* Direct Mobile UPI Intent Button (PhonePe / GPay / Paytm) */}
          <div className="space-y-2">
            <a
              href={upiIntentUrl}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {lang === "hi" 
                  ? "फोनपे / गूगल पे / पेटीएम से सीधे भुगतान करें" 
                  : "Tap to Pay with PhonePe / GPay / Any UPI App"}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <p className="text-[11px] text-center text-slate-500">
              Compatible with PhonePe, Google Pay, Paytm, BHIM, Cred, and all bank UPI apps.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Apni Madad Foundation Verified
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
