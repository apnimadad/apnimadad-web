"use client";

import { formatINR } from "@/lib/format";
import { useLanguage } from "./LanguageContext";
import { useSiteSettings } from "./SiteSettingsContext";
import Image from "next/image";
import { Sparkles, Heart } from "lucide-react";
import { usePathname } from "next/navigation";

export default function TopDonorsTicker() {
  const pathname = usePathname();
  const { lang, t } = useLanguage();
  const { donors: liveDonors } = useSiteSettings();

  // Hide on admin panel to keep workspace clean
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Duplicate for seamless infinite loop marquee
  const donors = liveDonors.length > 0 ? [...liveDonors, ...liveDonors, ...liveDonors] : [];

  return (
    <section 
      suppressHydrationWarning 
      className="relative bg-gradient-to-r from-slate-950 via-[#071328] to-slate-950 text-white py-2.5 sm:py-3 overflow-hidden border-b border-amber-500/20 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h2 className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("topDonors")}</span>
            <span className="text-[10px] text-slate-400 font-semibold normal-case hidden sm:inline border-l border-white/20 pl-2">
              {lang === "hi" ? "सीधे बैंक/यूपीआई प्रत्यक्ष समर्थक" : "Live Direct Beneficiary Supporters"}
            </span>
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 hidden md:inline-flex items-center gap-1 font-medium">
          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
          <span>{lang === "hi" ? "100% प्रत्यक्ष दान — कोई बिचौलिया नहीं" : "100% Direct Aid — Zero Middlemen"}</span>
        </span>
      </div>

      {/* Fade masks on left & right for smooth infinite scrolling */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap gap-3 sm:gap-5 py-1">
          {donors.map((d, i) => (
            <div
              key={`${d.id}-${i}`}
              className="inline-flex items-center gap-2.5 bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md rounded-full pl-1.5 pr-4 py-1.5 border border-white/15 hover:border-amber-400/50 transition-all duration-200 hover:scale-105 shadow-xs"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 shadow-xs">
                <Image
                  src={d.photoUrl}
                  alt={d.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="text-left leading-tight">
                <div className="font-bold text-xs text-white tracking-tight">{d.name}</div>
                <div className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                  <span>{formatINR(d.amount)}</span>
                  <span className="text-slate-400 font-normal text-[10px] truncate max-w-[130px]">
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