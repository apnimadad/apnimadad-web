"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { useAuth } from "@/components/AuthContext";
import CaseCard from "@/components/CaseCard";
import { mockCases } from "@/lib/mock-data";
import { 
  ShieldCheck, 
  QrCode, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Lock,
  User
} from "lucide-react";

export default function DonatePage() {
  const { lang, t } = useLanguage();
  const { user, profile, role } = useAuth();
  const isDonor = role === "donor" || role === "admin";
  const active = mockCases.filter((c) => c.status === "approved");

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-emerald-400 mb-3 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Commission Direct Transfer Pledge</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
              {t("donate")} Directly To Beneficiaries
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {lang === "hi"
                ? "हमारी वेबसाइट पर दिए गए किसी भी सत्यापित केस को चुनें और सीधे उनके बैंक खाते या यूपीआई आईडी में दान करें। हमारा एनजीओ कोई कमीशन या कट नहीं लेता।"
                : "Select any verified emergency below and pay directly into the patient's UPI or hospital account. 100% of your money reaches the family in need."}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Direct Process Callout */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {active.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>

        {active.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900">All Active Cases Funded</h3>
            <p className="text-xs text-slate-500 mt-1">
              All ongoing emergencies have reached their goals! New verified cases will be posted shortly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
