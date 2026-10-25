"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";
import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  Shield,
  Globe, 
  Menu, 
  X, 
  LogOut,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  User,
  ChevronDown,
  Users
} from "lucide-react";

import { useAuth } from "./AuthContext";
import NotificationBell from "./NotificationBell";
import TopDonorsTicker from "./TopDonorsTicker";

export default function Header() {
  const { lang, setLang } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const signInMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
      {/* Top Most Recent Generous Donors Ticker Strip */}
      <TopDonorsTicker />

      <header suppressHydrationWarning className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3 xl:gap-4">
            {/* 1. Left: Brand & Identity */}
            <Link
              href="/"
              suppressHydrationWarning
              className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
            >
              <span className="relative shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.jpeg"
                  alt="Apni Madad Foundation Logo"
                  width={42}
                  height={42}
                  priority
                  className="w-10 h-10 rounded-full border border-slate-200 shadow-xs group-hover:scale-105 transition duration-200"
                />
                <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-600 text-white p-0.5 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </span>
              </span>
              <span className="flex flex-col justify-center leading-tight">
                <span className="font-black text-base sm:text-lg xl:text-xl text-slate-900 tracking-tight group-hover:text-blue-700 transition truncate">
                  Apni Madad
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-wider uppercase truncate">
                  <span className="hidden xs:inline sm:inline">FOUNDATION · </span>100% DIRECT HELP
                </span>
              </span>
            </Link>

            {/* 2. Center: Navigation Links - Symmetrical, equal, beautifully aligned with identical left & right gaps */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
              {/* 1. Verified Cases */}
              <Link
                href="/cases"
                className={`h-10 whitespace-nowrap inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all ${
                  pathname.startsWith("/cases")
                    ? "text-blue-700 bg-blue-50 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "hi" ? "सत्यापित केस" : "Verified Cases"}</span>
              </Link>

              {/* 2. Woman Help */}
              <Link
                href="/women-help"
                className={`h-10 whitespace-nowrap inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all ${
                  pathname === "/women-help"
                    ? "text-rose-700 bg-rose-50 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
                title={lang === "hi" ? "महिला सहायता (पहचान पूरी तरह गोपनीय व सुरक्षित)" : "Woman Help (100% Safe & Confidential)"}
              >
                <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{lang === "hi" ? "महिला सहायता" : "Woman Help"}</span>
              </Link>

              {/* 3. De-Addiction */}
              <Link
                href="/satta-mukt"
                className={`h-10 whitespace-nowrap inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all ${
                  pathname === "/satta-mukt"
                    ? "text-amber-800 bg-amber-50 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
                title={lang === "hi" ? "सट्टा मुक्त अभियान (100% गोपनीय व सुरक्षित)" : "De-Addiction Support (100% Confidential)"}
              >
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lang === "hi" ? "सट्टा मुक्त अभियान" : "De-Addiction"}</span>
              </Link>

              {/* 4. Need Help */}
              <Link
                href="/submit"
                className={`h-10 whitespace-nowrap inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all ${
                  pathname.startsWith("/submit")
                    ? "text-blue-700 bg-blue-50 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{lang === "hi" ? "मदद चाहिए" : "Need Help"}</span>
              </Link>

              {/* 5. Join NGO */}
              <Link
                href="/join"
                className={`h-10 whitespace-nowrap inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all ${
                  pathname === "/join"
                    ? "text-emerald-800 bg-emerald-50 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
                title={lang === "hi" ? "फाउंडेशन के सम्मानित सदस्य बनें" : "Join NGO / Become Member"}
              >
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "hi" ? "NGO सदस्य बनें" : "Join NGO"}</span>
              </Link>
            </nav>

            {/* 3. Right: Action Controls (Equal h-10 height, vertically aligned) */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
              {/* Notifications: ONLY visible after login */}
              {user && <NotificationBell />}

              {/* Language Switcher: Full pill on sm+ */}
              <div
                className="hidden sm:inline-flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/90 text-xs font-semibold shadow-2xs whitespace-nowrap h-10"
                role="group"
                aria-label="Language selector"
              >
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`inline-flex items-center gap-1 px-3 h-8 rounded-full transition-all text-xs font-bold cursor-pointer ${
                    lang === "en"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-label="Switch to English"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`inline-flex items-center px-3 h-8 rounded-full transition-all text-xs font-bold cursor-pointer ${
                    lang === "hi"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-label="हिंदी में बदलें"
                >
                  <span>हिंदी</span>
                </button>
              </div>

              {/* Mobile Quick Language Toggle (<sm only) */}
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="sm:hidden inline-flex items-center gap-1 px-2.5 h-9 rounded-full bg-slate-100 border border-slate-200 text-xs font-extrabold text-blue-700 cursor-pointer shadow-2xs shrink-0"
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>{lang === "en" ? "EN" : "हिं"}</span>
              </button>

              {/* Case 1: User is Logged In */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center gap-2 pl-2 pr-3.5 h-10 bg-slate-100 hover:bg-slate-200/80 rounded-full text-xs font-semibold text-slate-800 transition shadow-2xs whitespace-nowrap cursor-pointer"
                    aria-label="User menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                      {profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline-block max-w-[90px] truncate font-bold text-slate-800">
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
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
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
                      className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-bold text-slate-700 hover:text-blue-700 shadow-2xs transition whitespace-nowrap cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>{lang === "hi" ? "साइन इन" : "Sign In"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${signInMenuOpen ? "rotate-180" : ""}`} />
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
                            <div className="text-[10px] text-slate-400">{lang === "hi" ? "दान करें व रसीद प्राप्त करें" : "Direct giving & donation receipt"}</div>
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
                    href="/donate"
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 xl:px-5 h-9 sm:h-10 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition active:scale-95 whitespace-nowrap shrink-0"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    <span>{lang === "hi" ? "दान करें" : "Donate"}</span>
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-8 space-y-2.5 shadow-xl animate-modal max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Direct Donate Primary Mobile Action */}
            <Link
              href="/cases"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold text-sm shadow-sm"
            >
              <Heart className="w-4 h-4 fill-white text-white" />
              <span>{lang === "hi" ? "दान करें (सभी केस देखें)" : "Donate (Browse Cases)"}</span>
            </Link>

            {/* Mobile Verified Cases */}
            <Link
              href="/cases"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                pathname.startsWith("/cases") ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
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
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                pathname === "/women-help" ? "bg-rose-50 text-rose-900 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
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
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                pathname === "/satta-mukt" ? "bg-amber-50 text-amber-950 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
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
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                pathname.startsWith("/submit") ? "bg-amber-50 text-amber-900 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>{lang === "hi" ? "मदद चाहिए" : "Need Help"}</span>
            </Link>

            {/* Mobile Join NGO / Become Member */}
            <Link
              href="/join"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                pathname === "/join" ? "bg-emerald-50 text-emerald-950 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{lang === "hi" ? "NGO सदस्य बनें" : "Join NGO / Become Member"}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {lang === "hi" ? "सदस्य" : "Join"}
              </span>
            </Link>

            {/* Mobile Auth / Role links */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={role === "admin" ? "/admin" : "/dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-900 font-bold text-sm"
                  >
                    <span>Dashboard ({profile?.full_name?.split(" ")[0] || "User"})</span>
                    <span className="text-xs uppercase bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                      {role || "user"}
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 text-rose-600 font-semibold hover:bg-rose-50 rounded-xl text-left w-full text-sm cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Link
                    href="/login?role=donor"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 px-2 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs hover:bg-slate-50"
                  >
                    {lang === "hi" ? "दानदाता" : "Donor"}
                  </Link>
                  <Link
                    href="/login?role=beneficiary"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 px-2 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs hover:bg-slate-50"
                  >
                    {lang === "hi" ? "यूजर" : "User"}
                  </Link>
                  <Link
                    href="/login?role=admin"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 px-2 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs hover:bg-slate-50"
                  >
                    {lang === "hi" ? "व्यवस्थापक" : "Admin"}
                  </Link>
                </div>
              )}

              {/* Language Switcher in Mobile Drawer */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 mt-1">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>{lang === "hi" ? "भाषा / Language" : "Language"}</span>
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                      lang === "en" ? "bg-blue-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("hi")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
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