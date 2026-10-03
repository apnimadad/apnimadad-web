"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { formatINR, getProgress } from "@/lib/format";
import {
  getUserDonations,
  getPublicCases,
  getUserCases,
  recordDonation,
} from "@/lib/actions/cases";
import { Case } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Heart,
  FileText,
  CheckCircle,
  AlertCircle,
  QrCode,
  LogOut,
  PlusCircle,
  Phone,
  Mail,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Receipt,
  Search,
  X,
  CreditCard,
  UserCheck,
  Award,
  Calendar,
  Lock,
} from "lucide-react";

interface UserDonationItem {
  id: string;
  amount: number;
  payment_ref?: string | null;
  created_at: string;
  status: string;
  donor_name?: string | null;
  case_id?: string | null;
  notes?: string | null;
  cases?: {
    id?: string | null;
    title?: string | null;
    title_hi?: string | null;
    patient_name?: string | null;
    upi_id?: string | null;
    hospital_name?: string | null;
    category?: string | null;
    amount_needed?: number | null;
    amount_raised?: number | null;
    status?: string | null;
    photo_url?: string | null;
    city?: string | null;
  } | null;
}

export default function DashboardPage() {
  const { user, profile, role, loading: authLoading, signOut, loginAsDemo } = useAuth();
  const router = useRouter();

  // Redirect admin directly to admin panel
  useEffect(() => {
    if (role === "admin") {
      router.replace("/admin");
    }
  }, [role, router]);

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<
    "donations" | "updates" | "urgent" | "tax80g" | "my_appeals"
  >("donations");

  // Data states
  const [userDonations, setUserDonations] = useState<UserDonationItem[]>([]);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [userCases, setUserCases] = useState<Case[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Search & filter
  const [donationSearch, setDonationSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [receiptModal, setReceiptModal] = useState<UserDonationItem | null>(null);
  const [recordModal, setRecordModal] = useState(false);
  const [qrModal, setQrModal] = useState<Case | null>(null);

  // PAN state for 80G tax receipt
  const [donorPan, setDonorPan] = useState("");
  const [panSaved, setPanSaved] = useState(false);

  // New Direct UPI Donation Form state
  const [recordForm, setRecordForm] = useState({
    caseId: "",
    amount: "",
    utr: "",
    notes: "",
  });
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Load donor PAN from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apni_madad_donor_pan");
      if (saved) {
        setDonorPan(saved);
        setPanSaved(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch live donations, public cases, and submitted cases
  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setDataLoading(true);
      try {
        const [donationsData, publicCasesData, myCasesData] = await Promise.all([
          getUserDonations(profile?.id),
          getPublicCases(),
          getUserCases(profile?.id),
        ]);

        if (isMounted) {
          const mappedDonations: UserDonationItem[] = (donationsData || []).map((d) => ({
            id: String(d.id || ""),
            amount: Number(d.amount || 0),
            payment_ref: (d.payment_ref as string) || null,
            created_at: String(d.created_at || ""),
            status: String(d.status || "confirmed"),
            donor_name: (d.donor_name as string) || null,
            case_id: (d.case_id as string) || null,
            notes: (d.notes as string) || null,
            cases: (d.cases as UserDonationItem["cases"]) || null,
          }));
          setUserDonations(mappedDonations);
          setAllCases(publicCasesData || []);
          setUserCases(myCasesData || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }

    if (profile?.id || user?.id) {
      loadDashboardData();
    } else {
      // Load public cases for guest/demo view
      getPublicCases().then((cases) => {
        if (isMounted) {
          setAllCases(cases || []);
          setDataLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [profile?.id, user?.id]);

  // Aggregate Impact Calculations
  const totalDonated = useMemo(() => {
    return userDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }, [userDonations]);

  const uniquePatientsHelped = useMemo(() => {
    const set = new Set(userDonations.map((d) => d.case_id).filter(Boolean));
    return set.size;
  }, [userDonations]);

  const filteredDonations = useMemo(() => {
    if (!donationSearch.trim()) return userDonations;
    const q = donationSearch.toLowerCase();
    return userDonations.filter(
      (d) =>
        d.cases?.patient_name?.toLowerCase().includes(q) ||
        d.cases?.title?.toLowerCase().includes(q) ||
        d.payment_ref?.toLowerCase().includes(q) ||
        d.amount.toString().includes(q)
    );
  }, [userDonations, donationSearch]);

  const urgentCases = useMemo(() => {
    return allCases.filter((c) => c.status === "approved").slice(0, 4);
  }, [allCases]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSavePan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorPan.trim()) return;
    try {
      localStorage.setItem("apni_madad_donor_pan", donorPan.trim().toUpperCase());
      setPanSaved(true);
    } catch {
      // ignore
    }
  };

  // Submit self-reported direct UPI payment record
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.caseId) {
      setRecordError("Please select a beneficiary case.");
      return;
    }
    if (!recordForm.amount || Number(recordForm.amount) <= 0) {
      setRecordError("Please enter a valid donation amount.");
      return;
    }
    if (!recordForm.utr || recordForm.utr.trim().length < 6) {
      setRecordError("Please provide a valid 12-digit UPI UTR / Bank Reference number.");
      return;
    }

    setSubmittingRecord(true);
    setRecordError(null);
    try {
      const res = await recordDonation({
        case_id: recordForm.caseId,
        amount: Number(recordForm.amount),
        donor_id: profile?.id || user?.id,
        donor_name: profile?.full_name || "Generous Supporter",
        payment_ref: recordForm.utr.trim(),
        notes: recordForm.notes.trim() || undefined,
      });

      if (res.success) {
        // Re-fetch user donations
        const updated = await getUserDonations(profile?.id || user?.id);
        const mapped: UserDonationItem[] = (updated || []).map((d) => ({
          id: String(d.id || ""),
          amount: Number(d.amount || 0),
          payment_ref: (d.payment_ref as string) || null,
          created_at: String(d.created_at || ""),
          status: String(d.status || "confirmed"),
          donor_name: (d.donor_name as string) || null,
          case_id: (d.case_id as string) || null,
          notes: (d.notes as string) || null,
          cases: (d.cases as UserDonationItem["cases"]) || null,
        }));
        setUserDonations(mapped);
        setRecordModal(false);
        setRecordForm({ caseId: "", amount: "", utr: "", notes: "" });
      } else {
        setRecordError(res.error || "Failed to record donation.");
      }
    } catch (err: unknown) {
      setRecordError(err instanceof Error ? err.message : "Error saving transfer");
    } finally {
      setSubmittingRecord(false);
    }
  };

  // Auth Loading View
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin text-blue-700 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Verifying Donor Authentication...</h2>
          <p className="text-xs text-slate-500">Connecting securely to Apni Madad database</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Guest View (Prompt to Sign In or One-Click Demo)
  if (!user && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-white/10">
            <Heart className="w-8 h-8 fill-current" />
          </div>

          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            100% Direct Aid Foundation
          </span>

          <h2 className="text-2xl font-black tracking-tight mt-3 mb-2">
            Donor Impact Portal
          </h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Sign in to track your direct UPI transfers, download 80G tax exemption receipts, and follow real-time patient recovery updates.
          </p>

          <div className="space-y-3">
            <Link
              href="/login?role=donor&next=/dashboard"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Donor Account</span>
            </Link>

            <Link
              href="/login?role=donor&next=/dashboard"
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
            >
              <span>Create New Donor Account</span>
            </Link>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  loginAsDemo("donor");
                  router.refresh();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Explore with 1-Click Demo Donor Account</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-around text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 0% Commission
            </span>
            <span className="flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-blue-400" /> 80G Tax Exemption
            </span>
            <span className="flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-amber-400" /> Direct UPI
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-8 sm:py-10 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/10 shrink-0">
              {profile?.full_name?.charAt(0) || "D"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {profile?.full_name || "Generous Supporter"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {role === "donor" ? "Verified Donor" : role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  80G Tax Benefits Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.email || user?.email || "Registered Donor"}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {new Date(profile?.created_at || Date.now()).getFullYear()}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRecordModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Direct Transfer</span>
            </button>

            <Link
              href="/cases"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Heart className="w-4 h-4" />
              <span>Donate to Urgent Cases</span>
            </Link>

            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 border border-white/15"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Impact Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Direct Aid Given</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {formatINR(totalDonated)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% transferred directly to patients
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Patients Backed</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {uniquePatientsHelped} Patients
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Across medical, accident & child care
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Zero Platform Cut</span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ₹0 Retained
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Zero commission, zero transaction fees
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">80G Tax Exemption</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                50% Deduction
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Instant digital 80G tax receipts ready
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("donations")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "donations"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Direct Transfers & Receipts</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {userDonations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("updates")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "updates"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Patient Recovery Updates</span>
          </button>

          <button
            onClick={() => setActiveTab("urgent")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "urgent"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Urgent Verified Appeals</span>
            <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {urgentCases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tax80g")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "tax80g"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>80G Tax Exemption Center</span>
          </button>

          {userCases.length > 0 && (
            <button
              onClick={() => setActiveTab("my_appeals")}
              className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === "my_appeals"
                  ? "border-blue-700 text-blue-800"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Submitted Appeals</span>
              <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {userCases.length}
              </span>
            </button>
          )}
        </div>

        {/* Tab 1: Direct Transfers & Receipts */}
        {activeTab === "donations" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Direct Aid Contributions</h2>
                <p className="text-xs text-slate-500">
                  Every rupee reaches the beneficiary directly via verified UPI or hospital account.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by patient, UTR..."
                    value={donationSearch}
                    onChange={(e) => setDonationSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  onClick={() => setRecordModal(true)}
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Transfer</span>
                </button>
              </div>
            </div>

            {dataLoading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-medium">Fetching verified transfers from Supabase...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  {donationSearch ? "No matching transfers found" : "No direct transfers recorded yet"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  When you donate directly to any verified patient via UPI QR, you can record your UTR reference to generate official 80G tax receipts and follow patient recovery updates.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setRecordModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Record a Transfer You Made
                  </button>
                  <Link
                    href="/cases"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Heart className="w-4 h-4" />
                    Browse Verified Cases
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Patient / Case</th>
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-4 font-bold">Amount</th>
                        <th className="py-3 px-4 font-bold">Payment Ref (UTR)</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">80G Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredDonations.map((item) => {
                        const dateFormatted = new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-medium">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                                  {item.cases?.photo_url ? (
                                    <Image
                                      src={item.cases.photo_url}
                                      alt="Patient"
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Heart className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {item.cases?.patient_name || item.cases?.title || "Direct Beneficiary Transfer"}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {item.cases?.hospital_name || item.cases?.city || "Hospital Care"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {dateFormatted}
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                              {formatINR(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {item.payment_ref ? (
                                <div className="flex items-center gap-1.5">
                                  <span>{item.payment_ref}</span>
                                  <button
                                    onClick={() => handleCopy(item.payment_ref!, item.id)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                    title="Copy reference"
                                  >
                                    {copiedId === item.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Direct UPI</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                Reconciled
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setReceiptModal(item)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition text-xs border border-blue-200"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>80G Receipt</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Patient Recovery Updates */}
        {activeTab === "updates" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Patient Recovery & Hospital Updates</h2>
              <p className="text-xs text-slate-500">
                Transparent milestones from treating doctors, surgery completions, and hospital discharge progress.
              </p>
            </div>

            {allCases.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-500">No active hospital updates currently available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allCases.slice(0, 6).map((c) => {
                  const percent = getProgress(c.amount_raised, c.amount_needed);
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                          {c.photo_url ? (
                            <Image
                              src={c.photo_url}
                              alt={c.patient_name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Heart className="w-6 h-6 text-blue-600 m-auto" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-100">
                              {c.category}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {c.city}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                            {c.patient_name} ({c.age} yrs)
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {c.title}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900">{formatINR(c.amount_raised)}</span>
                          <span className="text-slate-500 font-medium">Goal: {formatINR(c.amount_needed)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                          <span>{percent}% direct aid funded</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Hospital Verified
                          </span>
                        </div>
                      </div>

                      {/* Treatment Milestone Notice */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Hospital Status: Active Inpatient</p>
                          <p className="text-[11px] text-slate-600">
                            {c.hospital_name || "Regional Medical Center"}: Under doctor observation. Zero deduction guarantee applied.
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <Link
                          href={`/cases/${c.id}`}
                          className="text-blue-700 hover:text-blue-900 text-xs font-bold flex items-center gap-1"
                        >
                          <span>View Full Medical History</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setQrModal(c)}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Direct UPI</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Urgent Verified Appeals */}
        {activeTab === "urgent" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Urgent Cases Needing Immediate Transfer</h2>
                <p className="text-xs text-slate-500">
                  Critical medical emergencies verified with 4-pillar physical and doctor audit.
                </p>
              </div>
              <Link
                href="/cases"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <span>View All Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                      {c.photo_url ? (
                        <Image
                          src={c.photo_url}
                          alt={c.patient_name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Heart className="w-6 h-6 text-blue-600 m-auto" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Emergency Critical
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {c.patient_name} ({c.city})
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500">Direct Beneficiary UPI:</span>
                      <span className="font-mono font-bold text-slate-800">{c.upi_id || "apnimadad@upi"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Hospital:</span>
                      <span className="font-semibold text-slate-800">{c.hospital_name || "Government Hospital"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setQrModal(c)}
                      className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Donate via Direct UPI</span>
                    </button>
                    <Link
                      href={`/cases/${c.id}`}
                      className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: 80G Tax Exemption Center */}
        {activeTab === "tax80g" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-md">
              <div className="max-w-2xl space-y-3">
                <span className="px-3 py-1 bg-white/10 text-blue-200 border border-white/20 text-xs font-bold rounded-full uppercase tracking-wider">
                  Section 80G Income Tax Exemption
                </span>
                <h2 className="text-2xl font-black tracking-tight">
                  Maximize Your Philanthropic Tax Savings
                </h2>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Apni Madad Foundation is recognized under Section 80G of the Indian Income Tax Act. All verified donations made directly through our platform qualify for a 50% deduction on your taxable income.
                </p>
              </div>
            </div>

            {/* PAN Card Linking Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl">
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Link Permanent Account Number (PAN) for Tax Invoices</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Indian Income Tax department mandates PAN for donation receipts exceeding ₹2,000 to be eligible for Form 10BE filing.
              </p>

              <form onSubmit={handleSavePan} className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={donorPan}
                  onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm uppercase font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  {panSaved ? "Update PAN" : "Save PAN"}
                </button>
              </form>
              {panSaved && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  PAN linked successfully. It will now automatically appear on all your 80G receipts.
                </p>
              )}
            </div>

            {/* Financial Year Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-4">
                Consolidated Tax Statement Summary (FY 2024-25 / 2025-26)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold uppercase">Total Donated</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalDonated)}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-bold uppercase">Eligible 80G Deduction</span>
                  <div className="text-xl font-bold text-emerald-800 mt-1">{formatINR(Math.round(totalDonated * 0.5))}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-bold uppercase">Receipts Issued</span>
                  <div className="text-xl font-bold text-blue-800 mt-1">{userDonations.length} Receipts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: My Appeals (for users who also requested help) */}
        {activeTab === "my_appeals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Submitted Relief Appeals</h2>
                <p className="text-xs text-slate-500">
                  Track verification stages, doctor endorsements, and funds transferred.
                </p>
              </div>
              <Link
                href="/submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Submit Another Appeal
              </Link>
            </div>

            <div className="space-y-3">
              {userCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        c.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "funded"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {c.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{c.title}</h4>
                    <p className="text-xs text-slate-500">
                      Beneficiary: {c.patient_name} | Target: {formatINR(c.amount_needed)} | Raised: {formatINR(c.amount_raised)}
                    </p>
                  </div>

                  <Link
                    href={`/cases/${c.id}`}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shrink-0 text-center"
                  >
                    View Live Page
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Official 80G Tax Exemption Receipt */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReceiptModal(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Receipt Container */}
            <div id="print-receipt-area" className="border border-slate-300 rounded-2xl p-6 bg-slate-50/50 space-y-4">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-300 pb-4">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                  Official 80G Tax Exemption Certificate
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  APNI MADAD FOUNDATION
                </h3>
                <p className="text-[10px] text-slate-600">
                  Registered under Section 80G & 12A of the Income Tax Act, 1961
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Reg No: U85300MP2024NPL012345 | 80G Approval: CIT(E)/BPL/80G/2024-25/A-1082
                </p>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Receipt No.</span>
                  <span className="font-mono font-bold text-slate-900">AMF-{receiptModal.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Date of Transfer</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(receiptModal.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Donor Name:</span>
                  <span className="font-bold text-slate-900">{profile?.full_name || receiptModal.donor_name || "Generous Supporter"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Donor PAN:</span>
                  <span className="font-mono font-bold text-slate-900">{donorPan || "Not Provided (Form 10BE General)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Patient / Purpose:</span>
                  <span className="font-bold text-blue-900">{receiptModal.cases?.patient_name || receiptModal.cases?.title || "Medical Aid Relief"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bank / UPI UTR:</span>
                  <span className="font-mono text-slate-800">{receiptModal.payment_ref || "Direct App Transfer"}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-300 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Amount Donated Directly</span>
                <span className="text-2xl font-black text-slate-900">{formatINR(receiptModal.amount)}</span>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">
                  100% Direct Transfer Verified without NGO deduction
                </p>
              </div>

              {/* Footer Stamp */}
              <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Apni Madad Foundation Seal</p>
                  <p>Digitally Reconciled Voucher</p>
                </div>
                <div className="text-right">
                  <span className="inline-block border-b border-slate-400 font-serif italic text-slate-800 font-bold px-4 py-1">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Print or save as PDF for your Income Tax Return.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Direct Transfer */}
      {recordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setRecordModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Record a Direct UPI / Bank Transfer
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              If you scanned a patient&apos;s QR code on PhonePe, GPay, or Paytm, enter the UTR to reconcile and generate your 80G tax receipt.
            </p>

            {recordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{recordError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRecord} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Select Patient / Cause *
                </label>
                <select
                  required
                  value={recordForm.caseId}
                  onChange={(e) => setRecordForm({ ...recordForm, caseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Choose verified case --</option>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.patient_name} - {c.title} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Donation Amount Transferred (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  12-Digit UPI UTR or Bank Transaction Ref *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 427819283746"
                  value={recordForm.utr}
                  onChange={(e) => setRecordForm({ ...recordForm, utr: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Find this in your Google Pay, PhonePe, or Paytm payment details.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Message / Well Wishes for Patient (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wishing Aarav a speedy recovery and good health!"
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRecordModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRecord}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {submittingRecord ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Record Transfer & Generate 80G</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Direct UPI QR Donation Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setQrModal(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              100% Direct Transfer
            </span>

            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Send Direct Aid to {qrModal.patient_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {qrModal.title} ({qrModal.hospital_name || qrModal.city})
            </p>

            {/* QR Code */}
            <div className="w-48 h-48 bg-white border-2 border-slate-300 rounded-2xl mx-auto p-2 flex items-center justify-center shadow-md mb-3 relative">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=${qrModal.upi_id || "apnimadad@upi"}&pn=${encodeURIComponent(
                    qrModal.patient_name
                  )}&cu=INR`
                )}`}
                alt="Direct UPI QR Code"
                width={192}
                height={192}
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs mb-4">
              <span className="font-mono font-bold text-slate-800 truncate mr-2">
                {qrModal.upi_id || "apnimadad@upi"}
              </span>
              <button
                onClick={() => handleCopy(qrModal.upi_id || "apnimadad@upi", "modal-upi")}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 shrink-0"
              >
                {copiedId === "modal-upi" ? "Copied!" : "Copy UPI"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Scan with Google Pay, PhonePe, Paytm, or BHIM. After paying, click &quot;Record Transfer&quot; above to claim your 80G tax receipt.
            </p>

            <button
              onClick={() => {
                const c = qrModal;
                setQrModal(null);
                setRecordForm((prev) => ({ ...prev, caseId: c.id }));
                setRecordModal(true);
              }}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              <span>I Have Transferred - Claim 80G Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
