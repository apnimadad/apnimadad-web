"use client";

import { useState, useMemo } from "react";
import CaseCard from "@/components/CaseCard";
import { mockCases, Category, AgeGroup } from "@/lib/mock-data";
import { useLanguage } from "@/components/LanguageContext";
import TopDonorsTicker from "@/components/TopDonorsTicker";
import { 
  Search, 
  Filter, 
  HeartPulse, 
  GraduationCap, 
  Car, 
  Accessibility, 
  Users, 
  Sparkles,
  RotateCcw,
  CheckCircle
} from "lucide-react";

export default function CasesPage() {
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "all">("all");
  const [status, setStatus] = useState<"all" | "approved" | "funded">("approved");
  const [sort, setSort] = useState<"urgency" | "recent" | "remaining">("urgency");

  const categories: { key: Category | "all"; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: t("all"), icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: "medical", label: t("medical"), icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { key: "education", label: t("education"), icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { key: "accident", label: t("accident"), icon: <Car className="w-3.5 h-3.5" /> },
    { key: "disability", label: t("disability"), icon: <Accessibility className="w-3.5 h-3.5" /> },
    { key: "family", label: t("family"), icon: <Users className="w-3.5 h-3.5" /> },
  ];

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setAgeGroup("all");
    setStatus("all");
    setSort("urgency");
  };

  const filtered = useMemo(() => {
    let list = mockCases.filter((c) => c.verified || c.status === "funded");

    if (status !== "all") list = list.filter((c) => c.status === status);
    if (category !== "all") list = list.filter((c) => c.category === category);
    if (ageGroup !== "all") list = list.filter((c) => c.ageGroup === ageGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.titleHi.includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (sort === "urgency") {
      const order = { high: 0, medium: 1, low: 2 };
      list = [...list].sort((a, b) => order[a.urgency] - order[b.urgency]);
    } else if (sort === "recent") {
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      list = [...list].sort(
        (a, b) => b.amountNeeded - b.amountRaised - (a.amountNeeded - a.amountRaised)
      );
    }

    return list;
  }, [search, category, ageGroup, status, sort]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <TopDonorsTicker />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header Title Section */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-3 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>100% Direct Beneficiary Transfer</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5">
            {t("verifiedCases")}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {lang === "hi"
              ? "प्रत्येक केस को हमारे फील्ड ऑफिसरों द्वारा सत्यापित किया गया है। अपनी इच्छा से किसी भी लाभार्थी के खाते में सीधे यूपीआई से दान करें।"
              : "Every case is physically audited and verified. Send help directly to the beneficiary's UPI or hospital bank account with ₹0 platform commission."}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 mb-8 shadow-xs space-y-4">
          {/* Top Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition"
              />
            </div>

            {/* Age Group */}
            <div className="lg:col-span-3">
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup | "all")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition cursor-pointer"
              >
                <option value="all">Age: All Groups</option>
                <option value="child">{t("child")} (&lt; 18 yrs)</option>
                <option value="adult">{t("adult")} (18 - 59 yrs)</option>
                <option value="elderly">{t("elderly")} (60+ yrs)</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="lg:col-span-4">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition cursor-pointer"
                >
                  <option value="urgency">Sort by: Highest Urgency</option>
                  <option value="recent">Sort by: Recently Added</option>
                  <option value="remaining">Sort by: Most Remaining Needed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Pill Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition shrink-0 ${
                    category === cat.key
                      ? "bg-blue-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Status Segmented Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs">
              {(["approved", "funded", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 rounded-full font-bold transition ${
                    status === s
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s === "approved" ? t("active") : s === "funded" ? t("funded") : t("all")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter & Active Filter State */}
        <div className="flex items-center justify-between mb-6 text-xs sm:text-sm text-slate-600 font-medium">
          <div>
            Showing <strong className="text-slate-900">{filtered.length}</strong> verified cases
          </div>
          {(search || category !== "all" || ageGroup !== "all" || status !== "approved") && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Case Cards Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{t("noCases")}</h3>
            <p className="text-xs text-slate-500">
              No verified cases match your current filter parameters. Try clearing the search or category filter.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-800 text-white text-xs font-bold rounded-xl"
            >
              Show All Cases
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}