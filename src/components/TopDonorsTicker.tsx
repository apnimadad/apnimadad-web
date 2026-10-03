"use client";

import { formatINR } from "@/lib/mock-data";
import { useLanguage } from "./LanguageContext";
import { useSiteSettings } from "./SiteSettingsContext";
import Image from "next/image";
import { Sparkles, Heart } from "lucide-react";

export default function TopDonorsTicker() {
  const { lang, t } = useLanguage();
  const { donors: liveDonors } = useSiteSettings();
  // Duplicate for seamless infinite loop marquee
  const donors = liveDonors.length > 0 ? [...liveDonors, ...liveDonors, ...liveDonors] : [];

  return (
    <section className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-3.5 overflow-hidden border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("topDonors")}</span>
            <span className="text-[11px] text-slate-400 font-normal lowercase hidden sm:inline">
              ({lang === "hi" ? "सीधे बैंक/यूपीआई सहायता" : "direct live supporters"})
            </span>
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 hidden md:inline-flex items-center gap-1">
          <Heart className="w-3 h-3 text-red-400 fill-red-400" />
          <span>{lang === "hi" ? "प्रत्यक्ष सहायता से जीवन बदलें" : "Direct help changes lives"}</span>
        </span>
      </div>

      {/* Fade masks on left & right for smooth infinite scrolling */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap gap-4 sm:gap-6 py-1">
          {donors.map((d, i) => (
            <div
              key={`${d.id}-${i}`}
              className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full pl-1.5 pr-4 py-1.5 border border-white/15 transition-transform hover:scale-105"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shrink-0">
                <Image
                  src={d.photoUrl}
                  alt={d.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="text-left leading-tight">
                <div className="font-semibold text-xs text-white">{d.name}</div>
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <span>{formatINR(d.amount)}</span>
                  <span className="text-slate-400 font-normal truncate max-w-[120px]">
                    · {d.caseTitle}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}