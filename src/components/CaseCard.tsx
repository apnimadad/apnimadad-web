"use client";

import Link from "next/link";
import Image from "next/image";
import { Case } from "@/types/database";
import { formatINR, getProgress } from "@/lib/format";
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

export default function CaseCard({
  c,
}: {
  c: Case & {
    patientName?: string;
    photoUrl?: string;
    titleHi?: string;
    descriptionHi?: string;
    amountRaised?: number;
    amountNeeded?: number;
  };
}) {
  const { lang, t } = useLanguage();

  const amountRaised = Number(c.amount_raised ?? c.amountRaised ?? 0);
  const amountNeeded = Number(c.amount_needed ?? c.amountNeeded ?? 1);
  const progress = getProgress(amountRaised, amountNeeded);
  const remaining = Math.max(0, amountNeeded - amountRaised);

  const patientName = c.patient_name || c.patientName || "Patient";
  const photoUrl = c.photo_url || c.photoUrl || "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop";
  const title = (lang === "hi" ? (c.title_hi || c.titleHi || c.title) : c.title) || "Medical Case";
  const description = (lang === "hi" ? (c.description_hi || c.descriptionHi || c.description) : c.description) || "";
  const city = c.city || "India";
  const age = c.age ? `${c.age} ${lang === "hi" ? "वर्ष" : "yrs"}` : "";

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
    <article className="case-card group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] hover:border-blue-300/80 flex flex-col transition-all duration-300">
      {/* Photo Header */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={photoUrl}
          alt={patientName}
          fill
          className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />

        {/* Badges Overlay */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 items-center">
          {c.verified && (
            <span className="verified-badge bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
              <span>{t("verified")}</span>
            </span>
          )}
          <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-white/80">
            {categoryIcon()}
            <span className="capitalize">{c.category}</span>
          </span>
        </div>

        {c.status === "funded" && (
          <span className="absolute top-3.5 right-3.5 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("funded")}</span>
          </span>
        )}

        {c.urgency === "high" && c.status === "approved" && (
          <span className="absolute bottom-3.5 right-3.5 bg-rose-600/95 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>{t("high")} Urgency</span>
          </span>
        )}

        <div className="absolute bottom-3.5 left-3.5 text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow-md">
          <MapPin className="w-3.5 h-3.5 text-amber-300" />
          <span>{city}</span>
          {patientName && (
            <>
              <span className="text-white/60">·</span>
              <span className="font-bold">{patientName} {age ? `(${age})` : ""}</span>
            </>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug mb-2 line-clamp-2 group-hover:text-blue-700 transition">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {description}
        </p>

        {/* Progress Tracker */}
        <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-100 mb-4">
          <div className="flex justify-between items-baseline text-xs mb-2">
            <span className="font-black text-emerald-700 text-base tracking-tight">
              {formatINR(amountRaised)}
            </span>
            <span className="text-slate-600 font-bold text-[11px] bg-slate-200/70 px-2 py-0.5 rounded-full">
              {t("raised")} · {progress}%
            </span>
          </div>

          <div className="h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full progress-bar shadow-xs"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-200/60 font-medium">
            <span>Goal: <strong className="text-slate-700">{formatINR(amountNeeded)}</strong></span>
            <span>Remaining: <strong className="text-amber-800">{formatINR(remaining)}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <Link
            href={`/cases/${c.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 text-xs sm:text-sm font-bold border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700 hover:text-blue-800 rounded-xl transition active:scale-98 shadow-2xs"
          >
            <span>{t("viewDetails")}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {c.status === "approved" && (
            <Link
              href={`/cases/${c.id}#donate`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl shadow-xs hover:shadow-md transition active:scale-98"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-950" />
              <span>{t("donateNow")}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}