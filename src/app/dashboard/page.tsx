"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { formatINR, getProgress } from "@/lib/format";
import { getUserCases, getUserDonations } from "@/lib/actions/cases";
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
  ExternalLink,
  PlusCircle,
  Phone,
  Mail,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface UserDonationItem {
  id: string;
  amount: number;
  payment_ref?: string | null;
  created_at: string;
  status: string;
  donor_name?: string | null;
  case_id?: string | null;
  cases?: {
    title?: string | null;
    title_hi?: string | null;
    patient_name?: string | null;
    upi_id?: string | null;
  } | null;
}

export default function DashboardPage() {
  const { profile, role, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"cases" | "donations" | "verification">("cases");
  const [copied, setCopied] = useState<string | null>(null);

  const [userCases, setUserCases] = useState<Case[]>([]);
  const [userDonations, setUserDonations] = useState<UserDonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [casesData, donData] = await Promise.all([
          getUserCases(profile?.id),
          getUserDonations(profile?.id),
        ]);
        if (isMounted) {
          setUserCases(casesData || []);
          const mappedDonations: UserDonationItem[] = (donData || []).map((d) => ({
            id: String(d.id || ""),
            amount: Number(d.amount || 0),
            payment_ref: (d.payment_ref as string) || null,
            created_at: String(d.created_at || ""),
            status: String(d.status || "confirmed"),
            donor_name: (d.donor_name as string) || null,
            case_id: (d.case_id as string) || null,
            cases: (d.cases as UserDonationItem["cases"]) || null,
          }));
          setUserDonations(mappedDonations);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalImpact = userDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-10 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white/10">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {profile?.full_name || "Member Profile"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {role || "donor"}
                </span>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Account
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.email || "Registered Member"}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile.phone}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {role === "admin" && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Admin Verification Console
              </Link>
            )}

            <Link
              href="/submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Appeal
            </Link>

            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-white/15"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("cases")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "cases"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            {role === "beneficiary" ? "My Submitted Cases" : "Registered Appeals"}
          </button>
          <button
            onClick={() => setActiveTab("donations")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "donations"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Heart className="w-4 h-4" />
            Direct Transfers & Receipts
          </button>
          <button
            onClick={() => setActiveTab("verification")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "verification"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verification Standards
          </button>
        </div>

        {/* Tab 1: Cases */}
        {activeTab === "cases" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {role === "beneficiary" ? "Your Fundraising Appeals" : "Registered Appeals"}
                </h2>
                <p className="text-xs text-slate-500">
                  Track verification status, approval notes, and direct transfers received.
                </p>
              </div>
              <Link
                href="/submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Submit New Appeal
              </Link>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                <p className="text-sm font-medium">Loading your records...</p>
              </div>
            ) : userCases.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">No cases submitted yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  {role === "beneficiary"
                    ? "If you or a family member need medical or emergency assistance, register your case for 4-pillar verification."
                    : "You do not have any registered cases under this account."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/submit"
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Submit an Appeal
                  </Link>
                  <Link
                    href="/cases"
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
                  >
                    Explore Verified Cases
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {userCases.map((c) => {
                  const pct = getProgress(c.amount_raised, c.amount_needed);
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                          <Image
                            src={
                              c.photo_url ||
                              "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=400&fit=crop"
                            }
                            alt={c.patient_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                c.status === "approved" || c.status === "funded"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : c.status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                              }`}
                            >
                              {c.status}
                            </span>
                            <span className="text-xs text-slate-400">ID: {c.id.slice(0, 8)}...</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {c.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Patient: <strong className="text-slate-700">{c.patient_name}</strong>
                            {c.age ? ` (${c.age} yrs)` : ""} {c.city ? `· ${c.city}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-emerald-700">{formatINR(c.amount_raised)} raised</span>
                          <span className="text-slate-500">
                            {pct}% of {formatINR(c.amount_needed)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Direct UPI details */}
                      {c.upi_id && (
                        <div className="flex items-center justify-between text-xs bg-blue-50/60 p-3 rounded-xl border border-blue-100 mb-4">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-blue-700" />
                            <span className="text-slate-700 font-mono truncate max-w-[200px]">
                              {c.upi_id}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(c.upi_id!, c.id)}
                            className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 shrink-0"
                          >
                            {copied === c.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy UPI
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/cases/${c.id}`}
                          className="flex-1 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200"
                        >
                          View Public Page
                        </Link>
                        <button
                          onClick={() => setActiveTab("verification")}
                          className="flex-1 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                        >
                          Verification Audit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Donations & Receipts */}
        {activeTab === "donations" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Direct Transfer Records</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Apni Madad Foundation takes ₹0 commission. All payments are transferred 100% directly from donor to beneficiary.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 sm:text-right">
                  <div className="text-xs font-medium">Total Impact Tracked</div>
                  <div className="text-xl font-black text-emerald-700">{formatINR(totalImpact)}</div>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Loading transaction records...</p>
                </div>
              ) : userDonations.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">No direct transfer records yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                    When you make a direct UPI payment to a verified case, your contribution confirmation will appear here.
                  </p>
                  <Link
                    href="/cases"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
                  >
                    Support a Verified Case
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="mt-6 divide-y divide-slate-100">
                  {userDonations.map((don) => (
                    <div
                      key={don.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0 mt-0.5">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {don.cases?.patient_name || don.donor_name || "Beneficiary"}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                              {don.status || "confirmed"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {don.cases?.title || "Medical Emergency Support"}
                          </p>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            {don.payment_ref ? `Ref: ${don.payment_ref} · ` : ""}
                            Date: {don.created_at ? new Date(don.created_at).toLocaleDateString("en-IN") : "Recent"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 text-base">
                            {formatINR(Number(don.amount))}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            100% Direct to Beneficiary
                          </div>
                        </div>
                        {don.case_id && (
                          <Link
                            href={`/cases/${don.case_id}`}
                            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-slate-50 rounded-lg transition-colors"
                            title="View Case"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Verification Standards */}
        {activeTab === "verification" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">NGO 4-Pillar Verification Standard</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How Apni Madad Foundation ensures 100% authenticity before approving direct UPI transfers.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  ISO Compliant Process
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">1. Identity Verification</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Aadhaar card / Voter ID cross-verified with patient and next-of-kin. Phone number verified via OTP.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">2. Medical Authenticity</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Hospital admission slip, doctor estimate bill, and diagnostic reports confirmed directly with hospital billing desk.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">3. Direct UPI & Bank Match</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Bank account passbook and UPI Virtual Payment Address (VPA) name must match the patient or verified guardian.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">4. Field Visit / Video Verification</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Physical visit by an NGO field volunteer or geo-tagged live video call with patient before badge issuance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Need assistance with your case documents?</strong>
                  <p className="mt-0.5">
                    Our verification desk is available daily 9:00 AM to 8:00 PM IST. You can also reach our desk via WhatsApp at +91 98765 43210.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
