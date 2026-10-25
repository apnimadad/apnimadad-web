"use client";

import Link from "next/link";
import { Lock, ShieldCheck, MessageCircle, Phone, HeartHandshake, Shield } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { useSiteSettings } from "./SiteSettingsContext";

export default function ConfidentialSupportSection() {
  const { lang } = useLanguage();
  const { settings } = useSiteSettings();

  const helplineNumber = (settings?.whatsappHelpline || "919376998999").replace(/\D/g, "");
  const formattedPhone = "9376998999";

  const defaultMessage = lang === "hi"
    ? "नमस्ते अपनी मदद फाउंडेशन। मुझे सहायता और मार्गदर्शन की आवश्यकता है। कृपया मेरी पहचान गोपनीय रखते हुए मेरा मार्गदर्शन करें।"
    : "Hello Apni Madad Foundation. I need assistance and guidance. Please guide me while keeping my identity strictly confidential.";

  return (
    <section className="relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white py-12 sm:py-16 overflow-hidden border-y border-emerald-500/20 shadow-xl">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-emerald-500/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Left Content */}
            <div className="max-w-2xl text-center lg:text-left space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-black border border-emerald-400/40 uppercase tracking-wider shadow-inner">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% गोपनीय व सुरक्षित (100% Confidential & Secure)</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                {lang === "hi"
                  ? "किसी भी प्रकार की सहायता या मार्गदर्शन के लिए हमसे संपर्क करें।"
                  : "Contact us for any kind of help or guidance."}
              </h2>

              {/* Subheading / Reassurance */}
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
                {lang === "hi"
                  ? "आपकी पहचान और जानकारी पूरी तरह गोपनीय व सुरक्षित रखी जाएगी। चाहे महिला सुरक्षा हो, सट्टा-नशा मुक्ति परामर्श या आपातकालीन सहायता, हमारी टीम निःशुल्क व सुरक्षित मार्गदर्शन प्रदान करती है।"
                  : "Your identity and information will be kept strictly confidential and secure. Whether women safety, de-addiction guidance, or urgent relief, our volunteers provide 100% private and compassionate support."}
              </p>

              {/* 3 Reassuring Feature Pills */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs text-slate-300 font-semibold">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === "hi" ? "महिला सुरक्षा सहायता" : "Women Safety Desk"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "hi" ? "सट्टा व नशा मुक्ति" : "De-Addiction Support"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>{lang === "hi" ? "शून्य-कमीशन मदद" : "Zero Commission Aid"}</span>
                </span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0 justify-center">
              {/* Primary WhatsApp Action */}
              <a
                href={`https://wa.me/${helplineNumber}?text=${encodeURIComponent(defaultMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-lg hover:shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 text-center group"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>
                  {lang === "hi"
                    ? "WhatsApp पर संपर्क करें (9376998999)"
                    : "WhatsApp Us (9376998999)"}
                </span>
              </a>

              {/* Direct Call & Confidential Forms */}
              <div className="flex items-center justify-center gap-2">
                <a
                  href={`tel:${formattedPhone}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition hover:border-white/40 flex-1 sm:flex-none"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "hi" ? "हेल्पलाइन कॉल" : "Call Helpline"}</span>
                </a>

                <Link
                  href="/women-help"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition hover:border-white/40 flex-1 sm:flex-none"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lang === "hi" ? "गोपनीय फॉर्म" : "Private Form"}</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
