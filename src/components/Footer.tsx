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
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-auto">
      {/* Upper Trust Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">100% Physical Audit</div>
                <div className="text-[11px] text-slate-400">Ground verified cases</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">₹0 Commission</div>
                <div className="text-[11px] text-slate-400">Direct to Beneficiary UPI</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Instant Settlement</div>
                <div className="text-[11px] text-slate-400">No escrow or waiting</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Transparent NGO</div>
                <div className="text-[11px] text-slate-400">Registered Trust (India)</div>
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
                <span>+91 98765 43210 / WhatsApp Help</span>
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