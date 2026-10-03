"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Phone,
  RotateCcw,
  Check,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { UserRole } from "@/types/database";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, requestOtp, verifyOtp, requestWhatsApp, verifyWhatsApp, loginAsDemo } = useAuth();

  // Mode: "signup_otp" (OTP Register) | "login_otp" (OTP Login) | "password" (Password login)
  const [authMode, setAuthMode] = useState<"signup_otp" | "login_otp" | "password">("signup_otp");
  const [step, setStep] = useState<"form" | "otp" | "whatsapp_confirm">("form");
  const [verifyChannel, setVerifyChannel] = useState<"whatsapp" | "email">("email");

  // Form states
  const [role, setRole] = useState<UserRole>("donor");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [activeDemoOtp, setActiveDemoOtp] = useState<string | null>(null);

  // WhatsApp verification info
  const [waData, setWaData] = useState<{
    code: string;
    waUrl: string;
    helpline: string;
    formattedPhone: string;
  } | null>(null);

  // Status & timers
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timer, setTimer] = useState(0);

  const redirectUrl = searchParams.get("redirect");

  // Read URL query parameters to auto-configure role and mode
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "beneficiary" || roleParam === "donor" || roleParam === "admin") {
      setRole(roleParam);
    }
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup_otp" || modeParam === "login_otp" || modeParam === "password") {
      setAuthMode(modeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const intent = authMode === "signup_otp" ? "signup" : "login";
      const res = await requestOtp({
        email,
        intent,
        role,
        fullName: fullName || email.split("@")[0],
        phone,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Failed to generate verification OTP." });
        return;
      }

      setStep("otp");
      setTimer(30);
      if (res.demoOtp) {
        setActiveDemoOtp(res.demoOtp);
      }
      setMessage({
        type: "success",
        text: `6-digit verification code sent to ${email}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setMessage({ type: "error", text: "Please enter the complete 6-digit verification code." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const intent = authMode === "signup_otp" ? "signup" : "login";
      const res = await verifyOtp({
        email,
        token: otpCode.trim(),
        intent,
        role,
        fullName: fullName || email.split("@")[0],
        phone,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Invalid verification code. Please try again." });
        return;
      }

      setMessage({
        type: "success",
        text: "Email verified successfully! Opening your account dashboard...",
      });

      setTimeout(() => {
        if (redirectUrl && redirectUrl.startsWith("/")) {
          router.push(redirectUrl);
        } else if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Step 1: Generate 1-Click WhatsApp Code
  const handleRequestWhatsAppSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < 10) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit mobile phone number." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await requestWhatsApp({
        phone,
        role,
        fullName: fullName || (role === "beneficiary" ? "Beneficiary" : "Donor"),
        email: email || undefined,
      });

      if (!res.success || !res.code || !res.waUrl) {
        setMessage({ type: "error", text: res.error || "Failed to generate WhatsApp link." });
        return;
      }

      setWaData({
        code: res.code,
        waUrl: res.waUrl,
        helpline: res.helpline || "+91 98765 43210",
        formattedPhone: res.formattedPhone || phone,
      });
      setStep("whatsapp_confirm");
      setMessage({
        type: "success",
        text: "WhatsApp 1-Tap verification ready. Tap button below to send message.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate WhatsApp verification.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Step 2: Confirm Account Activation
  const handleConfirmWhatsAppSubmit = async () => {
    if (!waData) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await verifyWhatsApp({
        phone: waData.formattedPhone,
        code: waData.code,
        role,
        fullName: fullName || "Verified User",
        email: email || undefined,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "WhatsApp verification failed." });
        return;
      }

      setMessage({
        type: "success",
        text: "Mobile verified via WhatsApp! Opening your dashboard...",
      });

      setTimeout(() => {
        if (redirectUrl && redirectUrl.startsWith("/")) {
          router.push(redirectUrl);
        } else if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification confirmation failed.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Password Sign-In fallback
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await signIn(email, password);
      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Login failed. Check your password." });
        return;
      }

      setMessage({ type: "success", text: "Signed in successfully! Redirecting..." });
      setTimeout(() => {
        if (redirectUrl && redirectUrl.startsWith("/")) {
          router.push(redirectUrl);
        } else if (email.includes("admin") || role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click role testing
  const handleQuickDemo = (demoRole: UserRole) => {
    setRole(demoRole);
    loginAsDemo(demoRole);
    setMessage({
      type: "success",
      text: `Logged in as demo ${demoRole.toUpperCase()}! Opening dashboard...`,
    });
    setTimeout(() => {
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else if (demoRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }, 600);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50/60 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold mb-3 border border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>OTP Verified NGO Security</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === "otp"
              ? "Verify Email OTP"
              : authMode === "signup_otp"
              ? "Create Verified Account"
              : authMode === "login_otp"
              ? "OTP Passwordless Login"
              : "Password Sign In"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === "otp"
              ? `Enter the 6-digit code sent to ${email}`
              : authMode === "signup_otp"
              ? "Verify your email with an instant OTP to start"
              : "Access your verified philanthropy dashboard"}
          </p>
        </div>

        {/* Role Selector Tabs (Only on initial form step) */}
        {step === "form" && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Select Your Account Type:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setRole("donor");
                    setVerifyChannel("email");
                  }}
                  className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    role === "donor"
                      ? "bg-white text-blue-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Donor Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("beneficiary");
                    setVerifyChannel("whatsapp");
                  }}
                  className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    role === "beneficiary"
                      ? "bg-white text-emerald-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Beneficiary / Patient</span>
                </button>
              </div>
            </div>

            {/* Verification Channel Selector (WhatsApp vs Email) */}
            {authMode !== "password" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Verification Method:
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Zero SMS Cost
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyChannel("whatsapp");
                      setMessage(null);
                    }}
                    className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      verifyChannel === "whatsapp"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp (1-Tap)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyChannel("email");
                      setMessage(null);
                    }}
                    className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      verifyChannel === "email"
                        ? "bg-blue-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email OTP</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 mb-5 ${
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
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* STEP 1: Form Details */}
        {step === "form" && (
          <>
            {authMode !== "password" ? (
              verifyChannel === "whatsapp" ? (
                /* WhatsApp Verification Form */
                <form onSubmit={handleRequestWhatsAppSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {role === "beneficiary" ? "Patient / Beneficiary Full Name *" : "Donor Full Name *"}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={role === "beneficiary" ? "e.g. Aarav Sharma" : "e.g. Vikram Mehta"}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Mobile Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="98765 43210"
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Verification code will open directly in your WhatsApp. Zero SMS charges.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com (optional)"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.replace(/\D/g, "").length < 10}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {loading ? (
                      <span>Generating WhatsApp Link...</span>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>Verify with 1-Tap on WhatsApp</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Email OTP Form */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {authMode === "signup_otp" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {role === "beneficiary" ? "Patient / Beneficiary Full Name *" : "Donor Full Name *"}
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={role === "beneficiary" ? "e.g. Aarav Sharma" : "e.g. Vikram Mehta"}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phone Number (Optional for WhatsApp updates)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {loading ? (
                      <span>Sending 6-Digit Code...</span>
                    ) : (
                      <>
                        <span>Send Email Verification OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )
            ) : (
              /* Password Login Form */
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Sign In with Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Mode Switchers */}
            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-slate-600">
              {authMode === "signup_otp" ? (
                <div className="flex items-center justify-center gap-1">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login_otp");
                      setMessage(null);
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Login with OTP
                  </button>
                  <span>or</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("password");
                      setMessage(null);
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Password
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <span>Need an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup_otp");
                      setMessage(null);
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Register with Email OTP
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 2: OTP Entry Screen */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Demo Helper Badge for instantaneous review */}
            {activeDemoOtp && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Test OTP Code:</span>{" "}
                  <code className="bg-amber-100 px-2 py-0.5 rounded-md font-mono text-sm font-extrabold text-amber-950">
                    {activeDemoOtp}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(activeDemoOtp)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition shadow-xs"
                >
                  Auto Fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl tracking-widest font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span>Verifying Code...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verify Email & Access Account</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setMessage(null);
                }}
                className="text-slate-500 hover:text-slate-800 font-semibold"
              >
                ← Change Email
              </button>

              <button
                type="button"
                disabled={timer > 0 || loading}
                onClick={() => handleSendOtp()}
                className={`flex items-center gap-1 font-bold ${
                  timer > 0
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-blue-700 hover:underline"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{timer > 0 ? `Resend code in ${timer}s` : "Resend OTP Code"}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: WhatsApp 1-Tap Verification Screen */}
        {step === "whatsapp_confirm" && waData && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <h3 className="text-sm font-bold text-emerald-950">
                1-Tap WhatsApp Verification
              </h3>
              <p className="text-xs text-emerald-800/90 mt-1 max-w-sm mx-auto leading-relaxed">
                Send your verification security code to our official helpline on WhatsApp. Zero SMS charges, instantaneous confirmation.
              </p>

              <div className="mt-4 p-3 bg-white border border-emerald-200 rounded-xl inline-block shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Security Code
                </span>
                <span className="font-mono text-2xl font-black text-emerald-700 tracking-wider">
                  {waData.code}
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Applicant: <strong>{fullName || phone}</strong> | Helpline: <strong>{waData.helpline}</strong>
              </div>
            </div>

            {/* Step A: Open WhatsApp Link */}
            <a
              href={waData.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>1. Open WhatsApp & Send Code</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Step B: Activate Account */}
            <button
              type="button"
              onClick={handleConfirmWhatsAppSubmit}
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span>Confirming Verification...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>2. I Have Sent The Message (Enter Portal)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setMessage(null);
                }}
                className="text-slate-500 hover:text-slate-800 font-semibold"
              >
                ← Change Number / Method
              </button>

              <button
                type="button"
                onClick={() => handleRequestWhatsAppSubmit()}
                className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate Link</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Demo Access Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo Profile Access:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleQuickDemo("donor")}
              className="py-2 px-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl border border-slate-200 transition text-center truncate"
            >
              Demo Donor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("beneficiary")}
              className="py-2 px-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl border border-slate-200 transition text-center truncate"
            >
              Beneficiary
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="py-2 px-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-xl border border-slate-200 transition text-center truncate"
            >
              Admin Desk
            </button>
          </div>
        </div>

        {/* Backend status indicator */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          Backend Mode:{" "}
          <strong className="text-slate-600">
            {isSupabaseConfigured() ? "Supabase Auth + Database" : "Interactive Local Demo Mode"}
          </strong>
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
