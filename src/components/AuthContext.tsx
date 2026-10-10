"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Profile, UserRole } from "@/types/database";
import {
  signInUser,
  signUpUser,
  signOutUser,
  sendEmailOtp,
  verifyEmailOtp,
  requestWhatsAppVerification,
  verifyWhatsAppCode,
  WhatsAppVerificationResponse,
} from "@/lib/actions/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; role?: UserRole; profile?: Profile; error?: string }>;
  signUp: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (payload: {
    email: string;
    intent: "signup" | "login";
    role?: UserRole;
    fullName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyOtp: (payload: {
    email: string;
    token: string;
    intent: "signup" | "login";
    role?: UserRole;
    fullName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; role?: UserRole; profile?: Profile; error?: string }>;
  requestWhatsApp: (payload: {
    phone: string;
    role?: UserRole;
    fullName?: string;
    email?: string;
  }) => Promise<WhatsAppVerificationResponse>;
  verifyWhatsApp: (payload: {
    phone: string;
    code: string;
    role?: UserRole;
    fullName?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemo: (demoRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_STORAGE_KEY = "apni_madad_demo_profile";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          if (supabase) {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
              setUser({ id: session.user.id, email: session.user.email || "" });
              const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

              if (prof) {
                setProfile(prof as Profile);
              } else {
                setProfile({
                  id: session.user.id,
                  email: session.user.email || "",
                  role: (session.user.user_metadata?.role as UserRole) || "donor",
                  full_name: session.user.user_metadata?.full_name || "User",
                  phone: session.user.user_metadata?.phone || null,
                  is_verified: true,
                  created_at: session.user.created_at,
                });
              }
            }
          }
        } else {
          // Clear any legacy demo profiles so visitors start as clean guests
          const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
          if (savedDemo) {
            try {
              const parsed = JSON.parse(savedDemo) as Profile;
              if (parsed.id?.startsWith("demo-")) {
                localStorage.removeItem(DEMO_STORAGE_KEY);
              } else {
                setUser({ id: parsed.id, email: parsed.email });
                setProfile(parsed);
              }
            } catch {
              localStorage.removeItem(DEMO_STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const loginAsDemo = useCallback((demoRole: UserRole) => {
    const demoProfile: Profile = {
      id: "demo-" + demoRole + "-01",
      email:
        demoRole === "admin"
          ? "admin@apnimadad.org"
          : demoRole === "beneficiary"
          ? "patient@help.org"
          : "donor@care.org",
      role: demoRole,
      full_name:
        demoRole === "admin"
          ? "Dr. Shahnawaz (Admin)"
          : demoRole === "beneficiary"
          ? "Aarav Sharma (Patient)"
          : "Vikram Mehta (Verified Donor)",
      phone: "+91 98765 43210",
      is_verified: true,
      created_at: new Date().toISOString(),
    };
    setUser({ id: demoProfile.id, email: demoProfile.email });
    setProfile(demoProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
  }, []);

  const handleSignIn = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: pass,
            });

            if (!error && data?.user) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();

              const resolvedProfile: Profile = (prof as Profile) || {
                id: data.user.id,
                email: data.user.email || cleanEmail,
                role: (data.user.user_metadata?.role as UserRole) || "donor",
                full_name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
                phone: data.user.user_metadata?.phone || null,
                is_verified: true,
                created_at: data.user.created_at,
              };

              setUser({ id: data.user.id, email: data.user.email || cleanEmail });
              setProfile(resolvedProfile);
              return { success: true, role: resolvedProfile.role, profile: resolvedProfile };
            }
          } catch (clientErr) {
            console.warn("Direct browser signIn fallback to server action:", clientErr);
          }
        }
      }

      const res = await signInUser(cleanEmail, pass);
      if (res.success && res.profile) {
        setUser(res.user || null);
        setProfile(res.profile);
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          if (supabase) {
            try {
              await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: pass,
              });
            } catch {
              // Session cookie already set on server
            }
          }
        } else {
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(res.profile));
        }
        return { success: true, role: res.profile.role, profile: res.profile };
      }
      return { success: false, error: res.error || "Login failed" };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: UserRole;
  }) => {
    setLoading(true);
    try {
      const res = await signUpUser(payload);
      if (res.success && res.profile) {
        setUser(res.user || null);
        setProfile(res.profile);
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          if (supabase) {
            try {
              await supabase.auth.signInWithPassword({
                email: payload.email.trim().toLowerCase(),
                password: payload.password,
              });
            } catch (clientErr) {
              console.warn("Client session setup notice:", clientErr);
            }
          }
        } else {
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(res.profile));
        }
        return { success: true };
      }
      return { success: false, error: res.error || "Signup failed" };
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (payload: {
    email: string;
    intent: "signup" | "login";
    role?: UserRole;
    fullName?: string;
    phone?: string;
  }) => {
    return sendEmailOtp(payload);
  };

  const handleVerifyOtp = async (payload: {
    email: string;
    token: string;
    intent: "signup" | "login";
    role?: UserRole;
    fullName?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      const res = await verifyEmailOtp(payload);
      if (res.success && res.profile) {
        setUser(res.user || null);
        setProfile(res.profile);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(res.profile));
        return { success: true, role: res.profile.role, profile: res.profile };
      }
      return { success: false, error: res.error || "Verification failed." };
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWhatsApp = async (payload: {
    phone: string;
    role?: UserRole;
    fullName?: string;
    email?: string;
  }) => {
    return requestWhatsAppVerification(payload);
  };

  const handleVerifyWhatsApp = async (payload: {
    phone: string;
    code: string;
    role?: UserRole;
    fullName?: string;
    email?: string;
  }) => {
    setLoading(true);
    try {
      const res = await verifyWhatsAppCode(payload);
      if (res.success && res.profile) {
        setUser(res.user || null);
        setProfile(res.profile);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(res.profile));
        return { success: true };
      }
      return { success: false, error: res.error || "WhatsApp verification failed." };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut().catch(() => {});
        }
      }
      await signOutUser();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        requestOtp: handleRequestOtp,
        verifyOtp: handleVerifyOtp,
        requestWhatsApp: handleRequestWhatsApp,
        verifyWhatsApp: handleVerifyWhatsApp,
        signOut: handleSignOut,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthFallback: AuthContextType = {
  user: null,
  profile: null,
  role: null,
  loading: false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  requestOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  requestWhatsApp: async () => ({ success: false }),
  verifyWhatsApp: async () => ({ success: false }),
  signOut: async () => {},
  loginAsDemo: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthFallback;
  }
  return context;
}
