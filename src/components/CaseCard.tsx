"use client";

import Link from "next/link";
import Image from "next/image";
import { Case, formatINR, getProgress } from "@/lib/mock-data";
import { useLanguage } from "./LanguageContext";
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  ArrowRight, 
  QrCode, 
  HeartPulse, 
  GraduationCap, 
  Car, 
  Accessibility, 
  Users,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function CaseCard({ c }: { c: Case }) {
  const { lang, t } = useLanguage();
  const progress = getProgress(c.amountRaised, c.amountNeeded);
  const remaining = c.amountNeeded - c.amountRaised;

  const categoryIcon = () => {
    switch (c.category) {
      case "medical": return <HeartPulse className="w-3.5 h-3.5 text-rose-500" />;
      case "education": return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
      case "accident": return <Car className="w-3.5 h-3.5 text-amber-500" />;
      case "disability": return <Accessibility className="w-3.5 h-3.5 text-purple-500" />;
      case "family": return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <article className="case-card group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:border-blue-200 flex flex-col transition-all duration-300">
      {/* Photo Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={c.photoUrl}
          alt={c.patientName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {c.verified && (
            <span className="verified-badge bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
              <span>{t("verified")}</span>
            </span>
          )}
          <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-white/60">
            {categoryIcon()}
            <span className="capitalize">{c.category}</span>
          </span>
        </div>

        {c.status === "funded" && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("funded")}</span>
          </span>
        )}

        {c.urgency === "high" && c.status === "approved" && (
          <span className="absolute bottom-3 right-3 bg-red-600/95 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>{t("high")} Urgency</span>
          </span>
        )}

        <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center gap-1.5 drop-shadow-md">
          <MapPin className="w-3.5 h-3.5 text-amber-300" />
          <span>{c.city}</span>
          <span>·</span>
          <span>{c.patientName} ({c.age} {lang === "hi" ? "वर्ष" : "yrs"})</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug mb-2 line-clamp-2 group-hover:text-blue-700 transition">
          {lang === "hi" ? c.titleHi : c.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {lang === "hi" ? c.descriptionHi : c.description}
        </p>

        {/* Progress Tracker */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="font-extrabold text-emerald-700 text-sm">
              {formatINR(c.amountRaised)}
            </span>
            <span className="text-slate-500 font-medium">
              {t("raised")} ({progress}%)
            </span>
          </div>

          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full progress-bar"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 pt-1 border-t border-slate-200/60 font-medium">
            <span>Goal: {formatINR(c.amountNeeded)}</span>
            <span className="text-slate-700 font-semibold">
              Remaining: {formatINR(Math.max(0, remaining))}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/cases/${c.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold border border-slate-300 text-slate-700 hover:text-blue-800 hover:bg-blue-50/60 rounded-xl transition active:scale-98"
          >
            <span>{t("viewDetails")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {c.status === "approved" && (
            <Link
              href={`/cases/${c.id}#donate`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs hover:shadow transition active:scale-98"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t("donateNow")}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}