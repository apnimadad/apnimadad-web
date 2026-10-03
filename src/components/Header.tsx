"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";
import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  Globe, 
  Menu, 
  X, 
  LogOut,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  User,
  ChevronDown
} from "lucide-react";

import { useAuth } from "./AuthContext";
import { useSiteSettings } from "./SiteSettingsContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { lang, setLang } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const signInMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const announcement = settings?.announcement;

  // Close menus on outside click or route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSignInMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (signInMenuRef.current && !signInMenuRef.current.contains(event.target as Node)) {
        setSignInMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top micro-announcement banner */}
      {announcement?.enabled && (
        <div suppressHydrationWarning className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white text-xs py-2 px-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate">
                {announcement.message ||
                  (lang === "hi"
                    ? "100% प्रत्यक्ष सहायता: कोई कमीशन नहीं, कोई बिचौलिया नहीं। सीधे लाभार्थी के खाते में।"
                    : "100% Direct Help. Zero Platform Fee, No Middlemen. Direct to Beneficiary UPI.")}
              </span>
              {announcement.linkText && announcement.linkUrl && (
                <Link
                  href={announcement.linkUrl}
                  className="hidden sm:inline-block ml-1 underline text-amber-300 hover:text-white font-bold"
                >
                  {announcement.linkText} →
                </Link>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-4 text-slate-300 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Verified
              </span>
              <span>NGO Reg: IV-190300183</span>
            </div>
          </div>
        </div>
      )}

      <header suppressHydrationWarning className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3">
            {/* Logo & Foundation Identity */}
            <Link
              href="/"
              suppressHydrationWarning
              className="flex items-center gap-3 group shrink-0"
            >
              <div className="relative shrink-0">
                <Image
                  src="/logo.jpeg"
                  alt="Apni Madad Foundation Logo"
                  width={46}
                  height={46}
                  priority
                  className="rounded-full border border-slate-200 shadow-xs group-hover:scale-105 transition duration-200"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-3 h-3" />
                </span>
              </div>
              <div className="block leading-tight">
                <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight group-hover:text-blue-700 transition">
                  Apni Madad
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">
                  FOUNDATION · 100% DIRECT HELP
                </div>
              </div>
            </Link>

            {/* Desktop Navigation: Evenly spaced, single-line, refined pills */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* 1. Verified Cases */}
              <Link
                href="/cases"
                className={`whitespace-nowrap inline-flex items-center gap-2 px-3 xl:px-3.5 py-2 text-xs xl:text-sm font-semibold rounded-full transition-all ${
                  pathname.startsWith("/cases")
                    ? "text-blue-700 bg-blue-50 font-bold shadow-2xs"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{lang === "hi" ? "सत्यापित केस" : "Verified Cases"}</span>
              </Link>

              {/* 2. Woman Help (Safe & Secure) */}
              <Link
                href="/women-help"
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-2 text-xs xl:text-sm font-semibold rounded-full transition-all ${
                  pathname === "/women-help"
                    ? "text-rose-900 bg-rose-50 font-bold ring-1 ring-rose-200"
                    : "text-slate-700 hover:text-rose-900 hover:bg-rose-50/60"
                }`}
                title={lang === "hi" ? "महिला सहायता (पहचान पूरी तरह गोपनीय)" : "Woman Help (Confidential & Safe)"}
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>{lang === "hi" ? "महिला सहायता" : "Woman Help"}</span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded-full border border-rose-200/60 leading-none">
                  {lang === "hi" ? "सुरक्षित" : "Safe"}
                </span>
              </Link>

              {/* 3. De-Addiction / Satta Mukt (Secure) */}
              <Link
                href="/satta-mukt"
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-2 text-xs xl:text-sm font-semibold rounded-full transition-all ${
                  pathname === "/satta-mukt"
                    ? "text-amber-950 bg-amber-50 font-bold ring-1 ring-amber-200"
                    : "text-slate-700 hover:text-amber-950 hover:bg-amber-50/60"
                }`}
                title={lang === "hi" ? "सट्टा मुक्त अभियान (100% गोपनीय व सुरक्षित)" : "De-Addiction Support (100% Confidential)"}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === "hi" ? "सट्टा मुक्त अभियान" : "De-Addiction Support"}</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-full border border-amber-200/60 leading-none">
                  {lang === "hi" ? "गोपनीय" : "Secure"}
                </span>
              </Link>

              {/* 4. Need Help */}
              <Link
                href="/submit"
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-2 text-xs xl:text-sm font-semibold rounded-full transition-all ${
                  pathname.startsWith("/submit")
                    ? "text-amber-800 bg-amber-50 font-bold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-amber-600" />
                <span>{lang === "hi" ? "मदद चाहिए" : "Need Help"}</span>
              </Link>
            </nav>

            {/* Right Side: Evenly aligned action buttons */}
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              {/* Notifications: ONLY visible after login */}
              {user && <NotificationBell />}

              {/* Language Switcher: Modern segmented pill matching button heights */}
              <div
                className="inline-flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/90 text-xs font-semibold shadow-2xs whitespace-nowrap h-9"
                role="group"
                aria-label="Language selector"
              >
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`inline-flex items-center gap-1 px-3 h-7 rounded-full transition-all text-xs font-bold leading-none ${
                    lang === "en"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-label="Switch to English"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`inline-flex items-center px-3 h-7 rounded-full transition-all text-xs font-bold leading-none ${
                    lang === "hi"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-label="हिंदी में बदलें"
                >
                  <span>हिंदी</span>
                </button>
              </div>

              {/* Case 1: User is Logged In */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center gap-2 pl-2 pr-3 h-9 bg-slate-100 hover:bg-slate-200/80 rounded-full text-xs font-semibold text-slate-800 transition shadow-2xs whitespace-nowrap"
                    aria-label="User menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                      {profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline-block max-w-[100px] truncate font-bold text-slate-800">
                      {profile?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full ${
                      role === "admin"
                        ? "bg-amber-200 text-amber-950"
                        : role === "beneficiary"
                        ? "bg-emerald-200 text-emerald-950"
                        : "bg-blue-200 text-blue-950"
                    }`}>
                      {role === "admin" ? "Admin" : role === "beneficiary" ? "User" : "Donor"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-modal">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {profile?.full_name || "Apni Madad User"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href={role === "admin" ? "/admin" : "/dashboard"}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-500" />
                          <span>{role === "admin" ? "Admin Desk" : "My Dashboard"}</span>
                        </Link>

                        <Link
                          href="/submit"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HeartHandshake className="w-4 h-4 text-slate-500" />
                          <span>Submit a New Case</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Case 2: Guest (Not Logged In) */
                <div className="flex items-center gap-2">
                  {/* Production Sign In Dropdown */}
                  <div className="relative" ref={signInMenuRef}>
                    <button
                      type="button"
                      onClick={() => setSignInMenuOpen(!signInMenuOpen)}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-bold text-slate-700 hover:text-blue-700 shadow-2xs transition whitespace-nowrap"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{lang === "hi" ? "साइन इन" : "Sign In"}</span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${signInMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {signInMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-modal">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "hi" ? "खाता प्रकार चुनें" : "Select Account Type"}
                        </div>
                        <Link
                          href="/login?role=donor"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                          onClick={() => setSignInMenuOpen(false)}
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          <div className="leading-tight">
                            <div className="font-bold">{lang === "hi" ? "दानदाता पोर्टल" : "Donor Portal"}</div>
                            <div className="text-[10px] text-slate-400">{lang === "hi" ? "दान करें व रसीद प्राप्त करें" : "Direct giving & 80G tax receipt"}</div>
                          </div>
                        </Link>
                        <Link
                          href="/login?role=beneficiary"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                          onClick={() => setSignInMenuOpen(false)}
                        >
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <div className="leading-tight">
                            <div className="font-bold">{lang === "hi" ? "सहायता प्रार्थी" : "Beneficiary / User"}</div>
                            <div className="text-[10px] text-slate-400">{lang === "hi" ? "केस आवेदन व सहायता ट्रैक करें" : "Submit case & track progress"}</div>
                          </div>
                        </Link>
                        <div className="border-t border-slate-100 my-1" />
                        <Link
                          href="/login?role=admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                          onClick={() => setSignInMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
                          <div className="leading-tight">
                            <div className="font-bold">{lang === "hi" ? "व्यवस्थापक डेस्क" : "Admin Desk"}</div>
                            <div className="text-[10px] text-slate-400">{lang === "hi" ? "सत्यापन एवं संचालन" : "Verification & management"}</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Primary Donate CTA Button */}
                  <Link
                    href="/cases"
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition active:scale-95 whitespace-nowrap"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    <span>{lang === "hi" ? "दान करें" : "Donate"}</span>
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Open menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-modal">
            {/* Mobile Verified Cases */}
            <Link
              href="/cases"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname.startsWith("/cases") ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === "hi" ? "सत्यापित केस" : "Verified Cases"}</span>
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </Link>

            {/* Mobile Woman Help */}
            <Link
              href="/women-help"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname === "/women-help" ? "bg-rose-50 text-rose-900 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>{lang === "hi" ? "महिला सहायता" : "Woman Help"}</span>
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full border border-rose-200/60">
                {lang === "hi" ? "सुरक्षित" : "Safe"}
              </span>
            </Link>

            {/* Mobile Satta Mukt */}
            <Link
              href="/satta-mukt"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname === "/satta-mukt" ? "bg-amber-50 text-amber-950 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{lang === "hi" ? "सट्टा मुक्त अभियान" : "De-Addiction Support"}</span>
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/60">
                {lang === "hi" ? "गोपनीय" : "Secure"}
              </span>
            </Link>

            {/* Mobile Need Help */}
            <Link
              href="/submit"
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname.startsWith("/submit") ? "bg-amber-50 text-amber-900 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>{lang === "hi" ? "मदद चाहिए" : "Need Help"}</span>
            </Link>

            {/* Mobile Auth / Role links */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={role === "admin" ? "/admin" : "/dashboard"}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-900 font-bold text-sm"
                  >
                    <span>Dashboard ({profile?.full_name?.split(" ")[0] || "User"})</span>
                    <span className="text-xs uppercase bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                      {role || "user"}
                    </span>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3.5 py-2 text-rose-600 font-semibold hover:bg-rose-50 rounded-xl text-left w-full text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Link
                    href="/login?role=donor"
                    className="py-2.5 px-2 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs hover:bg-slate-50"
                  >
                    {lang === "hi" ? "दानदाता" : "Donor"}
                  </Link>
                  <Link
                    href="/login?role=beneficiary"
                    className="py-2.5 px-2 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs hover:bg-slate-50"
                  >
                    {lang === "hi" ? "यूजर" : "User"}
                  </Link>
                  <Link
                    href="/login?role=admin"
                    className="py-2.5 px-2 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs hover:bg-slate-50"
                  >
                    {lang === "hi" ? "व्यवस्थापक" : "Admin"}
                  </Link>
                </div>
              )}

              {/* Language Switcher in Mobile Drawer */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>{lang === "hi" ? "भाषा / Language" : "Language"}</span>
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      lang === "en" ? "bg-blue-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("hi")}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      lang === "hi" ? "bg-blue-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}