"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "./LanguageContext";
import { 
  ShieldCheck, 
  Heart, 
  Mail, 
  Phone, 
  MapPin, 
  QrCode, 
  Sparkles
} from "lucide-react";

export default function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="bg-[#020617] text-slate-300 border-t border-slate-800/80 mt-auto">
      {/* Upper Trust Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight">100% Ground Audit</div>
                <div className="text-[11px] text-slate-400 font-medium">Physically verified cases</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                <QrCode className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight">₹0 Commission</div>
                <div className="text-[11px] text-slate-400 font-medium">100% directly to beneficiary</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight">Instant Settlement</div>
                <div className="text-[11px] text-slate-400 font-medium">Real-time direct UPI transfer</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-rose-500/30 transition">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400/30" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight">Registered Trust</div>
                <div className="text-[11px] text-slate-400 font-medium">Govt Reg: IV-190300183</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & About */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="Apni Madad Foundation Logo"
                width={50}
                height={50}
                className="rounded-full border-2 border-amber-400"
              />
              <div>
                <div className="font-extrabold text-white text-lg leading-tight">
                  Apni Madad Foundation
                </div>
                <div className="text-amber-400 text-xs font-bold tracking-wider uppercase">
                  अपनी मदद फाउंडेशन · Registered Trust
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
              {lang === "hi"
                ? "अपनी मदद फाउंडेशन एक पारदर्शी, शून्य-कमीशन सामाजिक ट्रस्ट है। हम जरूरतमंद मरीजों और परिवारों को सीधे सहायता प्रदान करने में सक्षम बनाते हैं।"
                : "Apni Madad Foundation is a zero-commission, radical-transparency humanitarian platform. We enable direct donor-to-beneficiary transfers so families in crisis receive 100% of your aid without platform cuts."}
            </p>
            <div className="text-xs text-slate-500 pt-1">
              Registered Non-Profit Trust · Reg No. IV-190300183
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/cases" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>{t("verifiedCases")}</span>
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>{lang === "hi" ? "NGO सदस्य बनें (Join Member)" : "Join NGO / Become Member"}</span>
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>{t("needHelp")} (Submit Case)</span>
                </Link>
              </li>
              <li>
                <Link href="/donate" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>Direct Donation Guide</span>
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>Admin Verification Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition flex items-center gap-1">
                  <span>Donor & Beneficiary Sign In</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">
              Contact & Support
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>support@apnimadad.org</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 93769 98999 / WhatsApp Help</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Apni Madad Central Office, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} Apni Madad Foundation. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Zero Platform Fees</span>
            <span>·</span>
            <span>Direct UPI Rails</span>
            <span>·</span>
            <span>100% Transparent</span>
          </div>
        </div>
      </div>
    </footer>
  );
}