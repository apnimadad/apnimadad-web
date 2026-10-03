"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Phone, 
  Heart, 
  LayoutDashboard,
  KeyRound
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLanguage } from "@/components/LanguageContext";
import { UserRole } from "@/types/database";

function LoginForm() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const { signIn, signUp, requestOtp, verifyOtp } = useAuth();

  // Role: "donor" | "beneficiary" | "admin"
  const [role, setRole] = useState<UserRole>("donor");
  
  // Tab: "signin" | "signup"
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  
  // Method: "password" | "otp"
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  
  // OTP flow step
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const redirectUrl = searchParams.get("redirect") || searchParams.get("next");

  // Read URL query parameters
  useEffect(() => {
    const roleParam = searchParams.get("role");
    const nextParam = searchParams.get("next");
    if (nextParam === "/admin" || nextParam?.includes("admin")) {
      setRole("admin");
      setAuthTab("signin");
    } else if (roleParam === "beneficiary" || roleParam === "donor" || roleParam === "admin") {
      setRole(roleParam);
      if (roleParam === "admin") {
        setAuthTab("signin");
      }
    }
  }, [searchParams]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const ui = {
    en: {
      selectRole: "Select Account Type",
      donorRole: "Donor",
      beneficiaryRole: "User",
      adminRole: "Admin",
      roles: {
        donor: {
          title: "Donor Portal",
          desc: "Donate directly to verified cases, track your impact, and receive receipts.",
          badgeColor: "bg-blue-100 text-blue-900 border-blue-200",
          btnColor: "bg-blue-600 hover:bg-blue-700",
          icon: Heart,
        },
        beneficiary: {
          title: "User / Beneficiary Portal",
          desc: "Apply for medical or emergency relief, upload hospital bills, and track verification status.",
          badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
          btnColor: "bg-emerald-600 hover:bg-emerald-700",
          icon: User,
        },
        admin: {
          title: "Admin Desk",
          desc: "NGO management, 4-pillar verification, case approvals, and confidential support desk.",
          badgeColor: "bg-amber-100 text-amber-950 border-amber-200",
          btnColor: "bg-slate-900 hover:bg-slate-800",
          icon: LayoutDashboard,
        },
      },
      signInTab: "Sign In",
      signUpTab: "Create Account",
      emailLabel: "Email Address",
      emailPlaceholder: "your.email@example.com",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm Password",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Your full name",
      phoneLabel: "Mobile / WhatsApp",
      phonePlaceholder: "9876543210 (Optional)",
      createPasswordLabel: "Create Password (min 6 chars)",
      signInWithOtp: "Sign in with OTP",
      signInWithPassword: "Sign in with Password",
      signInBtn: "Sign In",
      signingInBtn: "Signing In...",
      signUpBtn: "Create Account",
      creatingAccountBtn: "Creating Account...",
      enterEmailForOtp: "Enter Email for Verification Code",
      otpHelpText: "We will send a 6-digit secure verification code to your email address.",
      getCodeBtn: "Get Verification Code",
      sendingCodeBtn: "Sending Code...",
      enterCodeLabel: "Enter 6-digit Code",
      codeSentTo: "Code sent to",
      verifyCodeBtn: "Verify Code & Proceed",
      verifyingBtn: "Verifying...",
      changeEmailBtn: "Change Email",
      resendCodeBtn: "Resend Code",
      resendIn: "Resend in",
      securityBadge: "Protected with 256-bit encrypted authentication",
      errors: {
        validEmail: "Please enter a valid email address.",
        enterPassword: "Please enter your password.",
        signInFailed: "Sign in failed. Please check your email and password.",
        sendOtpFailed: "Failed to send verification code. Please try again.",
        otpSentSuccess: "A 6-digit verification code has been sent to",
        enterFullCode: "Please enter the complete 6-digit verification code.",
        verifyFailed: "Invalid or expired code. Please try again.",
        verifySuccess: "Email verified! Opening your portal...",
        nameRequired: "Please enter your full name.",
        passMinLength: "Password must be at least 6 characters.",
        passMismatch: "Passwords do not match.",
        signUpFailed: "Registration failed. Please check your details.",
        signUpSuccess: "Account created successfully! Opening your portal...",
      },
    },
    hi: {
      selectRole: "खाते का प्रकार चुनें",
      donorRole: "दानदाता",
      beneficiaryRole: "यूजर",
      adminRole: "व्यवस्थापक",
      roles: {
        donor: {
          title: "दानदाता पोर्टल",
          desc: "सीधे जरूरतमंदों को दान करें, प्रभाव ट्रैक करें व दान रसीद प्राप्त करें।",
          badgeColor: "bg-blue-100 text-blue-900 border-blue-200",
          btnColor: "bg-blue-600 hover:bg-blue-700",
          icon: Heart,
        },
        beneficiary: {
          title: "सहायता प्रार्थी / यूजर पोर्टल",
          desc: "चिकित्सा या शिक्षा सहायता हेतु आवेदन करें, अस्पताल बिल अपलोड करें व स्थिति देखें।",
          badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
          btnColor: "bg-emerald-600 hover:bg-emerald-700",
          icon: User,
        },
        admin: {
          title: "व्यवस्थापक डेस्क",
          desc: "एनजीओ प्रबंधन, 4-स्तंभ सत्यापन, केस अप्रूवल व गोपनीय सहायता पोर्टल।",
          badgeColor: "bg-amber-100 text-amber-950 border-amber-200",
          btnColor: "bg-slate-900 hover:bg-slate-800",
          icon: LayoutDashboard,
        },
      },
      signInTab: "साइन इन करें",
      signUpTab: "नया खाता बनाएं",
      emailLabel: "ईमेल पता",
      emailPlaceholder: "your.email@example.com",
      passwordLabel: "पासवर्ड",
      confirmPasswordLabel: "पासवर्ड की पुष्टि",
      fullNameLabel: "पूरा नाम",
      fullNamePlaceholder: "आपका पूरा नाम",
      phoneLabel: "मोबाइल नंबर / WhatsApp",
      phonePlaceholder: "9876543210 (वैकल्पिक)",
      createPasswordLabel: "पासवर्ड बनाएं (कम से कम 6 अक्षर)",
      signInWithOtp: "OTP से लॉगिन करें",
      signInWithPassword: "पासवर्ड से लॉगिन करें",
      signInBtn: "साइन इन करें",
      signingInBtn: "सत्यापित हो रहा है...",
      signUpBtn: "नया खाता बनाएं",
      creatingAccountBtn: "खाता बनाया जा रहा है...",
      enterEmailForOtp: "OTP हेतु अपना ईमेल दर्ज करें",
      otpHelpText: "हम आपके ईमेल पर 6-अंकों का सुरक्षित सत्यापन कोड भेजेंगे।",
      getCodeBtn: "सत्यापन कोड प्राप्त करें",
      sendingCodeBtn: "कोड भेजा जा रहा है...",
      enterCodeLabel: "6-अंकों का कोड दर्ज करें",
      codeSentTo: "कोड भेजा गया",
      verifyCodeBtn: "कोड सत्यापित करें व आगे बढ़ें",
      verifyingBtn: "सत्यापित हो रहा है...",
      changeEmailBtn: "ईमेल बदलें",
      resendCodeBtn: "पुनः कोड भेजें",
      resendIn: "पुनः भेजें",
      securityBadge: "सुरक्षित 256-बिट एन्क्रिप्टेड प्रमाणीकरण प्रणाली",
      errors: {
        validEmail: "कृपया मान्य ईमेल पता दर्ज करें।",
        enterPassword: "कृपया अपना पासवर्ड दर्ज करें।",
        signInFailed: "लॉगिन विफल। कृपया ईमेल व पासवर्ड जांचें।",
        sendOtpFailed: "सत्यापन कोड भेजने में विफल।",
        otpSentSuccess: "6-अंकों का सत्यापन कोड भेजा गया है:",
        enterFullCode: "कृपया पूरा 6-अंकों का कोड दर्ज करें।",
        verifyFailed: "अमान्य या समाप्त कोड। पुनः प्रयास करें।",
        verifySuccess: "ईमेल सत्यापित! पोर्टल खोला जा रहा है...",
        nameRequired: "कृपया अपना पूरा नाम दर्ज करें।",
        passMinLength: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
        passMismatch: "दोनों पासवर्ड मेल नहीं खाते।",
        signUpFailed: "पंजीकरण विफल। कृपया विवरण जांचें।",
        signUpSuccess: "खाता सफलतापूर्वक बन गया! पोर्टल खोला जा रहा है...",
      },
    },
  };

  const t = lang === "hi" ? ui.hi : ui.en;
  const currentRole = t.roles[role];

  // Route after login
  const handleRedirect = (loggedInRole?: UserRole) => {
    const effectiveRole = loggedInRole || role;
    if (effectiveRole === "admin") {
      window.location.href = "/admin";
      return;
    }

    if (redirectUrl && redirectUrl.startsWith("/") && redirectUrl !== "/admin") {
      window.location.href = redirectUrl;
      return;
    }

    window.location.href = "/dashboard";
  };

  // 1. Password Sign In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: t.errors.validEmail });
      return;
    }
    if (!password) {
      setMessage({ type: "error", text: t.errors.enterPassword });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await signIn(email.trim().toLowerCase(), password);
      if (!res.success) {
        setMessage({ type: "error", text: res.error || t.errors.signInFailed });
        return;
      }

      handleRedirect(res.role);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t.errors.signInFailed });
    } finally {
      setLoading(false);
    }
  };

  // 2. Password Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMessage({ type: "error", text: t.errors.nameRequired });
      return;
    }
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: t.errors.validEmail });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: t.errors.passMinLength });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: t.errors.passMismatch });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await signUp({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || t.errors.signUpFailed });
        return;
      }

      setMessage({ type: "success", text: t.errors.signUpSuccess });
      setTimeout(handleRedirect, 800);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t.errors.signUpFailed });
    } finally {
      setLoading(false);
    }
  };

  // 3. Request Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: t.errors.validEmail });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await requestOtp({
        email: email.trim().toLowerCase(),
        intent: authTab === "signup" ? "signup" : "login",
        role,
        fullName: fullName.trim() || email.split("@")[0],
        phone: phone.trim() || undefined,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || t.errors.sendOtpFailed });
        return;
      }

      setOtpStep("code");
      setResendTimer(45);
      setMessage({
        type: "success",
        text: `${t.errors.otpSentSuccess} ${email}`,
      });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t.errors.sendOtpFailed });
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setMessage({ type: "error", text: t.errors.enterFullCode });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode.trim(),
        intent: authTab === "signup" ? "signup" : "login",
        role,
        fullName: fullName.trim() || email.split("@")[0],
        phone: phone.trim() || undefined,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || t.errors.verifyFailed });
        return;
      }

      setMessage({ type: "success", text: t.errors.verifySuccess });
      setTimeout(() => handleRedirect(res.role), 600);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t.errors.verifyFailed });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50/60">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
        
        {/* Role Selection Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t.selectRole}
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRole("donor");
                setMessage(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === "donor"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>{t.donorRole}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("beneficiary");
                setMessage(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === "beneficiary"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.beneficiaryRole}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("admin");
                setAuthTab("signin");
                setMessage(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === "admin"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t.adminRole}</span>
            </button>
          </div>
        </div>

        {/* Selected Role Header Info */}
        <div className="mb-6 pb-4 border-b border-slate-100 text-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border ${currentRole.badgeColor}`}>
            <currentRole.icon className="w-3.5 h-3.5" />
            <span>{currentRole.title}</span>
          </div>
          <p className="text-xs text-slate-500">
            {currentRole.desc}
          </p>
        </div>

        {/* Sign In vs Sign Up Tab Toggle (For Donor and Beneficiary) */}
        {role !== "admin" && (
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthTab("signin");
                setOtpStep("email");
                setMessage(null);
              }}
              className={`flex-1 pb-2.5 text-sm font-bold text-center border-b-2 transition ${
                authTab === "signin"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.signInTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab("signup");
                setOtpStep("email");
                setMessage(null);
              }}
              className={`flex-1 pb-2.5 text-sm font-bold text-center border-b-2 transition ${
                authTab === "signup"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.signUpTab}
            </button>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl mb-5 text-xs flex items-start gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-semibold leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* FORM SECTION 1: Standard Password Sign In */}
        {authTab === "signin" && authMethod === "password" && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.emailLabel}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {t.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("otp");
                    setOtpStep("email");
                    setMessage(null);
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  {t.signInWithOtp}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${currentRole.btnColor}`}
            >
              {loading ? (
                <span>{t.signingInBtn}</span>
              ) : (
                <>
                  <span>{t.signInBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORM SECTION 2: Email OTP Login or Verification */}
        {authMethod === "otp" && (
          <div>
            {otpStep === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.enterEmailForOtp}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t.otpHelpText}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${currentRole.btnColor}`}
                >
                  {loading ? (
                    <span>{t.sendingCodeBtn}</span>
                  ) : (
                    <>
                      <span>{t.getCodeBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("password");
                      setMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    ← {t.signInWithPassword}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.enterCodeLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    {t.codeSentTo}: <strong>{email}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${currentRole.btnColor}`}
                >
                  {loading ? (
                    <span>{t.verifyingBtn}</span>
                  ) : (
                    <>
                      <span>{t.verifyCodeBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpStep("email")}
                    className="text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    ← {t.changeEmailBtn}
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-blue-600 hover:underline font-bold disabled:text-slate-400"
                  >
                    {resendTimer > 0 ? `${t.resendIn} (${resendTimer}s)` : t.resendCodeBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* FORM SECTION 3: Create Account (Sign Up) */}
        {authTab === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.fullNameLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.emailLabel}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phoneLabel}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.createPasswordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.confirmPasswordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${currentRole.btnColor}`}
            >
              {loading ? (
                <span>{t.creatingAccountBtn}</span>
              ) : (
                <>
                  <span>{t.signUpBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Note */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.securityBadge}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
