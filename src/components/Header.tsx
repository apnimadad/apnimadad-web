"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";
import { useState, useEffect } from "react";
import { 
  Home,
  ShieldCheck, 
  Globe, 
  Menu, 
  X, 
  LogOut,
  Heart,
  HeartHandshake,
  LayoutDashboard
} from "lucide-react";

import { useAuth } from "./AuthContext";
import { useSiteSettings } from "./SiteSettingsContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { lang, setLang } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const announcement = settings?.announcement;

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top micro-announcement banner */}
      {announcement?.enabled && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white text-xs py-2 px-4">
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
            <div className="hidden sm:flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Verified
              </span>
              <span>NGO Reg: IV-190300183</span>
            </div>
          </div>
        </div>
      )}

      <header suppressHydrationWarning className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Image
                  src="/logo.jpeg"
                  alt="Apni Madad Foundation Logo"
                  width={46}
                  height={46}
                  className="rounded-full border-2 border-amber-400 shadow-sm group-hover:scale-105 transition duration-200"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-3 h-3" />
                </span>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-slate-900 leading-tight tracking-tight group-hover:text-blue-700 transition">
                  Apni Madad
                </div>
                <div className="text-[10px] sm:text-xs text-amber-600 font-bold tracking-wider uppercase">
                  FOUNDATION · अपनी मदद
                </div>
              </div>
            </Link>

            {/* Desktop Navigation: Unique & Amazing Custom Styled Buttons */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-2.5">
              {/* 1. Home Button */}
              <Link
                href="/"
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  pathname === "/"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:text-blue-900 hover:bg-slate-100"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{lang === "hi" ? "होम" : "Home"}</span>
              </Link>

              {/* 2. Verified Cases Button with Live Pulse */}
              <Link
                href="/cases"
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-2 border ${
                  pathname.startsWith("/cases")
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300 shadow-2xs font-extrabold"
                    : "bg-white/90 hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-950 border-slate-200/90 hover:border-emerald-200"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{lang === "hi" ? "सत्यापित केस" : "Verified Cases"}</span>
              </Link>

              {/* 3. Need Help Button with Warm Empathetic Styling */}
              <Link
                href="/submit"
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 border ${
                  pathname.startsWith("/submit")
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-xs"
                    : "bg-gradient-to-r from-amber-50/90 to-orange-50/90 hover:from-amber-100 hover:to-orange-100 text-amber-950 border-amber-300/80 shadow-2xs hover:scale-[1.02] active:scale-98"
                }`}
              >
                <HeartHandshake className={`w-4 h-4 ${pathname.startsWith("/submit") ? "text-white" : "text-amber-700"}`} />
                <span>{lang === "hi" ? "मदद चाहिए" : "Need Help"}</span>
              </Link>

              {/* 4. Donor Button with Philanthropy Jewel Gradient */}
              <Link
                href={user && role === "donor" ? "/dashboard" : "/login?role=donor"}
                className="px-4 py-2 text-xs sm:text-sm font-extrabold rounded-full transition-all duration-200 flex items-center gap-1.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 hover:from-blue-800 hover:to-indigo-700 text-white shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 border border-indigo-400/30"
              >
                <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                <span>{lang === "hi" ? "दानदाता" : "Donor"}</span>
                {user && role === "donor" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-blue-900" title="Donor Active" />
                )}
              </Link>

              {/* 5. Admin Button with Security Badge Pill */}
              <Link
                href={user && role === "admin" ? "/admin" : "/login?role=admin"}
                className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 border ${
                  pathname.startsWith("/admin")
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950 border-slate-200 shadow-2xs"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === "hi" ? "व्यवस्थापक" : "Admin"}</span>
                {user && role === "admin" && (
                  <span className="bg-amber-400 text-amber-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    Desk
                  </span>
                )}
              </Link>
            </nav>

            {/* Right Side Controls: Notifications (only after login) | Language | User Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications: ONLY visible after login for donor, user/beneficiary, or admin */}
              {user && <NotificationBell />}

              {/* Language Switcher Pill */}
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold border border-slate-300/80 bg-white/90 hover:bg-slate-100 rounded-full text-slate-700 hover:text-slate-900 transition shadow-2xs group"
                title="Change Language / भाषा बदलें"
                aria-label="Toggle language"
              >
                <Globe className="w-4 h-4 text-blue-700 group-hover:rotate-45 transition-transform duration-300" />
                <span>{lang === "en" ? "हिंदी" : "English"}</span>
              </button>

              {/* User Session Status & Sign Out (if logged in) */}
              {user && (
                <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                  <Link
                    href={role === "admin" ? "/admin" : "/dashboard"}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 hover:bg-slate-200/90 text-slate-800 rounded-full text-xs font-bold transition shadow-2xs"
                    title={`Logged in as ${profile?.full_name || user.email}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                    <span className="max-w-[85px] truncate">
                      {profile?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full ${
                      role === "admin"
                        ? "bg-amber-200 text-amber-950"
                        : role === "beneficiary"
                        ? "bg-emerald-200 text-emerald-950"
                        : "bg-blue-200 text-blue-950"
                    }`}>
                      {role === "admin" ? "Admin" : role === "beneficiary" ? "User" : "Donor"}
                    </span>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
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
          <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-modal">
            {/* Mobile Home */}
            <Link
              href="/"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold transition ${
                pathname === "/" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{lang === "hi" ? "होम" : "Home"}</span>
            </Link>

            {/* Mobile Verified Cases */}
            <Link
              href="/cases"
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition ${
                pathname.startsWith("/cases") ? "bg-emerald-50 text-emerald-900 font-bold" : "text-slate-800 hover:bg-slate-50"
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

            {/* Mobile Need Help */}
            <Link
              href="/submit"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold transition ${
                pathname.startsWith("/submit") ? "bg-amber-100 text-amber-950 font-bold" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>{lang === "hi" ? "मदद चाहिए" : "Need Help"}</span>
            </Link>

            {/* Mobile Donor */}
            <Link
              href={user && role === "donor" ? "/dashboard" : "/login?role=donor"}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs"
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                <span>{lang === "hi" ? "दानदाता पोर्टल" : "Donor Portal"}</span>
              </span>
              {user && role === "donor" && (
                <span className="bg-emerald-400 text-emerald-950 text-xs px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </Link>

            {/* Mobile Admin */}
            <Link
              href={user && role === "admin" ? "/admin" : "/login?role=admin"}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold bg-slate-100 text-slate-800"
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
                <span>{lang === "hi" ? "व्यवस्थापक" : "Admin"}</span>
              </span>
              {user && role === "admin" && (
                <span className="bg-amber-400 text-amber-950 text-xs px-2 py-0.5 rounded-full font-bold">
                  Desk
                </span>
              )}
            </Link>

            {/* Mobile Logged-in Options */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={role === "admin" ? "/admin" : "/dashboard"}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 text-blue-900 font-bold"
                  >
                    <span>My Dashboard ({profile?.full_name?.split(" ")[0] || "User"})</span>
                    <span className="text-xs uppercase bg-blue-200 px-2 py-0.5 rounded-full">
                      {role || "user"}
                    </span>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-700 font-medium hover:bg-rose-50 text-left w-full"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : null}

              {/* Language Switcher in Mobile Drawer */}
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-700" />
                  <span>Language / भाषा</span>
                </span>
                <span className="font-bold text-blue-800">{lang === "en" ? "हिंदी" : "English"}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}