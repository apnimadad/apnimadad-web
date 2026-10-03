"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { formatINR, getProgress } from "@/lib/format";
import {
  getUserDonations,
  getPublicCases,
  getUserCases,
  recordDonation,
  submitCase,
  uploadAdditionalDocument,
} from "@/lib/actions/cases";
import { Case, Category } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Heart,
  FileText,
  CheckCircle,
  AlertCircle,
  QrCode,
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
  UserCheck,
  Award,
  Calendar,
  Upload,
  Video,
  Paperclip,
  Clock,
  Stethoscope,
  Trash2,
  CheckCircle2,
  Eye,
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
  const { user, profile, role, loading: authLoading, loginAsDemo } = useAuth();
  const router = useRouter();

  // Redirect admin directly to admin panel
  useEffect(() => {
    if (role === "admin") {
      router.replace("/admin");
    }
  }, [role, router]);

  // Role determination: if registered as beneficiary, show beneficiary application dashboard; otherwise dedicated donor portal
  const isBeneficiary = (profile?.role || role) === "beneficiary";

  // Beneficiary sub-tabs
  const [beneficiaryTab, setBeneficiaryTab] = useState<
    "my_cases" | "apply_appeal" | "aid_ledger"
  >("my_cases");

  // Donor sub-tabs: 1. "cases" (Verified Needy Cases & Direct Giving), 2. "donations" (My Direct Transfers & Receipts), 3. "updates" (Patient Recovery Updates)
  const [donorTab, setDonorTab] = useState<
    "cases" | "donations" | "updates"
  >("cases");

  const [donorSearch, setDonorSearch] = useState("");
  const [donorCategory, setDonorCategory] = useState<string>("all");

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
  const [attachDocModal, setAttachDocModal] = useState<string | null>(null);



  // Beneficiary Appeal Form State (With photo, video, docs, hospital details, and direct UPI)
  const [appealForm, setAppealForm] = useState({
    patientName: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    phone: "",
    city: "",
    state: "Madhya Pradesh",
    homeAddress: "",
    category: "medical" as Category,
    urgency: "high" as "high" | "medium" | "low",
    title: "",
    description: "",
    hospitalName: "",
    doctorName: "",
    hospitalContact: "",
    bedOrWard: "",
    amountNeeded: "",
    upiId: "",
    bankAccount: "",
    confirmBankAccount: "",
    ifsc: "",
    accountHolderName: "",
    photoUrl: "",
    videoUrl: "",
    documents: [] as { name: string; type: string; url: string }[],
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docCategory, setDocCategory] = useState<string>("Hospital Estimation Bill");
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);
  const [appealErrorMsg, setAppealErrorMsg] = useState<string | null>(null);

  // Attach additional document to existing case state
  const [attachDocCategory, setAttachDocCategory] = useState("Hospital Estimation Bill");
  const [uploadingAttachDoc, setUploadingAttachDoc] = useState(false);

  // Direct UPI Donation Form state
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

  // Pre-fill user details in appeal form
  useEffect(() => {
    if (profile) {
      setAppealForm((prev) => ({
        ...prev,
        patientName: prev.patientName || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
      }));
    }
  }, [profile]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [donationsData, publicCasesData, myCasesData] = await Promise.all([
        getUserDonations(profile?.id || user?.id),
        getPublicCases(),
        getUserCases(profile?.id || user?.id, profile?.phone || undefined),
      ]);

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
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [profile?.id, profile?.phone, user?.id]);

  useEffect(() => {
    if (profile?.id || user?.id) {
      loadDashboardData();
    } else {
      getPublicCases().then((cases) => {
        setAllCases(cases || []);
        setDataLoading(false);
      });
    }
  }, [profile?.id, user?.id, loadDashboardData]);

  // Calculations
  const totalDonated = useMemo(() => {
    return userDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }, [userDonations]);

  const uniquePatientsHelped = useMemo(() => {
    const set = new Set(userDonations.map((d) => d.case_id).filter(Boolean));
    return set.size;
  }, [userDonations]);

  const totalAidReceived = useMemo(() => {
    return userCases.reduce((sum, c) => sum + Number(c.amount_raised || 0), 0);
  }, [userCases]);

  const totalAidNeeded = useMemo(() => {
    return userCases.reduce((sum, c) => sum + Number(c.amount_needed || 0), 0);
  }, [userCases]);

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

  const filteredDonorCases = useMemo(() => {
    return allCases.filter((c) => {
      const matchCat = donorCategory === "all" || c.category === donorCategory;
      const q = donorSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.patient_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.hospital_name && c.hospital_name.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [allCases, donorCategory, donorSearch]);

  const urgentCases = useMemo(() => {
    return allCases.filter((c) => c.status === "approved").slice(0, 4);
  }, [allCases]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };



  // Upload Handlers for Beneficiary Appeal
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "case-photos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setAppealForm((prev) => ({ ...prev, photoUrl: data.url }));
      } else {
        alert(`Photo upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      alert(`Upload error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "case-videos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setAppealForm((prev) => ({ ...prev, videoUrl: data.url }));
      } else {
        alert(`Video upload failed: ${data.error || "File size too large. You can paste a video link."}`);
      }
    } catch (err: unknown) {
      alert(`Video upload error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "case-docs");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setAppealForm((prev) => ({
          ...prev,
          documents: [
            ...prev.documents,
            { name: file.name, type: docCategory, url: data.url },
          ],
        }));
        e.target.value = "";
      } else {
        alert(`Document upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      alert(`Document upload error: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = (index: number) => {
    setAppealForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  // Submit Beneficiary Appeal
  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppealErrorMsg(null);
    setAppealSuccessMsg(null);

    if (!appealForm.patientName.trim()) {
      setAppealErrorMsg("Please enter patient name.");
      return;
    }
    if (!appealForm.phone.trim() || appealForm.phone.length < 10) {
      setAppealErrorMsg("Please provide a valid 10-digit contact phone number.");
      return;
    }
    if (!appealForm.amountNeeded || Number(appealForm.amountNeeded) <= 0) {
      setAppealErrorMsg("Please enter a valid target amount needed.");
      return;
    }
    if (!appealForm.upiId.trim() && !appealForm.bankAccount.trim()) {
      setAppealErrorMsg("Please provide either a Beneficiary UPI ID or Bank Account for direct donor transfers.");
      return;
    }
    if (
      appealForm.bankAccount.trim() &&
      appealForm.bankAccount.trim() !== appealForm.confirmBankAccount.trim()
    ) {
      setAppealErrorMsg("Bank Account Number and Confirm Account Number do not match.");
      return;
    }

    setAppealSubmitting(true);
    try {
      const res = await submitCase({
        patient_name: appealForm.patientName.trim(),
        age: appealForm.age ? Number(appealForm.age) : undefined,
        city: appealForm.city.trim() || undefined,
        category: appealForm.category,
        urgency: appealForm.urgency,
        title: appealForm.title.trim() || `Medical Treatment for ${appealForm.patientName}`,
        description: appealForm.description.trim(),
        amount_needed: Number(appealForm.amountNeeded),
        upi_id: appealForm.upiId.trim() || undefined,
        bank_account: appealForm.bankAccount.trim() || undefined,
        ifsc: appealForm.ifsc.trim() || undefined,
        phone: appealForm.phone.trim(),
        photo_url: appealForm.photoUrl || undefined,
        video_url: appealForm.videoUrl || undefined,
        hospital_name: appealForm.hospitalName.trim() || undefined,
        doctor_name: appealForm.doctorName.trim() || undefined,
        hospital_contact: appealForm.hospitalContact.trim() || undefined,
        documents: appealForm.documents,
      });

      if (res.success) {
        setAppealSuccessMsg(
          "Your relief appeal has been submitted successfully! The verification committee is auditing your medical bills and doctor quotation. Once verified, your case will be published with live donor QR."
        );
        // Refresh cases
        await loadDashboardData();
        setBeneficiaryTab("my_cases");
        // Reset form
        setAppealForm({
          patientName: profile?.full_name || "",
          age: "",
          gender: "male",
          phone: profile?.phone || "",
          city: "",
          state: "Madhya Pradesh",
          homeAddress: "",
          category: "medical",
          urgency: "high",
          title: "",
          description: "",
          hospitalName: "",
          doctorName: "",
          hospitalContact: "",
          bedOrWard: "",
          amountNeeded: "",
          upiId: "",
          bankAccount: "",
          confirmBankAccount: "",
          ifsc: "",
          accountHolderName: "",
          photoUrl: "",
          videoUrl: "",
          documents: [],
        });
      } else {
        setAppealErrorMsg(res.error || "Failed to submit appeal. Please try again.");
      }
    } catch (err: unknown) {
      setAppealErrorMsg(err instanceof Error ? err.message : "Error submitting appeal");
    } finally {
      setAppealSubmitting(false);
    }
  };

  // Attach Document to Existing Case
  const handleAttachDocToExisting = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!attachDocModal) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "case-docs");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        const updateRes = await uploadAdditionalDocument(attachDocModal, {
          name: file.name,
          type: attachDocCategory,
          url: data.url,
        });

        if (updateRes.success) {
          alert("Additional document attached successfully!");
          await loadDashboardData();
          setAttachDocModal(null);
        } else {
          alert(`Could not save document: ${updateRes.error}`);
        }
      } else {
        alert(`Upload error: ${data.error}`);
      }
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setUploadingAttachDoc(false);
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
        await loadDashboardData();
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
          <h2 className="text-base font-bold text-slate-800">Verifying Account Authentication...</h2>
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
            Apni Madad Member Portal
          </h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Access your direct aid dashboard to apply for emergency relief, upload hospital bills, or track your donor contributions.
          </p>

          <div className="space-y-3">
            <Link
              href="/login?role=beneficiary&next=/dashboard"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In as Needy Person / Beneficiary</span>
            </Link>

            <Link
              href="/login?role=donor&next=/dashboard"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Heart className="w-4 h-4" />
              <span>Sign In as Supporter / Donor</span>
            </Link>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  loginAsDemo("beneficiary");
                  router.refresh();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Explore with 1-Click Demo Beneficiary Account</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-around text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 0% Commission
            </span>
            <span className="flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-blue-400" /> Direct UPI
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> 4-Pillar Audit
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/10 shrink-0">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {profile?.full_name || (isBeneficiary ? "Beneficiary Account" : "Donor Account")}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isBeneficiary
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                }`}>
                  {isBeneficiary ? "Beneficiary / Needy Person" : "Philanthropic Donor"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  100% Direct Peer-to-Peer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.email || user?.email || "Registered User"}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(profile?.created_at || Date.now()).getFullYear()}
                </span>
              </p>
            </div>
          </div>

          {/* Top Actions: Record Transfer (for donor) / Apply for Relief (for beneficiary) + Sign Out */}
          <div className="flex items-center gap-2.5">
            {!isBeneficiary ? (
              <button
                type="button"
                onClick={() => setRecordModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record a Transfer</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setBeneficiaryTab("apply_appeal")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Apply for Relief</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ========================================================================= */}
        {/* VIEW 1: USER / BENEFICIARY (NEEDY PERSON APPLYING FOR AID) */}
        {/* ========================================================================= */}
        {isBeneficiary && (
          <div className="space-y-6">
            {/* Beneficiary Impact & Aid Status Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Direct Aid Received</span>
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatINR(totalAidReceived)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Goal: {formatINR(totalAidNeeded)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Appeals</span>
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {userCases.length} Appeals
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Registered under your account
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">4-Pillar Verification</span>
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {userCases.some((c) => c.status === "approved" || c.status === "funded")
                      ? "Approved Live"
                      : userCases.length > 0
                      ? "In Audit"
                      : "Ready to Apply"}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hospital bills & doctor audit
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
                    100% Direct
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Direct to your UPI/Bank without cut
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficiary Tab Navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setBeneficiaryTab("my_cases")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  beneficiaryTab === "my_cases"
                    ? "border-emerald-700 text-emerald-800"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Active Relief Appeals</span>
                <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {userCases.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBeneficiaryTab("apply_appeal")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  beneficiaryTab === "apply_appeal"
                    ? "border-emerald-700 text-emerald-800"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Apply for Relief / Submit Details</span>
              </button>

              <button
                type="button"
                onClick={() => setBeneficiaryTab("aid_ledger")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  beneficiaryTab === "aid_ledger"
                    ? "border-emerald-700 text-emerald-800"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Direct Transfers Received</span>
              </button>
            </div>

            {/* SUB-TAB 1: My Active Relief Appeals with 4-Pillar Tracker */}
            {beneficiaryTab === "my_cases" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Your Relief Applications</h2>
                    <p className="text-xs text-slate-500">
                      Track medical estimation checks, doctor verification, and direct donor QR activations.
                    </p>
                  </div>
                  <button
                    onClick={() => setBeneficiaryTab("apply_appeal")}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Apply for New Emergency Aid</span>
                  </button>
                </div>

                {dataLoading ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
                    <p className="text-xs font-medium">Loading your relief appeals...</p>
                  </div>
                ) : userCases.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">
                      No relief appeals registered yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                      If you or a loved one need emergency medical assistance, child surgery support, or critical accident care, submit your details and hospital bills for our 4-pillar verification.
                    </p>
                    <button
                      onClick={() => setBeneficiaryTab("apply_appeal")}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-1.5 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Apply for Emergency Relief</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userCases.map((c) => {
                      const percent = getProgress(c.amount_raised, c.amount_needed);
                      const isApproved = c.status === "approved" || c.status === "funded";
                      return (
                        <div
                          key={c.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                                {c.photo_url ? (
                                  <Image
                                    src={c.photo_url}
                                    alt={c.patient_name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Heart className="w-6 h-6 text-emerald-600 m-auto" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      c.status === "approved"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : c.status === "funded"
                                        ? "bg-purple-100 text-purple-800"
                                        : c.status === "rejected"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {c.status === "approved"
                                      ? "Verified & Live"
                                      : c.status === "funded"
                                      ? "100% Fully Funded"
                                      : c.status === "rejected"
                                      ? "Review Rejected"
                                      : "Audit In Progress"}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                                    {c.category}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(c.created_at).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  Patient: <strong className="text-slate-800">{c.patient_name}</strong> | Hospital:{" "}
                                  <span className="text-slate-800 font-medium">{c.hospital_name || c.city || "Civil Hospital"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setAttachDocModal(c.id)}
                                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>Attach Doctor Bill</span>
                              </button>
                              <Link
                                href={`/cases/${c.id}`}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Public Page</span>
                              </Link>
                            </div>
                          </div>

                          {/* 4-Pillar Verification Milestone Bar */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              4-Pillar Direct Verification Audit
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-[11px]">1. Identity & Aadhaar</span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 font-semibold ${
                                  isApproved ? "text-emerald-700" : "text-amber-700"
                                }`}
                              >
                                {isApproved ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                )}
                                <span className="text-[11px]">2. Doctor & Hospital Check</span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 font-semibold ${
                                  c.upi_id || c.bank_account ? "text-emerald-700" : "text-slate-400"
                                }`}
                              >
                                {c.upi_id || c.bank_account ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="text-[11px]">3. Direct UPI Validated</span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 font-semibold ${
                                  isApproved ? "text-emerald-700" : "text-slate-400"
                                }`}
                              >
                                {isApproved ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="text-[11px]">4. Live Directory QR</span>
                              </div>
                            </div>
                          </div>

                          {/* Aid Progress */}
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className="text-slate-900">
                                Transferred to Patient: {formatINR(c.amount_raised)}
                              </span>
                              <span className="text-slate-500">
                                Target Needed: {formatINR(c.amount_needed)} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Direct Bank & UPI Display */}
                          <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-slate-600 border-t border-slate-100">
                            <span className="flex items-center gap-1 font-mono">
                              <QrCode className="w-3.5 h-3.5 text-blue-600" />
                              UPI ID: <strong className="text-slate-900">{c.upi_id || "Direct Transfer Active"}</strong>
                            </span>
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Zero Commission Guarantee Active
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: Comprehensive Multi-Field Relief Application Form */}
            {beneficiaryTab === "apply_appeal" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      Zero Commission Direct Aid
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      100% Direct to Beneficiary UPI
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Apply for Emergency Relief / Submit Medical Case Details
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill out all details, upload doctor prescription, hospital estimation bill, patient photo, and appeal video. Our audit committee validates every case directly with the treating hospital.
                  </p>
                </div>

                {appealErrorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{appealErrorMsg}</span>
                  </div>
                )}

                {appealSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Appeal Submitted!
                    </p>
                    <p>{appealSuccessMsg}</p>
                  </div>
                )}

                <form onSubmit={handleSubmitAppeal} className="space-y-6">
                  {/* SECTION 1: Patient / Beneficiary Personal Details */}
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>1. Patient & Family Contact Details</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Patient / Needy Person Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Master Aarav Sharma"
                          value={appealForm.patientName}
                          onChange={(e) => setAppealForm({ ...appealForm, patientName: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Age (Years) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 6"
                          value={appealForm.age}
                          onChange={(e) => setAppealForm({ ...appealForm, age: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={appealForm.gender}
                          onChange={(e) =>
                            setAppealForm({
                              ...appealForm,
                              gender: e.target.value as "male" | "female" | "other",
                            })
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="male">Male (पुरुष)</option>
                          <option value="female">Female (महिला)</option>
                          <option value="other">Other (अन्य)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Contact Phone / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 9876543210"
                          value={appealForm.phone}
                          onChange={(e) => setAppealForm({ ...appealForm, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Indore / Bhopal"
                          value={appealForm.city}
                          onChange={(e) => setAppealForm({ ...appealForm, city: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Residential Address & Financial Condition Summary
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ward 12, Village Sanwer, Daily wage laborer with no health insurance"
                        value={appealForm.homeAddress}
                        onChange={(e) => setAppealForm({ ...appealForm, homeAddress: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: Medical Diagnosis & Hospital Details */}
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span>2. Medical Diagnosis & Treating Hospital Information</span>
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Appeal Title (Brief Medical Cause) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Urgent Open Heart Surgery (VSD Closure) for Master Aarav"
                        value={appealForm.title}
                        onChange={(e) => setAppealForm({ ...appealForm, title: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Cause Category *
                        </label>
                        <select
                          value={appealForm.category}
                          onChange={(e) =>
                            setAppealForm({ ...appealForm, category: e.target.value as Category })
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="medical">Medical (चिकित्सा / सर्जरी)</option>
                          <option value="accident">Accident & Trauma (दुर्घटना आपातकालीन)</option>
                          <option value="disability">Disability (दिव्यांग सहायता)</option>
                          <option value="education">Education (अनाथ / निर्धन शिक्षा)</option>
                          <option value="family">Family Crisis (पारिवारिक संकट)</option>
                          <option value="other">Other Relief (अन्य सहायता)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Urgency Level
                        </label>
                        <select
                          value={appealForm.urgency}
                          onChange={(e) =>
                            setAppealForm({
                              ...appealForm,
                              urgency: e.target.value as "high" | "medium" | "low",
                            })
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="high">Critical Emergency (Immediate Surgery / ICU)</option>
                          <option value="medium">High (Needed within 1-2 weeks)</option>
                          <option value="low">Standard Relief</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Hospital Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AIIMS / Medanta Hospital"
                          value={appealForm.hospitalName}
                          onChange={(e) => setAppealForm({ ...appealForm, hospitalName: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Treating Doctor Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. A. K. Verma"
                          value={appealForm.doctorName}
                          onChange={(e) => setAppealForm({ ...appealForm, doctorName: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Hospital Contact / Bed / IPD No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 0731-2555555 / IPD-928"
                          value={appealForm.hospitalContact}
                          onChange={(e) => setAppealForm({ ...appealForm, hospitalContact: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Detailed Diagnosis & Family Appeal Story *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Explain the patient's symptoms, required surgery/medication, total quotation from hospital, and why your family cannot afford it without donor assistance..."
                        value={appealForm.description}
                        onChange={(e) => setAppealForm({ ...appealForm, description: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* SECTION 3: Direct Financial & UPI Accounts */}
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>3. Direct Target Amount & Beneficiary Bank / UPI Accounts</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Apni Madad takes 0% cut. Donors scan your QR code and transfer funds directly to your UPI ID or hospital account.
                    </p>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Total Target Amount Needed for Treatment (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="500"
                        placeholder="e.g. 350000"
                        value={appealForm.amountNeeded}
                        onChange={(e) => setAppealForm({ ...appealForm, amountNeeded: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Direct Beneficiary UPI ID (For Instant QR Code) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. aaravfather@okaxis / 9876543210@paytm"
                          value={appealForm.upiId}
                          onChange={(e) => setAppealForm({ ...appealForm, upiId: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bank Account Holder Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Sharma"
                          value={appealForm.accountHolderName}
                          onChange={(e) => setAppealForm({ ...appealForm, accountHolderName: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 987654321012"
                          value={appealForm.bankAccount}
                          onChange={(e) => setAppealForm({ ...appealForm, bankAccount: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Confirm Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="Re-enter bank account number"
                          value={appealForm.confirmBankAccount}
                          onChange={(e) => setAppealForm({ ...appealForm, confirmBankAccount: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bank IFSC Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SBIN0001234"
                          value={appealForm.ifsc}
                          onChange={(e) => setAppealForm({ ...appealForm, ifsc: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono uppercase bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Direct Media & Documents Upload (Photo, Video, Hospital Bills) */}
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>4. Direct Uploads: Patient Photo, Video Appeal & Medical Proofs</span>
                    </h3>

                    {/* Patient Photo Upload with Live Thumbnail */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 relative">
                        {appealForm.photoUrl ? (
                          <>
                            <Image
                              src={appealForm.photoUrl}
                              alt="Patient Preview"
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setAppealForm({ ...appealForm, photoUrl: "" })}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <Upload className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                            <span className="text-[10px] block">No Photo</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-800">
                          Upload Patient / Beneficiary Photo (JPG / PNG)
                        </label>
                        <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingPhoto ? "Uploading Photo..." : "Choose Patient Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadPhoto}
                            disabled={uploadingPhoto}
                          />
                        </label>
                        <p className="text-[10px] text-slate-500">
                          Upload clear photo of the patient in hospital or at home.
                        </p>
                      </div>
                    </div>

                    {/* Video Appeal Upload */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-rose-600" />
                          <span>Patient / Family Video Appeal (Optional but recommended)</span>
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        A short 30-60 second video of the patient or family asking for help increases donor trust significantly.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition">
                            <Video className="w-4 h-4" />
                            <span>{uploadingVideo ? "Uploading Video..." : "Upload Video File (MP4/WebM)"}</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleUploadVideo}
                              disabled={uploadingVideo}
                            />
                          </label>
                        </div>
                        <div>
                          <input
                            type="url"
                            placeholder="Or paste YouTube / Google Drive video URL"
                            value={appealForm.videoUrl}
                            onChange={(e) => setAppealForm({ ...appealForm, videoUrl: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      {appealForm.videoUrl && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Video attached: {appealForm.videoUrl.slice(0, 50)}...
                        </p>
                      )}
                    </div>

                    {/* Document Uploads (Bills, Aadhaar, Doctor Prescriptions) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                          <span>Attach Medical Documents & Government Identity Proof</span>
                        </label>
                        <span className="text-[10px] font-bold text-slate-500">
                          {appealForm.documents.length} attached
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Document Type
                          </label>
                          <select
                            value={docCategory}
                            onChange={(e) => setDocCategory(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="Hospital Estimation Bill">Hospital Estimation Bill (अस्पताल कोटेशन / बिल)</option>
                            <option value="Aadhaar / Government ID Card">Aadhaar / Voter ID (पहचान पत्र)</option>
                            <option value="Doctor Prescription & Reports">Doctor Prescription & Reports (जांच रिपोर्ट)</option>
                            <option value="Bank Passbook / Cheque">Bank Passbook / Cheque (बैंक पासबुक)</option>
                            <option value="Ration Card / BPL Card">Ration Card / BPL (गरीबी रेखा प्रमाण)</option>
                            <option value="Other Medical Proof">Other Medical Proof (अन्य प्रमाण)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Choose File (PDF or Image)
                          </label>
                          <label className="inline-flex w-full items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingDoc ? "Uploading..." : `Upload ${docCategory}`}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={handleUploadDocument}
                              disabled={uploadingDoc}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Attached Documents List */}
                      {appealForm.documents.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-600 uppercase">Attached Verification Documents:</p>
                          {appealForm.documents.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-semibold text-slate-800 truncate">{doc.name}</span>
                                <span className="text-[10px] bg-white border text-slate-600 px-2 py-0.5 rounded-md font-mono shrink-0">
                                  {doc.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Notice & Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500">
                      By submitting, you certify all medical quotations and patient details are true and verified.
                    </span>
                    <button
                      type="submit"
                      disabled={appealSubmitting}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20"
                    >
                      {appealSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Case for 4-Pillar Verification...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Appeal for Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB-TAB 3: Direct Transfers Received & Donor Well Wishes */}
            {beneficiaryTab === "aid_ledger" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Direct Transfers Received</h2>
                  <p className="text-xs text-slate-500">
                    Direct UPI transactions and donations transferred to your registered beneficiary accounts.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{formatINR(totalAidReceived)}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cumulative direct support received across your registered appeals.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-2">
                    All transfers are received directly into your personal UPI ID / bank account. Apni Madad retains 0% commission.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DEDICATED DONOR DASHBOARD (SEE NEEDY CASES, DONATE DIRECTLY & TRACK) */}
        {/* ========================================================================= */}
        {!isBeneficiary && (
          <div className="space-y-6">
            {/* Donor Impact Metric Cards */}
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
                  <span className="text-xs font-bold uppercase tracking-wider">Direct Verification</span>
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    100% Direct
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Direct UPI &amp; hospital account transfers
                  </p>
                </div>
              </div>
            </div>

            {/* Donor Tab Navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setDonorTab("donations")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  donorTab === "donations"
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
                type="button"
                onClick={() => setDonorTab("updates")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  donorTab === "updates"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Patient Recovery Updates</span>
              </button>

              <button
                type="button"
                onClick={() => setDonorTab("urgent")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  donorTab === "urgent"
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
            </div>

            {/* Donor Sub-Tab 1: Direct Transfers & Receipts */}
            {donorTab === "donations" && (
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
                      When you donate directly to any verified patient via UPI QR, record your UTR reference to generate your official donation receipt and follow patient recovery updates.
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
                            <th className="py-3 px-4 font-bold text-right">Receipt</th>
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
                                    <span>Receipt</span>
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

            {/* Donor Sub-Tab 2: Patient Recovery Updates */}
            {donorTab === "updates" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Patient Recovery & Hospital Updates</h2>
                  <p className="text-xs text-slate-500">
                    Transparent milestones from treating doctors, surgery completions, and hospital discharge progress.
                  </p>
                </div>

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
              </div>
            )}

            {/* Donor Sub-Tab 1: Verified Needy Cases (See Needy & Donate Directly) */}
            {donorTab === "cases" && (
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Verified Needy Cases Awaiting Direct Aid
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      100% of your transfer goes straight to the patient&apos;s UPI or hospital. Zero middleman cuts.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search patient, hospital, city..."
                        value={donorSearch}
                        onChange={(e) => setDonorSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: "all", label: "All Categories" },
                    { id: "medical", label: "Medical Emergency" },
                    { id: "child", label: "Child Care & Pediatric" },
                    { id: "cancer", label: "Cancer Care" },
                    { id: "accident", label: "Accident / Trauma" },
                    { id: "education", label: "Education Relief" },
                    { id: "women", label: "Women & Family" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDonorCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-xs ${
                        donorCategory === cat.id
                          ? "bg-blue-700 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Cases Grid */}
                {dataLoading ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs font-medium">Loading verified needy cases...</p>
                  </div>
                ) : filteredDonorCases.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No cases found matching your criteria</h3>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the search or category filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDonorCases.map((c) => {
                      const pct = getProgress(c.amount_raised, c.amount_needed);
                      return (
                        <div
                          key={c.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Image Banner */}
                            <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                              {c.photo_url ? (
                                <Image
                                  src={c.photo_url}
                                  alt={c.patient_name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                                  <Heart className="w-12 h-12 text-slate-300" />
                                </div>
                              )}
                              <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                <span className="bg-blue-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {c.category}
                                </span>
                                {c.urgency === "high" && (
                                  <span className="bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    Urgent Critical
                                  </span>
                                )}
                              </div>
                              <div className="absolute bottom-2 right-2 bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>Verified UPI</span>
                              </div>
                            </div>

                            {/* Card Info */}
                            <div className="p-4 sm:p-5 space-y-3">
                              <div>
                                <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">
                                  {c.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-700">{c.patient_name}</span>
                                  {c.city && <span>• {c.city}</span>}
                                  {c.hospital_name && <span className="text-blue-700">• {c.hospital_name}</span>}
                                </p>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-emerald-700">{formatINR(c.amount_raised)} raised</span>
                                  <span className="text-slate-500">Goal: {formatINR(c.amount_needed)}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="text-[11px] text-slate-400 text-right">{pct}% funded</div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQrModal(c)}
                              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Donate via Direct UPI</span>
                            </button>
                            <Link
                              href={`/cases/${c.id}`}
                              className="py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition text-center"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* MODAL 1: Official Donation Receipt */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReceiptModal(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div id="print-receipt-area" className="border border-slate-300 rounded-2xl p-6 bg-slate-50/50 space-y-4">
              <div className="text-center border-b border-slate-300 pb-4">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                  Official Donation Receipt
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  APNI MADAD FOUNDATION
                </h3>
                <p className="text-[10px] text-slate-600">
                  100% Direct Peer-to-Peer Relief &amp; Emergency Assistance
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Verified Direct Contribution Voucher | Zero Platform Fee
                </p>
              </div>

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
                  <span className="text-slate-600">Patient / Purpose:</span>
                  <span className="font-bold text-blue-900">{receiptModal.cases?.patient_name || receiptModal.cases?.title || "Medical Aid Relief"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bank / UPI UTR:</span>
                  <span className="font-mono text-slate-800">{receiptModal.payment_ref || "Direct App Transfer"}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-300 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Amount Donated Directly</span>
                <span className="text-2xl font-black text-slate-900">{formatINR(receiptModal.amount)}</span>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">
                  100% Direct Transfer Verified without NGO deduction
                </p>
              </div>

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

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Save or print this receipt for your donation transfer records.
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
              If you scanned a patient&apos;s QR code on PhonePe, GPay, or Paytm, enter the UTR to reconcile and generate your verified donation receipt.
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
                      <span>Record Transfer & Save Receipt</span>
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
              Scan with Google Pay, PhonePe, Paytm, or BHIM. After paying, click &quot;Record Transfer&quot; above to save your verified donation receipt.
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
              <span>I Have Transferred - Save Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Attach Additional Medical Document to Existing Case */}
      {attachDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setAttachDocModal(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Attach Additional Medical Document / Doctor Bill
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload updated hospital estimation, diagnostic scan, or discharge note to keep your case verification verified.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={attachDocCategory}
                  onChange={(e) => setAttachDocCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Hospital Estimation Bill">Hospital Estimation Bill (अस्पताल बिल)</option>
                  <option value="Doctor Prescription & Reports">Doctor Prescription & Reports (जांच रिपोर्ट)</option>
                  <option value="Discharge Summary">Discharge Summary (छुट्टी पर्ची)</option>
                  <option value="Aadhaar / ID Card">Aadhaar / ID Card (पहचान पत्र)</option>
                  <option value="Other Proof">Other Proof (अन्य दस्तावेज)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Choose Document File (PDF or Image)
                </label>
                <label className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingAttachDoc ? "Uploading File..." : "Select Document File"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleAttachDocToExisting}
                    disabled={uploadingAttachDoc}
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAttachDocModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
