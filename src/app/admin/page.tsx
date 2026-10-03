"use client";

import { useState, useMemo, useEffect } from "react";
import { mockCases, formatINR, getProgress, Case, TopDonor } from "@/lib/mock-data";
import { submitVerificationReview } from "@/lib/actions/verification";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Edit3,
  Eye,
  Search,
  PlusCircle,
  TrendingUp,
  FileText,
  ExternalLink,
  Save,
  X,
  Sparkles,
  QrCode,
  Trash2,
  Sliders,
  Megaphone,
  UserPlus,
  PhoneCall,
  RotateCcw,
  Heart
} from "lucide-react";

export default function AdminPage() {
  const {
    donors,
    settings,
    updateDonor,
    addDonor,
    deleteDonor,
    resetDonors,
    updateSettings,
  } = useSiteSettings();

  const [adminSection, setAdminSection] = useState<"cases" | "website">("cases");
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [selected, setSelected] = useState<Case | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "funded" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newCaseModal, setNewCaseModal] = useState(false);

  // Live Donor Management state
  const [editingDonor, setEditingDonor] = useState<TopDonor | null>(null);
  const [newDonorModal, setNewDonorModal] = useState(false);
  const [donorForm, setDonorForm] = useState({
    name: "",
    amount: 10000,
    caseTitle: "Aarav Heart Surgery",
    photoUrl: "https://i.pravatar.cc/100?img=11",
  });

  // Website settings state
  const [settingsForm, setSettingsForm] = useState(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    amountRaised: 0,
    amountNeeded: 0,
    status: "" as Case["status"],
    upiId: "",
    bankAccount: "",
    ifsc: "",
    urgency: "medium" as Case["urgency"],
  });

  // New Case form state
  const [newCaseForm, setNewCaseForm] = useState({
    title: "",
    patientName: "",
    age: "",
    city: "",
    category: "medical" as Case["category"],
    amountNeeded: "",
    upiId: "",
    bankAccount: "",
    ifsc: "",
    description: "",
    urgency: "high" as Case["urgency"],
  });

  const [verificationChecklist, setVerificationChecklist] = useState({
    idVerified: true,
    medicalVerified: true,
    bankAccountVerified: true,
    fieldVisitDone: false,
  });
  const [verificationNotes, setVerificationNotes] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Donor & Website Management Handlers
  const handleOpenAddDonor = () => {
    setDonorForm({
      name: "",
      amount: 10000,
      caseTitle: cases[0]?.title || "Aarav Heart Surgery",
      photoUrl: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 50) + 1}`,
    });
    setEditingDonor(null);
    setNewDonorModal(true);
  };

  const handleOpenEditDonor = (donor: TopDonor) => {
    setEditingDonor(donor);
    setDonorForm({
      name: donor.name,
      amount: donor.amount,
      caseTitle: donor.caseTitle,
      photoUrl: donor.photoUrl,
    });
    setNewDonorModal(true);
  };

  const handleSaveDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorForm.name.trim()) {
      showToast("Please enter donor name.");
      return;
    }
    if (Number(donorForm.amount) <= 0) {
      showToast("Please enter a valid donation amount.");
      return;
    }

    if (editingDonor) {
      updateDonor(editingDonor.id, {
        name: donorForm.name.trim(),
        amount: Number(donorForm.amount),
        caseTitle: donorForm.caseTitle.trim(),
        photoUrl: donorForm.photoUrl.trim() || "https://i.pravatar.cc/100?img=11",
      });
      showToast(`Updated donor: ${donorForm.name}`);
    } else {
      addDonor({
        name: donorForm.name.trim(),
        amount: Number(donorForm.amount),
        caseTitle: donorForm.caseTitle.trim(),
        photoUrl: donorForm.photoUrl.trim() || "https://i.pravatar.cc/100?img=11",
      });
      showToast(`Added new donor to marquee: ${donorForm.name}`);
    }
    setNewDonorModal(false);
    setEditingDonor(null);
  };

  const handleDeleteDonor = (id: string, name: string) => {
    if (confirm(`Remove "${name}" from the live donor marquee ticker?`)) {
      deleteDonor(id);
      showToast(`Removed donor: ${name}`);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    showToast("Website announcements and helpline numbers saved successfully!");
  };

  // Status counts
  const pendingCount = cases.filter((c) => c.status === "pending").length;
  const approvedCount = cases.filter((c) => c.status === "approved").length;
  const fundedCount = cases.filter((c) => c.status === "funded").length;
  const rejectedCount = cases.filter((c) => c.status === "rejected" || c.status === "closed").length;
  const totalRaised = cases.reduce((sum, c) => sum + c.amountRaised, 0);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchTab =
        activeTab === "all"
          ? true
          : activeTab === "rejected"
          ? c.status === "rejected" || c.status === "closed"
          : c.status === activeTab;

      const matchSearch =
        search.trim() === "" ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.patientName.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [cases, activeTab, search]);

  const handleApprove = async (id: string) => {
    await submitVerificationReview({
      caseId: id,
      checklist: verificationChecklist,
      decision: "approved",
      decisionReason: verificationNotes || "Approved by NGO verification committee.",
      badges: ["id_verified", "hospital_verified", "zero_commission_guarantee"],
      reviewerName: "NGO Administrator",
    });
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "approved", verified: true } : c))
    );
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status: "approved", verified: true } : null));
    }
    showToast("Case verified & published live! Beneficiary notified.");
  };

  const handleReject = async (id: string) => {
    await submitVerificationReview({
      caseId: id,
      checklist: verificationChecklist,
      decision: "rejected",
      decisionReason: verificationNotes || "Documents incomplete or invalid.",
      badges: [],
      reviewerName: "NGO Administrator",
    });
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "rejected", verified: false } : c))
    );
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status: "rejected", verified: false } : null));
    }
    showToast("Case rejected. Notification sent to beneficiary.");
  };

  const openEdit = (c: Case) => {
    setSelected(c);
    setEditForm({
      amountRaised: c.amountRaised,
      amountNeeded: c.amountNeeded,
      status: c.status,
      upiId: c.upiId,
      bankAccount: c.bankAccount,
      ifsc: c.ifsc,
      urgency: c.urgency,
    });
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              amountRaised: Number(editForm.amountRaised),
              amountNeeded: Number(editForm.amountNeeded),
              status: editForm.status,
              upiId: editForm.upiId,
              bankAccount: editForm.bankAccount,
              ifsc: editForm.ifsc,
              urgency: editForm.urgency,
              verified: editForm.status === "approved" || editForm.status === "funded",
            }
          : c
      )
    );
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            amountRaised: Number(editForm.amountRaised),
            amountNeeded: Number(editForm.amountNeeded),
            status: editForm.status,
            upiId: editForm.upiId,
            bankAccount: editForm.bankAccount,
            ifsc: editForm.ifsc,
            urgency: editForm.urgency,
            verified: editForm.status === "approved" || editForm.status === "funded",
          }
        : null
    );
    setEditMode(false);
    showToast("Case details and payment accounts updated successfully!");
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: Case = {
      id: `case-${Date.now().toString().slice(-4)}`,
      title: newCaseForm.title,
      titleHi: newCaseForm.title,
      description: newCaseForm.description,
      descriptionHi: newCaseForm.description,
      patientName: newCaseForm.patientName,
      age: Number(newCaseForm.age),
      ageGroup: Number(newCaseForm.age) < 18 ? "child" : Number(newCaseForm.age) > 60 ? "elderly" : "adult",
      city: newCaseForm.city,
      category: newCaseForm.category,
      amountNeeded: Number(newCaseForm.amountNeeded),
      amountRaised: 0,
      status: "approved",
      verified: true,
      photoUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=400&fit=crop",
      documents: [{ name: "Verified Hospital Bill Estimate", type: "pdf", url: "#" }],
      upiId: newCaseForm.upiId,
      bankAccount: newCaseForm.bankAccount,
      ifsc: newCaseForm.ifsc,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=${encodeURIComponent(newCaseForm.upiId)}`,
      createdAt: new Date().toISOString().split("T")[0],
      urgency: newCaseForm.urgency,
    };

    setCases([newCase, ...cases]);
    setNewCaseModal(false);
    showToast("New case created, verified, and published live!");
    setNewCaseForm({
      title: "",
      patientName: "",
      age: "",
      city: "",
      category: "medical",
      amountNeeded: "",
      upiId: "",
      bankAccount: "",
      ifsc: "",
      description: "",
      urgency: "high",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-modal border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      {/* Admin Top Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Foundation Administrator Access</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {adminSection === "cases"
                  ? "Admin Verification Dashboard"
                  : "Live Donors & Website Control Center"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {adminSection === "cases"
                  ? "Verify beneficiary hospital documents, authorize zero-commission cases, and update target amounts."
                  : "Full administrative control to edit the live generous donors marquee ticker, emergency alert banners, and official helplines."}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {adminSection === "cases" ? (
                <button
                  type="button"
                  onClick={() => setNewCaseModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Verified Case</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddDonor}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Generous Donor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Reset live donors marquee to default list?")) {
                        resetDonors();
                        showToast("Live donors marquee restored to defaults.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    title="Reset to Defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset Defaults</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-2.5 border-t border-slate-100 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setAdminSection("cases")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                adminSection === "cases"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cases & Medical Verifications</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  adminSection === "cases"
                    ? "bg-blue-800 text-white"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {pendingCount} Pending
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminSection("website")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                adminSection === "website"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Live Donors & Website Control</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  adminSection === "website"
                    ? "bg-slate-800 text-amber-300"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {donors.length} Donors
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {adminSection === "cases" ? (
          <>
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Requires document verification</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Verified</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">{approvedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Accepting direct UPI transfers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Fully Funded</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{fundedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Goals met directly</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Direct Aid Transferred</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 truncate">
              {formatINR(totalRaised)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">₹0 commission retained</p>
          </div>
        </div>

        {/* Tabbed Navigation + Search Controls */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden mb-8">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Pending ({pendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "approved"
                    ? "bg-blue-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Active ({approvedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("funded")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "funded"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Funded ({fundedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("rejected")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "rejected"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Rejected ({rejectedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "all"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>All ({cases.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                placeholder="Search patient, title or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Cases Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Case & Beneficiary</th>
                  <th className="px-4 py-3.5">Category & City</th>
                  <th className="px-4 py-3.5">Raised / Needed</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No cases found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {
                    const prog = getProgress(c.amountRaised, c.amountNeeded);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <Image src={c.photoUrl} alt="" fill className="object-cover" />
                            </div>
                            <div className="min-w-0 max-w-[240px]">
                              <div className="font-bold text-slate-900 truncate">{c.title}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-slate-700">{c.patientName}</span>
                                <span>({c.age} yrs)</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="capitalize font-semibold text-slate-800 block">{c.category}</span>
                          <span className="text-xs text-slate-500">{c.city}</span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900">
                            {formatINR(c.amountRaised)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Target: {formatINR(c.amountNeeded)} ({prog}%)
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, prog)}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.status === "pending"
                                ? "bg-amber-100 text-amber-800 animate-pulse"
                                : c.status === "funded"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {c.status === "approved" && <ShieldCheck className="w-3.5 h-3.5" />}
                            {c.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                            {c.status === "funded" && <Sparkles className="w-3.5 h-3.5" />}
                            <span className="capitalize">{c.status}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(c);
                                setEditMode(false);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                              title="Review Case"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition"
                              title="Edit Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {c.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(c.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                                  title="Approve & Verify"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(c.id)}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
                                  title="Reject Case"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <Link
                              href={`/cases/${c.id}`}
                              target="_blank"
                              className="px-2 py-1.5 text-slate-400 hover:text-slate-700 transition"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    ) : (
      /* Live Donors & Website Control Section */
      <div className="space-y-8">
        {/* Recent Generous Donors Manager */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-t-3xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Recent Generous Donors (Live Homepage Ticker)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Full control to add, edit names, modify contribution amounts, or remove donors. Updates the live marquee across the entire website instantaneously.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-slate-400">Total Live:</span>{" "}
                <strong className="text-amber-400">{donors.length} Donors</strong>
              </div>
              <button
                type="button"
                onClick={handleOpenAddDonor}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Donor</span>
              </button>
            </div>
          </div>

          {/* Donors Grid */}
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((d) => (
                <div
                  key={d.id}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 transition shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-200">
                      <Image
                        src={d.photoUrl}
                        alt={d.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {d.name}
                      </h4>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">
                        {formatINR(d.amount)}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Case: {d.caseTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditDonor(d)}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                      title="Edit Donor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDonor(d.id, d.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete Donor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcement & Emergency Banner Settings */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Emergency Alert & Top Announcement Bar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Display emergency relief notices or platform updates across the very top of all website pages.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.announcement.enabled}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    announcement: {
                      ...settingsForm.announcement,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-700">
                {settingsForm.announcement.enabled ? "Active Banner" : "Hidden"}
              </span>
            </label>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Announcement Message
              </label>
              <input
                type="text"
                value={settingsForm.announcement.message}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    announcement: {
                      ...settingsForm.announcement,
                      message: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Urgent Medical Appeal: ICU & pediatric cardiac cases verified for direct transfer."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Button Text (Optional)
                </label>
                <input
                  type="text"
                  value={settingsForm.announcement.linkText || ""}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      announcement: {
                        ...settingsForm.announcement,
                        linkText: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. View Cases"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Link URL
                </label>
                <input
                  type="text"
                  value={settingsForm.announcement.linkUrl || ""}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      announcement: {
                        ...settingsForm.announcement,
                        linkUrl: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. /cases"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Save Announcement Settings
              </button>
            </div>
          </form>
        </div>

        {/* Helplines & Impact Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Helplines */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Official Helplines & WhatsApp
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configures the zero-cost 1-Tap WhatsApp verification and contact links.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Support Phone Number
                </label>
                <input
                  type="text"
                  value={settingsForm.helplinePhone}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, helplinePhone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official WhatsApp Number (Country code without +)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                    +
                  </span>
                  <input
                    type="text"
                    value={settingsForm.whatsappHelpline}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        whatsappHelpline: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current Helpline: +{settingsForm.whatsappHelpline}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Helplines
                </button>
              </div>
            </form>
          </div>

          {/* Impact Numbers */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Transparency Metrics & Statistics
                </h3>
                <p className="text-[11px] text-slate-500">
                  Impact counters displayed to reinforce donor trust.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Lives Impacted
                </label>
                <input
                  type="number"
                  value={settingsForm.totalLivesImpacted}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      totalLivesImpacted: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Direct Aid Transferred (in ₹)
                </label>
                <input
                  type="number"
                  value={settingsForm.totalDirectTransferred}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      totalDirectTransferred: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  Formatted Display: {formatINR(settingsForm.totalDirectTransferred)}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Statistics
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
  </main>

      {/* Review / Edit Case Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl animate-modal relative">
            <button
              onClick={() => {
                setSelected(null);
                setEditMode(false);
              }}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {!editMode ? (
              /* Review Mode */
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selected.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : selected.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {selected.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">#{selected.id}</span>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image src={selected.photoUrl} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {selected.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selected.patientName} · {selected.age} yrs · {selected.city} · {selected.category}
                    </p>
                    <div className="mt-2 text-xs font-bold text-emerald-700">
                      Target: {formatINR(selected.amountNeeded)} | Raised: {formatINR(selected.amountRaised)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                  <strong>Case Background:</strong>
                  <p className="mt-1">{selected.description}</p>
                </div>

                {/* Direct Payment Accounts Verification */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-700" />
                    <span>Direct Beneficiary Payment Destination</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 font-mono">
                    <div><strong>UPI ID:</strong> {selected.upiId}</div>
                    <div><strong>Account No:</strong> {selected.bankAccount}</div>
                    <div><strong>IFSC:</strong> {selected.ifsc}</div>
                    <div><strong>Urgency:</strong> {selected.urgency.toUpperCase()}</div>
                  </div>
                </div>

                {/* 4-Pillar Verification Checklist */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-3">
                  <div className="font-bold text-blue-950 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>NGO 4-Pillar Verification Checklist</span>
                    </div>
                    <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      Mandatory Checks
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-slate-800">
                    <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={verificationChecklist.idVerified}
                        onChange={(e) =>
                          setVerificationChecklist({
                            ...verificationChecklist,
                            idVerified: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>1. Govt ID / Aadhaar Verified</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={verificationChecklist.medicalVerified}
                        onChange={(e) =>
                          setVerificationChecklist({
                            ...verificationChecklist,
                            medicalVerified: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>2. Hospital Bill & Estimate</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={verificationChecklist.bankAccountVerified}
                        onChange={(e) =>
                          setVerificationChecklist({
                            ...verificationChecklist,
                            bankAccountVerified: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>3. Direct UPI & Bank Match</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={verificationChecklist.fieldVisitDone}
                        onChange={(e) =>
                          setVerificationChecklist({
                            ...verificationChecklist,
                            fieldVisitDone: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>4. Field Check / Video Call</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Verification Remarks / Feedback
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified with KGMU hospital desk on 28 Aug."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Documents List */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>Attached Medical Verification Documents ({selected.documents.length})</span>
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {selected.documents.map((d, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-semibold truncate">{d.name}</span>
                        <span className="text-emerald-700 font-bold">Authenticated</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {selected.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(selected.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve & Publish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(selected.id)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(selected)}
                      className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Financials</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Edit Case Details & Payment Accounts</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount Raised (₹)</label>
                    <input
                      type="number"
                      value={editForm.amountRaised}
                      onChange={(e) => setEditForm({ ...editForm, amountRaised: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Needed (₹)</label>
                    <input
                      type="number"
                      value={editForm.amountNeeded}
                      onChange={(e) => setEditForm({ ...editForm, amountNeeded: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Case["status"] })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved / Active</option>
                      <option value="funded">Funded</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Urgency</label>
                    <select
                      value={editForm.urgency}
                      onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value as Case["urgency"] })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary UPI ID</label>
                  <input
                    type="text"
                    value={editForm.upiId}
                    onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={editForm.bankAccount}
                      onChange={(e) => setEditForm({ ...editForm, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={editForm.ifsc}
                      onChange={(e) => setEditForm({ ...editForm, ifsc: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Add New Case Modal */}
      {newCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl animate-modal relative">
            <button
              onClick={() => setNewCaseModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Publish New Verified Case</h3>
            <p className="text-xs text-slate-500 mb-5">
              Add a case verified directly by field audit. It will be published immediately to the public directory.
            </p>

            <form onSubmit={handleCreateCase} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent heart surgery for 6yo child"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient / Beneficiary Name</label>
                  <input
                    type="text"
                    required
                    value={newCaseForm.patientName}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, patientName: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={newCaseForm.age}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, age: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newCaseForm.city}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCaseForm.category}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, category: e.target.value as Case["category"] })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="medical">Medical</option>
                    <option value="education">Education</option>
                    <option value="accident">Accident</option>
                    <option value="disability">Disability</option>
                    <option value="family">Family Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Amount Needed (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 250000"
                  value={newCaseForm.amountNeeded}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, amountNeeded: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary UPI ID</label>
                  <input
                    type="text"
                    required
                    placeholder="name@okaxis"
                    value={newCaseForm.upiId}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, upiId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank A/C No.</label>
                  <input
                    type="text"
                    required
                    value={newCaseForm.bankAccount}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={newCaseForm.ifsc}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, ifsc: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Description & Medical Diagnosis</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide background, doctor diagnosis, hospital name, and family financial condition..."
                  value={newCaseForm.description}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCaseModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold"
                >
                  Publish Verified Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Generous Donor Modal */}
      {newDonorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-modal relative">
            <button
              onClick={() => {
                setNewDonorModal(false);
                setEditingDonor(null);
              }}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Heart className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingDonor ? "Edit Generous Donor" : "Add Generous Donor to Ticker"}
                </h3>
                <p className="text-xs text-slate-500">
                  Featured live in the infinite marquee ticker across the entire website.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDonor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Donor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                  placeholder="e.g. Rajesh Gupta or Anonymous Donor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contribution Amount (in ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min={100}
                    value={donorForm.amount}
                    onChange={(e) =>
                      setDonorForm({ ...donorForm, amount: Number(e.target.value) })
                    }
                    placeholder="50000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 font-bold text-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supported Case / Appeal Title *
                </label>
                <input
                  type="text"
                  required
                  value={donorForm.caseTitle}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, caseTitle: e.target.value })
                  }
                  placeholder="e.g. Aarav Heart Surgery or General Medical Fund"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Donor Photo / Avatar URL
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-100">
                    <Image
                      src={donorForm.photoUrl || "https://i.pravatar.cc/100?img=11"}
                      alt="Preview"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <input
                    type="url"
                    value={donorForm.photoUrl}
                    onChange={(e) =>
                      setDonorForm({ ...donorForm, photoUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewDonorModal(false);
                    setEditingDonor(null);
                  }}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {editingDonor ? "Save Changes" : "Publish to Live Ticker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
