"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";
import CaseCard from "@/components/CaseCard";
import DirectDonationSection from "@/components/DirectDonationSection";
import ConfidentialSupportSection from "@/components/ConfidentialSupportSection";
import { useState, useEffect } from "react";
import { Case } from "@/types/database";
import {
  ShieldCheck,
  HeartHandshake,
  QrCode,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  Lock,
  Smartphone,
  Loader2,
} from "lucide-react";

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [featured, setFeatured] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadRealCases() {
      try {
        const res = await fetch("/api/cases");
        const json = await res.json();
        if (json.success && Array.isArray(json.cases)) {
          setFeatured(json.cases.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load featured cases:", err);
      } finally {
        setLoadingCases(false);
      }
    }
    loadRealCases();
  }, []);

  const faqs = [
    {
      q: lang === "hi" ? "अपनी मदद फाउंडेशन ₹0 कमीशन पर कैसे काम करता है?" : "How does Apni Madad operate with ₹0 commission?",
      a: lang === "hi" 
        ? "हमारा मानना है कि जरूरतमंद मरीज के इलाज का एक भी पैसा कटना नहीं चाहिए। हमारी संस्था का संचालन हमारे न्यासियों और स्वयंसेवकों के व्यक्तिगत योगदान द्वारा समर्थित है।"
        : "We believe not a single rupee should be shaved off medical emergencies. Our NGO operations, field verification, and hosting costs are sponsored voluntarily by our founding trustees and patrons.",
    },
    {
      q: lang === "hi" ? "मेरा दान सीधे लाभार्थी तक कैसे पहुंचता है?" : "How does my donation reach the patient directly?",
      a: lang === "hi"
        ? "जब आप क्यूआर कोड स्कैन करते हैं या यूपीआई आईडी पर भुगतान करते हैं, तो आपकी राशि हमारे पास नहीं आती। वह सीधे मरीज या अस्पताल के खाते में उसी क्षण जमा हो जाती है।"
        : "When you scan the UPI QR or click to pay, the transaction occurs directly between your UPI App (GPay, PhonePe, Paytm, etc.) and the beneficiary's authenticated bank account. We never hold or escrow donor funds.",
    },
    {
      q: lang === "hi" ? "केस का सत्यापन कैसे किया जाता है?" : "How is a case verified before approval?",
      a: lang === "hi"
        ? "हमारे फील्ड प्रतिनिधि मरीज के पते पर जाकर डॉक्टर के पर्चे, अस्पताल के अनुमानित बिल, आधार कार्ड और बैंक खाते की पुष्टि करते हैं।"
        : "Our field audit volunteers physically visit the patient's hospital or home, inspect original medical diagnosis papers, doctor estimates, and authenticate identity and bank credentials before the verified badge is granted.",
    },
    {
      q: lang === "hi" ? "क्या कोई भी जरूरतमंद व्यक्ति केस सबमिट कर सकता है?" : "Can any needy person submit a fundraising request?",
      a: lang === "hi"
        ? "हां, इलाज, शिक्षा, दुर्घटना, दिव्यांगता या गंभीर पारिवारिक विपदा में कोई भी व्यक्ति 'केस सबमिट करें' फॉर्म भर सकता है। हमारी टीम 24-48 घंटों में संपर्क करेगी।"
        : "Yes! Any family in genuine distress (medical treatments, surgeries, accident care, child education, or disability support) can submit their case. Our team audits and responds within 24 to 48 hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#020617] via-[#07132a] to-[#030919] text-white overflow-hidden py-16 sm:py-24">
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-white/20 shadow-xs transition-colors">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-extrabold">100% Direct Beneficiary Transfer</span>
                <span className="text-white/30">·</span>
                <span className="text-amber-300">₹0 Platform Fee</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                {t("heroTitle")}
              </h1>

              <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {t("heroSubtitle")}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2 max-w-sm sm:max-w-none mx-auto">
                <Link
                  href="/cases"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl shadow-[0_10px_25px_-5px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base w-full sm:w-auto"
                >
                  <HeartHandshake className="w-5 h-5 text-slate-950" />
                  <span>{t("browseCases")}</span>
                </Link>

                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/20 hover:border-amber-400/40 text-white font-extrabold rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base w-full sm:w-auto shadow-sm"
                >
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <span>{t("submitCase")}</span>
                </Link>
              </div>

              {/* Trust Indicators Pill List */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-[11px] sm:text-xs text-slate-300/90 font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Physically Verified Cases</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-300">
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>Direct UPI / Bank Transfer</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>No Middlemen Or Wallet</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Visual Card (5 cols) */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="relative w-full max-w-sm">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/30 via-emerald-500/30 to-blue-500/30 rounded-3xl blur-xl opacity-40 animate-pulse pointer-events-none" />

                <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white space-y-4 sm:space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <Image
                        src="/logo.jpeg"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border-2 border-amber-400 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm text-white truncate">Direct Transfer Preview</div>
                        <div className="text-[10px] sm:text-[11px] text-emerald-400 font-bold truncate">100% Transparent Protocol</div>
                      </div>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/40 whitespace-nowrap shrink-0 shadow-inner">
                      DIRECT TRANSFER
                    </span>
                  </div>

                  {/* Flow Simulation Box */}
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Donor Gives</span>
                      <span className="font-extrabold text-white text-sm">₹1,000</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-rose-400">
                      <span>Apni Madad Commission</span>
                      <span className="font-bold">₹0 (0%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-rose-400">
                      <span>Payment Gateway Fee</span>
                      <span className="font-bold">₹0 (Direct UPI)</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm font-black text-emerald-400">
                      <span>Patient Receives</span>
                      <span className="text-base text-emerald-300">₹1,000 (100%)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.06] rounded-2xl border border-white/10 flex items-center gap-3">
                    <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
                    <div className="text-[11px] sm:text-xs text-slate-300 leading-snug font-medium">
                      Open Google Pay, PhonePe, or Paytm and scan the patient&apos;s verified UPI QR directly.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 100% Confidential & Secure Assistance Section (Inside Body) */}
      <ConfidentialSupportSection />

      {/* Transparency Comparison Table (Apni Madad vs Traditional Platforms) */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Why We Are Different
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-3">
              Apni Madad vs Other Crowdfunding Platforms
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Traditional donation websites take 5% to 10% platform cuts and hold funds for weeks. We eliminate every barrier.
            </p>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 text-xs text-blue-700 font-semibold mb-2 bg-blue-50/70 py-1.5 px-3 rounded-full border border-blue-200 text-center">
            <span>← स्वाइप करके तुलना देखें / Scroll horizontally to compare →</span>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[580px] sm:min-w-[640px] bg-white rounded-3xl border border-slate-200/90 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.06)] p-3 sm:p-5">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] sm:text-[11px] tracking-wider">
                    <th className="py-4 px-4 sm:px-5">Audit Criterion</th>
                    <th className="py-4 px-4 sm:px-5 bg-blue-50/80 text-blue-950 rounded-t-2xl font-black text-xs sm:text-sm border-x border-t border-blue-200/60 shadow-xs">
                      Apni Madad Foundation (Direct)
                    </th>
                    <th className="py-4 px-4 sm:px-5 text-slate-500">Other Crowdfunding Platforms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 sm:px-5 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">%</span>
                      <span>Platform Commission Cut</span>
                    </td>
                    <td className="py-4 px-4 sm:px-5 bg-blue-50/40 border-x border-blue-200/40 font-black text-emerald-700">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 shadow-2xs">
                        ₹0 (Zero Commission Guarantee)
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-rose-600 font-bold">5% to 10% deducted</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 sm:px-5 font-bold text-slate-800">
                      Destination of Donated Funds
                    </td>
                    <td className="py-4 px-4 sm:px-5 bg-blue-50/40 border-x border-blue-200/40 font-black text-slate-900">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-900 border border-blue-300/60">
                        Direct to Patient / Hospital Account
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium">Held in platform escrow wallet</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 sm:px-5 font-bold text-slate-800">
                      Fund Settlement Speed
                    </td>
                    <td className="py-4 px-4 sm:px-5 bg-blue-50/40 border-x border-blue-200/40 font-black text-emerald-700">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300/60">
                        Instant (Same Second via UPI)
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium">7 to 15 days bank payout delay</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 sm:px-5 font-bold text-slate-800">
                      Ground Physical Verification
                    </td>
                    <td className="py-4 px-4 sm:px-5 bg-blue-50/40 border-x border-b border-blue-200/40 rounded-b-2xl font-black text-slate-900">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-900 border border-blue-300/60">
                        Field audit officers inspect hospital & home
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-5 text-slate-600 font-medium">Automated online form upload only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Live Direct Foundation Donation Section (PhonePe QR & UPI) */}
      <DirectDonationSection />

      {/* Featured Verified Cases Section */}
      <section className="py-16 sm:py-20 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Urgent Needs
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
                {t("verifiedCases")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Patients who need your immediate help today. 100% direct payment.
              </p>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-blue-800 hover:text-blue-950 transition"
            >
              <span>Explore All Cases</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingCases ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading verified emergency cases...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featured.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {t("howItWorks")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A transparent, human-first protocol that eliminates middlemen completely.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: t("step1"),
                desc: t("step1Desc"),
                icon: <PlusCircle className="w-6 h-6 text-blue-700" />,
              },
              {
                step: "02",
                title: t("step2"),
                desc: t("step2Desc"),
                icon: <ShieldCheck className="w-6 h-6 text-indigo-700" />,
              },
              {
                step: "03",
                title: t("step3"),
                desc: t("step3Desc"),
                icon: <QrCode className="w-6 h-6 text-emerald-700" />,
              },
              {
                step: "04",
                title: t("step4"),
                desc: t("step4Desc"),
                icon: <CheckCircle2 className="w-6 h-6 text-amber-600" />,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/90 text-center relative group hover:border-blue-300 transition"
              >
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  {item.icon}
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                  Step {item.step}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear answers regarding our zero-commission direct model.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-blue-800"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180 text-blue-700" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
