"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { UserRole } from "@/types/database";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const redirectUrl = searchParams.get("redirect");

  // Read URL query parameters
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "beneficiary" || roleParam === "donor" || roleParam === "admin") {
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

  // Role configuration metadata
  const roleConfig = {
    donor: {
      title: "दानदाता पोर्टल",
      titleEn: "Donor Portal",
      desc: "सीधे जरूरतमंदों को दान करें, प्रभाव ट्रैक करें व 80G टैक्स रसीद प्राप्त करें।",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-200",
      accentColor: "border-blue-600",
      btnColor: "bg-blue-600 hover:bg-blue-700",
      icon: Heart,
    },
    beneficiary: {
      title: "सहायता प्रार्थी / यूजर",
      titleEn: "User / Beneficiary",
      desc: "चिकित्सा या शिक्षा सहायता हेतु आवेदन करें, अस्पताल बिल अपलोड करें व स्थिति देखें।",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
      accentColor: "border-emerald-600",
      btnColor: "bg-emerald-600 hover:bg-emerald-700",
      icon: User,
    },
    admin: {
      title: "व्यवस्थापक डेस्क",
      titleEn: "Admin Desk",
      desc: "एनजीओ प्रबंधन, फील्ड सत्यापन, केस अप्रूवल व गोपनीय सहायता पोर्टल।",
      badgeColor: "bg-amber-100 text-amber-950 border-amber-200",
      accentColor: "border-amber-600",
      btnColor: "bg-slate-900 hover:bg-slate-800",
      icon: LayoutDashboard,
    },
  };

  const currentRole = roleConfig[role];

  // Route after login
  const handleRedirect = () => {
    if (redirectUrl && redirectUrl.startsWith("/")) {
      router.push(redirectUrl);
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  // 1. Password Sign In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "कृपया मान्य ईमेल पता दर्ज करें।" });
      return;
    }
    if (!password) {
      setMessage({ type: "error", text: "कृपया अपना पासवर्ड दर्ज करें।" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await signIn(email.trim().toLowerCase(), password);
      if (!res.success) {
        setMessage({ type: "error", text: res.error || "लॉगिन विफल। कृपया ईमेल व पासवर्ड जांचें।" });
        return;
      }

      setMessage({ type: "success", text: "लॉगिन सफल! पोर्टल खोला जा रहा है..." });
      setTimeout(handleRedirect, 600);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "लॉगिन में त्रुटि हुई।" });
    } finally {
      setLoading(false);
    }
  };

  // 2. Sign Up (Create Account)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMessage({ type: "error", text: "कृपया अपना पूरा नाम दर्ज करें।" });
      return;
    }
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "कृपया मान्य ईमेल पता दर्ज करें।" });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।" });
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
        setMessage({ type: "error", text: res.error || "पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।" });
        return;
      }

      setMessage({ type: "success", text: "खाता सफलतापूर्वक बन गया! पोर्टल खोला जा रहा है..." });
      setTimeout(handleRedirect, 700);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "पंजीकरण में त्रुटि हुई।" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "कृपया मान्य ईमेल पता दर्ज करें।" });
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
        setMessage({ type: "error", text: res.error || "सत्यापन कोड भेजने में विफल।" });
        return;
      }

      setOtpStep("code");
      setResendTimer(45);
      setMessage({
        type: "success",
        text: `6-अंकों का सत्यापन कोड ${email} पर भेजा गया है।`,
      });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "कोड भेजने में विफल।" });
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setMessage({ type: "error", text: "कृपया पूरा 6-अंकों का कोड दर्ज करें।" });
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
        setMessage({ type: "error", text: res.error || "अमान्य या समाप्त कोड। पुनः प्रयास करें।" });
        return;
      }

      setMessage({ type: "success", text: "ईमेल सत्यापित! पोर्टल खोला जा रहा है..." });
      setTimeout(handleRedirect, 600);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "सत्यापन विफल।" });
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
            खाते का प्रकार चुनें / Select Role:
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
              <span>दानदाता</span>
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
              <span>यूजर</span>
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
              <span>व्यवस्थापक</span>
            </button>
          </div>
        </div>

        {/* Selected Role Header Info */}
        <div className="mb-6 pb-4 border-b border-slate-100 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border ${currentRole.badgeColor}">
            <currentRole.icon className="w-3.5 h-3.5" />
            <span>{currentRole.title} ({currentRole.titleEn})</span>
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
              साइन इन (Sign In)
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
              नया खाता बनाएं (Sign Up)
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
                ईमेल पता (Email Address)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  पासवर्ड (Password)
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
                  OTP से लॉगिन करें
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
                <span>सत्यापित हो रहा है...</span>
              ) : (
                <>
                  <span>साइन इन करें</span>
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
                    अपना ईमेल दर्ज करें (Enter Email for OTP)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    हम आपके ईमेल पर 6-अंकों का सुरक्षित सत्यापन कोड भेजेंगे।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${currentRole.btnColor}`}
                >
                  {loading ? (
                    <span>कोड भेजा जा रहा है...</span>
                  ) : (
                    <>
                      <span>सत्यापन कोड प्राप्त करें</span>
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
                    ← पासवर्ड से लॉगिन करें
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6-अंकों का कोड दर्ज करें (Enter 6-digit Code)
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
                    कोड भेजा गया: <strong>{email}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${currentRole.btnColor}`}
                >
                  {loading ? (
                    <span>सत्यापित हो रहा है...</span>
                  ) : (
                    <>
                      <span>कोड सत्यापित करें व आगे बढ़ें</span>
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
                    ← ईमेल बदलें
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-blue-600 hover:underline font-bold disabled:text-slate-400"
                  >
                    {resendTimer > 0 ? `पुनः भेजें (${resendTimer}s)` : "पुनः कोड भेजें"}
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
                पूरा नाम (Full Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="आपका पूरा नाम"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ईमेल पता (Email Address)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                मोबाइल नंबर (Mobile / WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210 (वैकल्पिक)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                पासवर्ड बनाएं (Create Password - min 6 chars)
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
                पासवर्ड की पुष्टि (Confirm Password)
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
                <span>खाता बनाया जा रहा है...</span>
              ) : (
                <>
                  <span>नया खाता बनाएं</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Note */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>सुरक्षित 256-बिट एन्क्रिप्टेड प्रमाणीकरण प्रणाली</span>
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
