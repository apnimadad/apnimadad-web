"use client";

import { useState, useMemo, useEffect } from "react";
import { formatINR, getProgress } from "@/lib/format";
import { Case, TopDonor, ConfidentialCaseItem } from "@/types/database";
import {
  getAllCasesAdmin,
  submitCase,
  updateCase,
  approveCase,
  rejectCase,
  deleteCase,
  deleteCasesBulk,
  updateCasesBulk,
  getConfidentialCases,
} from "@/lib/actions/cases";
import { submitVerificationReview } from "@/lib/actions/verification";
import { useSiteSettings } from "@/components/SiteSettingsContext";
import { useLanguage } from "@/components/LanguageContext";
import AdminExportCenter from "./AdminExportCenter";
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
  Heart,
  Lock,
  EyeOff,
  ShieldAlert,
  MessageCircle,
  AlertTriangle,
  UserCheck,
  Globe,
  Upload,
  Paperclip,
  FileUp,
  HardDrive,
} from "lucide-react";

type AdminCase = Case & {
  patientName: string;
  amountRaised: number;
  amountNeeded: number;
  photoUrl: string;
  upiId: string;
  bankAccount: string;
};

function normalizeAdminCase(c: Case | (Case & Partial<AdminCase>)): AdminCase {
  const custom = c as Case & Partial<AdminCase>;
  return {
    ...c,
    patientName: c.patient_name || custom.patientName || "Beneficiary",
    patient_name: c.patient_name || custom.patientName || "Beneficiary",
    amountRaised: Number(c.amount_raised ?? custom.amountRaised ?? 0),
    amount_raised: Number(c.amount_raised ?? custom.amountRaised ?? 0),
    amountNeeded: Number(c.amount_needed ?? custom.amountNeeded ?? 0),
    amount_needed: Number(c.amount_needed ?? custom.amountNeeded ?? 0),
    photoUrl:
      c.photo_url ||
      custom.photoUrl ||
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=400&fit=crop",
    photo_url:
      c.photo_url ||
      custom.photoUrl ||
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=400&fit=crop",
    upiId: c.upi_id || custom.upiId || "",
    upi_id: c.upi_id || custom.upiId || "",
    bankAccount: c.bank_account || custom.bankAccount || "",
    bank_account: c.bank_account || custom.bankAccount || "",
    ifsc: c.ifsc || "",
    city: c.city || "India",
  };
}

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

  const { lang, setLang } = useLanguage();

  const [adminSection, setAdminSection] = useState<"cases" | "confidential" | "exports" | "website">("cases");
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [selected, setSelected] = useState<AdminCase | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "funded" | "rejected" | "all">("all");
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newCaseModal, setNewCaseModal] = useState(false);

  // Confidential Cases state
  const [confidentialCases, setConfidentialCases] = useState<ConfidentialCaseItem[]>([]);
  const [confidentialFilter, setConfidentialFilter] = useState<"all" | "women_help" | "satta_mukt" | "urgent">("all");
  const [confidentialSearch, setConfidentialSearch] = useState("");
  const [selectedConfidential, setSelectedConfidential] = useState<ConfidentialCaseItem | null>(null);
  const [counselorNoteInput, setCounselorNoteInput] = useState("");

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

  const loadAdminCases = async () => {
    try {
      const data = await getAllCasesAdmin();
      if (data && data.length > 0) {
        setCases(data.map(normalizeAdminCase));
      } else {
        setCases([]);
      }
    } catch (err) {
      console.error("loadAdminCases error:", err);
      setCases([]);
    }
  };

  const loadConfidential = async () => {
    try {
      const data = await getConfidentialCases();
      setConfidentialCases(data || []);
    } catch (err) {
      console.error("loadConfidential error:", err);
      setConfidentialCases([]);
    }
  };

  useEffect(() => {
    loadAdminCases();
    loadConfidential();
  }, []);

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

  // Case selection and bulk operations state
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // New Case form state with all needy details and direct uploads
  const [newCaseForm, setNewCaseForm] = useState({
    title: "",
    title_hi: "",
    patientName: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    phone: "",
    city: "",
    state: "Madhya Pradesh",
    category: "medical" as Case["category"],
    urgency: "high" as Case["urgency"],
    amountNeeded: "",
    hospitalName: "",
    doctorName: "",
    hospitalContact: "",
    upiId: "",
    bankAccount: "",
    ifsc: "",
    description: "",
    description_hi: "",
    photoUrl: "",
    documents: [] as { name: string; type: string; url: string }[],
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docCategory, setDocCategory] = useState<string>("Hospital Estimation Bill");

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
        (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
        (c.patientName && c.patientName.toLowerCase().includes(search.toLowerCase())) ||
        (c.city && c.city.toLowerCase().includes(search.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(search.toLowerCase()));

      return matchTab && matchSearch;
    });
  }, [cases, activeTab, search]);

  // Filtered Confidential Cases
  const filteredConfidential = useMemo(() => {
    return confidentialCases.filter((c) => {
      const matchCat =
        confidentialFilter === "all"
          ? true
          : confidentialFilter === "women_help"
          ? c.category === "women_help" || c.confidentialCategory === "women_help"
          : confidentialFilter === "satta_mukt"
          ? c.category === "satta_mukt" || c.confidentialCategory === "satta_mukt"
          : c.status === "pending" || c.urgency === "high";

      const q = confidentialSearch.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.aliasName && c.aliasName.toLowerCase().includes(q)) ||
        (c.realName && c.realName.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.contactPhone && c.contactPhone.includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [confidentialCases, confidentialFilter, confidentialSearch]);

  const womenCount = confidentialCases.filter(
    (c) => c.category === "women_help" || c.confidentialCategory === "women_help"
  ).length;
  const sattaCount = confidentialCases.filter(
    (c) => c.category === "satta_mukt" || c.confidentialCategory === "satta_mukt"
  ).length;
  const pendingCallsCount = confidentialCases.filter((c) => c.status === "pending").length;

  const handleUpdateConfidentialStatus = (id: string, newStatus: string) => {
    setConfidentialCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (selectedConfidential && selectedConfidential.id === id) {
      setSelectedConfidential((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(
      lang === "hi"
        ? `स्थिति अपडेट की गई: ${newStatus}`
        : `Status updated: ${newStatus}`
    );
  };

  const handleAddCounselorNote = (id: string, note: string) => {
    if (!note.trim()) return;
    setConfidentialCases((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              counselorNotes: c.counselorNotes ? `${c.counselorNotes} | ${note}` : note,
            }
          : c
      )
    );
    if (selectedConfidential && selectedConfidential.id === id) {
      setSelectedConfidential((prev) =>
        prev
          ? {
              ...prev,
              counselorNotes: prev.counselorNotes ? `${prev.counselorNotes} | ${note}` : note,
            }
          : null
      );
    }
    setCounselorNoteInput("");
    showToast(
      lang === "hi"
        ? "काउंसलर नोट सुरक्षित किया गया।"
        : "Counselor internal note saved."
    );
  };

  const handleApprove = async (id: string) => {
    await submitVerificationReview({
      caseId: id,
      checklist: verificationChecklist,
      decision: "approved",
      decisionReason: verificationNotes || "Approved by NGO verification committee.",
      badges: ["id_verified", "hospital_verified", "zero_commission_guarantee"],
      reviewerName: "NGO Administrator",
    });
    await approveCase(id);
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "approved", verified: true } : c))
    );
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status: "approved", verified: true } : null));
    }
    showToast("Case verified & published live in Supabase! Beneficiary notified.");
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
    await rejectCase(id);
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "rejected", verified: false } : c))
    );
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status: "rejected", verified: false } : null));
    }
    showToast("Case rejected. Notification sent to beneficiary.");
  };

  const openEdit = (c: AdminCase) => {
    setSelected(c);
    setEditForm({
      amountRaised: Number(c.amount_raised ?? c.amountRaised ?? 0),
      amountNeeded: Number(c.amount_needed ?? c.amountNeeded ?? 0),
      status: c.status,
      upiId: c.upi_id || c.upiId || "",
      bankAccount: c.bank_account || c.bankAccount || "",
      ifsc: c.ifsc || "",
      urgency: c.urgency || "medium",
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    await updateCase(selected.id, {
      amount_raised: Number(editForm.amountRaised),
      amount_needed: Number(editForm.amountNeeded),
      status: editForm.status,
      upi_id: editForm.upiId,
      bank_account: editForm.bankAccount,
      ifsc: editForm.ifsc,
      urgency: editForm.urgency,
      verified: editForm.status === "approved" || editForm.status === "funded",
    });
    setCases((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? normalizeAdminCase({
              ...c,
              amountRaised: Number(editForm.amountRaised),
              amountNeeded: Number(editForm.amountNeeded),
              status: editForm.status,
              upiId: editForm.upiId,
              bankAccount: editForm.bankAccount,
              ifsc: editForm.ifsc,
              urgency: editForm.urgency,
              verified: editForm.status === "approved" || editForm.status === "funded",
            })
          : c
      )
    );
    setSelected((prev) =>
      prev
        ? normalizeAdminCase({
            ...prev,
            amountRaised: Number(editForm.amountRaised),
            amountNeeded: Number(editForm.amountNeeded),
            status: editForm.status,
            upiId: editForm.upiId,
            bankAccount: editForm.bankAccount,
            ifsc: editForm.ifsc,
            urgency: editForm.urgency,
            verified: editForm.status === "approved" || editForm.status === "funded",
          })
        : null
    );
    setEditMode(false);
    showToast("Case details and payment accounts updated successfully in Supabase!");
  };

  // Photo & Document Upload handlers for Admin Case creation
  const handleUploadBeneficiaryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "case-photos");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setNewCaseForm((prev) => ({ ...prev, photoUrl: data.url }));
        showToast(lang === "hi" ? "मरीज का फोटो सफलतापूर्वक अपलोड हो गया!" : "Beneficiary photo uploaded successfully!");
      } else {
        showToast(`Photo upload error: ${data.error || "Failed"}`);
      }
    } catch (err: unknown) {
      showToast(`Upload failed: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setUploadingPhoto(false);
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const docItem = {
          name: file.name,
          type: docCategory,
          url: data.url,
        };
        setNewCaseForm((prev) => ({
          ...prev,
          documents: [...prev.documents, docItem],
        }));
        showToast(
          lang === "hi"
            ? `${docCategory} दस्तावेज अपलोड हो गया!`
            : `${docCategory} uploaded successfully!`
        );
        e.target.value = "";
      } else {
        showToast(`Document upload error: ${data.error || "Failed"}`);
      }
    } catch (err: unknown) {
      showToast(`Upload failed: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = (index: number) => {
    setNewCaseForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  // Case Selection and Bulk Actions Handlers
  const handleSelectAll = () => {
    if (selectedCaseIds.length === filteredCases.length && filteredCases.length > 0) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(filteredCases.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = async (c: AdminCase) => {
    const confirmMsg =
      lang === "hi"
        ? `क्या आप वास्तव में "${c.title}" केस को स्थायी रूप से हटाना चाहते हैं?`
        : `Are you sure you want to permanently delete case "${c.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    const res = await deleteCase(c.id);
    if (res.success) {
      setCases((prev) => prev.filter((item) => item.id !== c.id));
      setSelectedCaseIds((prev) => prev.filter((id) => id !== c.id));
      if (selected?.id === c.id) setSelected(null);
      showToast(
        lang === "hi"
          ? "केस को स्थायी रूप से हटा दिया गया।"
          : "Case permanently deleted from database."
      );
    } else {
      showToast(`Delete failed: ${res.error || "Unknown error"}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCaseIds.length === 0) return;
    const count = selectedCaseIds.length;
    const confirmMsg =
      lang === "hi"
        ? `क्या आप चयनित ${count} मामलों को स्थायी रूप से हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।`
        : `Are you sure you want to permanently delete ${count} selected case(s)? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    try {
      const res = await deleteCasesBulk(selectedCaseIds);
      if (res.success) {
        setCases((prev) => prev.filter((c) => !selectedCaseIds.includes(c.id)));
        if (selected && selectedCaseIds.includes(selected.id)) setSelected(null);
        setSelectedCaseIds([]);
        showToast(
          lang === "hi"
            ? `${count} केस सफलतापूर्वक हटा दिए गए।`
            : `${count} case(s) permanently deleted.`
        );
      } else {
        showToast(`Bulk delete error: ${res.error || "Failed"}`);
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedCaseIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await updateCasesBulk(selectedCaseIds, "approved");
      if (res.success) {
        setCases((prev) =>
          prev.map((c) =>
            selectedCaseIds.includes(c.id) ? { ...c, status: "approved", verified: true } : c
          )
        );
        setSelectedCaseIds([]);
        showToast(
          lang === "hi"
            ? "चयनित मामलों को सत्यापित व स्वीकृत कर दिया गया।"
            : `${selectedCaseIds.length} case(s) marked as Approved.`
        );
      } else {
        showToast(`Bulk approve error: ${res.error || "Failed"}`);
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedCaseIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await updateCasesBulk(selectedCaseIds, "rejected");
      if (res.success) {
        setCases((prev) =>
          prev.map((c) =>
            selectedCaseIds.includes(c.id) ? { ...c, status: "rejected", verified: false } : c
          )
        );
        setSelectedCaseIds([]);
        showToast(
          lang === "hi"
            ? "चयनित मामलों को अस्वीकृत कर दिया गया।"
            : `${selectedCaseIds.length} case(s) marked as Rejected.`
        );
      } else {
        showToast(`Bulk reject error: ${res.error || "Failed"}`);
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.title.trim() || !newCaseForm.patientName.trim()) {
      showToast(lang === "hi" ? "कृपया शीर्षक और लाभार्थी का नाम दर्ज करें।" : "Please enter title and beneficiary name.");
      return;
    }
    if (!newCaseForm.amountNeeded || Number(newCaseForm.amountNeeded) <= 0) {
      showToast(lang === "hi" ? "कृपया मान्य सहायता राशि दर्ज करें।" : "Please enter a valid target amount.");
      return;
    }

    const res = await submitCase({
      title: newCaseForm.title,
      title_hi: newCaseForm.title_hi || undefined,
      description: newCaseForm.description,
      description_hi: newCaseForm.description_hi || undefined,
      patient_name: newCaseForm.patientName,
      age: newCaseForm.age ? Number(newCaseForm.age) : undefined,
      city: newCaseForm.city || undefined,
      category: newCaseForm.category,
      amount_needed: Number(newCaseForm.amountNeeded),
      upi_id: newCaseForm.upiId || undefined,
      bank_account: newCaseForm.bankAccount || undefined,
      ifsc: newCaseForm.ifsc || undefined,
      phone: newCaseForm.phone || undefined,
      hospital_name: newCaseForm.hospitalName || undefined,
      doctor_name: newCaseForm.doctorName || undefined,
      hospital_contact: newCaseForm.hospitalContact || undefined,
      photo_url: newCaseForm.photoUrl || undefined,
      documents: newCaseForm.documents,
      urgency: newCaseForm.urgency,
    });

    if (res.success && res.id) {
      await approveCase(res.id);
      await loadAdminCases();
      setNewCaseModal(false);
      showToast(
        lang === "hi"
          ? "नया केस सफलतापूर्वक बनाया गया, दस्तावेज सहेजे गए और लाइव प्रकाशित हुआ!"
          : "New verified case published live with all uploaded documents!"
      );
      setNewCaseForm({
        title: "",
        title_hi: "",
        patientName: "",
        age: "",
        gender: "male",
        phone: "",
        city: "",
        state: "Madhya Pradesh",
        category: "medical",
        urgency: "high",
        amountNeeded: "",
        hospitalName: "",
        doctorName: "",
        hospitalContact: "",
        upiId: "",
        bankAccount: "",
        ifsc: "",
        description: "",
        description_hi: "",
        photoUrl: "",
        documents: [],
      });
    } else {
      showToast(`Error creating case: ${res.error || "Failed"}`);
    }
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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>
                  {lang === "hi"
                    ? "फाउंडेशन एडमिनिस्ट्रेटर एक्सेस"
                    : "Foundation Administrator Access"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {adminSection === "cases"
                  ? (lang === "hi"
                      ? "केस व चिकित्सा सत्यापन डैशबोर्ड"
                      : "Admin Verification Dashboard")
                  : adminSection === "confidential"
                  ? (lang === "hi"
                      ? "गोपनीय सहायता केंद्र (Woman Help व सट्टा मुक्त)"
                      : "Confidential Support Desk (Women Help & De-Addiction)")
                  : adminSection === "exports"
                  ? (lang === "hi"
                      ? "डेटा निर्यात व मीडिया डाउनलोड हब (CSV / MP4 / PDF)"
                      : "Backend Data Export & Media Vault (CSV / MP4 / PDF)")
                  : (lang === "hi"
                      ? "लाइव दानकर्ता व वेबसाइट नियंत्रण केंद्र"
                      : "Live Donors & Website Control Center")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {adminSection === "cases"
                  ? (lang === "hi"
                      ? "लाभार्थियों के अस्पताल दस्तावेजों का सत्यापन करें, शून्य-कमीशन मामलों को स्वीकृति दें।"
                      : "Verify beneficiary hospital documents, authorize zero-commission cases, and update target amounts.")
                  : adminSection === "confidential"
                  ? (lang === "hi"
                      ? "100% गोपनीय व सुरक्षित सहायता - महिला सुरक्षा और सट्टा मुक्ति परामर्श की आंतरिक निगरानी (पब्लिक ऑडियंस से पूरी तरह गुप्त)।"
                      : "100% confidential and secure assistance: internal monitoring of women help & de-addiction requests (isolated from public view).")
                  : adminSection === "exports"
                  ? (lang === "hi"
                      ? "संपूर्ण डेटाबेस को CSV में डाउनलोड करें व अस्पताल बिल (PDF) एवं मरीज वीडियो (MP4) सीधे प्राप्त करें।"
                      : "Download all backend data into CSV files and immediately stream/download patient PDF estimation bills and MP4 video proofs.")
                  : (lang === "hi"
                      ? "लाइव दानकर्ता सूची, आपातकालीन अलर्ट बैनर और आधिकारिक हेल्पलाइन का पूर्ण नियंत्रण।"
                      : "Full administrative control to edit the live generous donors marquee ticker, emergency alert banners, and official helplines.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Language Switcher Pill */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                    lang === "en"
                      ? "bg-white text-slate-900 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                    lang === "hi"
                      ? "bg-white text-blue-900 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  हिंदी
                </button>
              </div>

              {adminSection === "cases" ? (
                <button
                  type="button"
                  onClick={() => setNewCaseModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {lang === "hi" ? "नया सत्यापित केस जोड़ें" : "Create Verified Case"}
                  </span>
                </button>
              ) : adminSection === "confidential" ? (
                <button
                  type="button"
                  onClick={() => {
                    loadConfidential();
                    showToast(
                      lang === "hi"
                        ? "गोपनीय सहायता डेटा रिफ्रेश हो गया है।"
                        : "Confidential support data refreshed."
                    );
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {lang === "hi" ? "रिफ्रेश गोपनीय केस" : "Refresh Confidential Cases"}
                  </span>
                </button>
              ) : adminSection === "exports" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    Live Backend Data Export Active
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddDonor}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{lang === "hi" ? "दानकर्ता जोड़ें" : "Add Generous Donor"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          lang === "hi"
                            ? "दानकर्ता सूची को डिफ़ॉल्ट पर रीसेट करें?"
                            : "Reset live donors marquee to default list?"
                        )
                      ) {
                        resetDonors();
                        showToast(
                          lang === "hi"
                            ? "दानकर्ता सूची रीसेट हो गई।"
                            : "Live donors marquee restored to defaults."
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    title={lang === "hi" ? "डिफ़ॉल्ट पर रीसेट करें" : "Reset to Defaults"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {lang === "hi" ? "रीसेट" : "Reset Defaults"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 mt-4">
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
              <span>
                {lang === "hi" ? "केस व चिकित्सा सत्यापन" : "Cases & Medical Verifications"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  adminSection === "cases"
                    ? "bg-blue-800 text-white"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {pendingCount} {lang === "hi" ? "लंबित" : "Pending"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminSection("confidential")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                adminSection === "confidential"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <span>
                {lang === "hi"
                  ? "गोपनीय सहायता (महिला सुरक्षा व सट्टा मुक्ति)"
                  : "Confidential Support (Women & De-Addiction)"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  adminSection === "confidential"
                    ? "bg-purple-900 text-white"
                    : "bg-purple-100 text-purple-900"
                }`}
              >
                {confidentialCases.length} {lang === "hi" ? "गोपनीय" : "Confidential"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminSection("exports")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                adminSection === "exports"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <HardDrive className="w-4 h-4 text-emerald-300" />
              <span>
                {lang === "hi"
                  ? "डेटा निर्यात व मीडिया (CSV • MP4 • PDF)"
                  : "Export & Media Hub (CSV • MP4 • PDF)"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  adminSection === "exports"
                    ? "bg-emerald-800 text-white"
                    : "bg-emerald-100 text-emerald-900"
                }`}
              >
                All Data
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
              <span>
                {lang === "hi"
                  ? "लाइव दानकर्ता व वेबसाइट नियंत्रण"
                  : "Live Donors & Website Control"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  adminSection === "website"
                    ? "bg-slate-800 text-amber-300"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {donors.length} {lang === "hi" ? "दानकर्ता" : "Donors"}
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
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "समीक्षा लंबित" : "Pending Review"}
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi"
                ? "दस्तावेज सत्यापन आवश्यक"
                : "Requires document verification"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "सक्रिय सत्यापित" : "Active Verified"}
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">
              {approvedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi"
                ? "सीधे UPI भुगतान स्वीकार्य"
                : "Accepting direct UPI transfers"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "पूर्णतः पोषित" : "Fully Funded"}
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {fundedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi" ? "लक्ष्य सीधे पूरे हुए" : "Goals met directly"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "सीधी सहायता हस्तांतरित" : "Direct Aid Transferred"}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 truncate">
              {formatINR(totalRaised)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi" ? "₹0 कमीशन कटौती" : "₹0 commission retained"}
            </p>
          </div>
        </div>

        {/* Tabbed Navigation + Search Controls */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden mb-8">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Tabs: ALL IS FIRST */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "all"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{lang === "hi" ? `सभी (${cases.length})` : `All (${cases.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{lang === "hi" ? `लंबित (${pendingCount})` : `Pending (${pendingCount})`}</span>
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
                <span>{lang === "hi" ? `सक्रिय (${approvedCount})` : `Active (${approvedCount})`}</span>
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
                <span>{lang === "hi" ? `पोषित (${fundedCount})` : `Funded (${fundedCount})`}</span>
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
                <span>{lang === "hi" ? `अस्वीकृत (${rejectedCount})` : `Rejected (${rejectedCount})`}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                placeholder={
                  lang === "hi"
                    ? "मरीज, शीर्षक या शहर खोजें..."
                    : "Search patient, title or city..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Cases Table */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredCases.length > 0 &&
                        selectedCaseIds.length === filteredCases.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={lang === "hi" ? "सभी चुनें" : "Select All"}
                    />
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "hi" ? "केस व लाभार्थी" : "Case & Beneficiary"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "hi" ? "श्रेणी व शहर" : "Category & City"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "hi" ? "एकत्रित / आवश्यक" : "Raised / Needed"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "hi" ? "सत्यापन स्थिति" : "Verification"}
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    {lang === "hi" ? "कार्यवाही" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      {lang === "hi"
                        ? "आपकी खोज के अनुसार कोई केस नहीं मिला।"
                        : "No cases found matching your criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {
                    const prog = getProgress(c.amountRaised, c.amountNeeded);
                    const isChecked = selectedCaseIds.includes(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50/80 transition group ${
                          isChecked ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <td className="px-3 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(c.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

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
                            {lang === "hi" ? "लक्ष्य:" : "Target:"} {formatINR(c.amountNeeded)} ({prog}%)
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
                            <span className="capitalize">
                              {c.status === "approved"
                                ? (lang === "hi" ? "सत्यापित" : "Approved")
                                : c.status === "pending"
                                ? (lang === "hi" ? "लंबित" : "Pending")
                                : c.status === "funded"
                                ? (lang === "hi" ? "पोषित" : "Funded")
                                : (lang === "hi" ? "अस्वीकृत" : "Rejected")}
                            </span>
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
                              title={lang === "hi" ? "केस समीक्षा" : "Review Case"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition"
                              title={lang === "hi" ? "विवरण संपादित करें" : "Edit Details"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {c.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(c.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                                  title={lang === "hi" ? "स्वीकृत व सत्यापित करें" : "Approve & Verify"}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(c.id)}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
                                  title={lang === "hi" ? "केस अस्वीकृत करें" : "Reject Case"}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(c)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition"
                              title={lang === "hi" ? "केस स्थायी रूप से हटाएं" : "Permanently Delete Case"}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>

                            <Link
                              href={`/cases/${c.id}`}
                              target="_blank"
                              className="px-2 py-1.5 text-slate-400 hover:text-slate-700 transition"
                              title={lang === "hi" ? "सार्वजनिक पेज देखें" : "View Public Page"}
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

          {/* Floating Bulk Action Bar */}
          {selectedCaseIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-modal border border-slate-700">
              <span className="text-xs sm:text-sm font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full">
                {selectedCaseIds.length} {lang === "hi" ? "चयनित" : "selected"}
              </span>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === "hi" ? "चयनित हटाएं" : "Delete Selected"}</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={handleBulkApprove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{lang === "hi" ? "स्वीकृत करें" : "Approve Selected"}</span>
              </button>

              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={handleBulkReject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{lang === "hi" ? "अस्वीकृत करें" : "Reject Selected"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCaseIds([])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                title={lang === "hi" ? "चयन रद्द करें" : "Deselect All"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </>
    ) : adminSection === "confidential" ? (
      /* Confidential Assistance Section (Women Help & Satta Mukt) */
      <div className="space-y-8">
        {/* Privacy Isolation Alert Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 rounded-3xl border border-purple-500/30 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {lang === "hi" ? "100% गोपनीय गारंटी" : "100% Confidential Guarantee"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {lang === "hi" ? "पब्लिक से पूर्णतः अलग" : "Privacy Isolated from Public"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-2 text-white">
                  {lang === "hi"
                    ? "गोपनीय सहायता केंद्र: महिला सुरक्षा व सट्टा मुक्ति अभियान"
                    : "Confidential Support Desk: Women Safety & De-Addiction Drive"}
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-3xl leading-relaxed">
                  {lang === "hi"
                    ? "यह डेटाबेस सार्वजनिक ऑडियंस से पूरी तरह अलग रखा गया है। एडमिन द्वारा स्थिति स्वीकृत होने के बाद भी यह केस मुख्य वेबसाइट, केस लिस्टिंग, या सर्च इंजन पर कभी नहीं दिखेगा। वास्तविक नाम व फोन नंबर केवल अधिकृत महिला काउंसलर व NGO सत्यापन टीम के आंतरिक उपयोग के लिए है।"
                    : "This database is completely isolated from the public audience. Even after status review, these requests will never appear on public listings or search engines. Real names and phone numbers are strictly accessible by authorized NGO counselors."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/women-help"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
              >
                <span>{lang === "hi" ? "लाइव महिला सहायता फॉर्म" : "Live Woman Help Form"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/satta-mukt"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
              >
                <span>{lang === "hi" ? "लाइव सट्टा मुक्ति फॉर्म" : "Live De-Addiction Form"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Confidential Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "कुल गोपनीय अनुरोध" : "Total Confidential Cases"}
              </span>
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
              {confidentialCases.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi" ? "100% शून्य पब्लिक प्रसार" : "100% Zero Public Exposure"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "महिला सहायता" : "Women Help"}
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
              {womenCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi" ? "सुरक्षित आश्रय व कानूनी मदद" : "Safe shelter & legal guidance"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "सट्टा मुक्ति अभियान" : "De-Addiction Drive"}
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {sattaCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi" ? "मनोवैज्ञानिक व ऋण मार्गदर्शन" : "Psychological & debt guidance"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === "hi" ? "सुरक्षित कॉल लंबित" : "Pending Safe Calls"}
              </span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {pendingCallsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "hi" ? "दिए गए सुरक्षित समय पर संपर्क करें" : "Contact during selected safe windows"}
            </p>
          </div>
        </div>

        {/* Filter and Inquiries Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfidentialFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  confidentialFilter === "all"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {lang === "hi"
                  ? `सभी गोपनीय अनुरोध (${confidentialCases.length})`
                  : `All Confidential Requests (${confidentialCases.length})`}
              </button>
              <button
                type="button"
                onClick={() => setConfidentialFilter("women_help")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  confidentialFilter === "women_help"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {lang === "hi" ? `महिला सहायता (${womenCount})` : `Women Help (${womenCount})`}
              </button>
              <button
                type="button"
                onClick={() => setConfidentialFilter("satta_mukt")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  confidentialFilter === "satta_mukt"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {lang === "hi" ? `सट्टा मुक्त अभियान (${sattaCount})` : `De-Addiction Drive (${sattaCount})`}
              </button>
              <button
                type="button"
                onClick={() => setConfidentialFilter("urgent")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  confidentialFilter === "urgent"
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {lang === "hi" ? `कॉल पेंडिंग (${pendingCallsCount})` : `Calls Pending (${pendingCallsCount})`}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={lang === "hi" ? "नाम, शहर, या फोन से खोजें..." : "Search name, city or phone..."}
                value={confidentialSearch}
                onChange={(e) => setConfidentialSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 sm:px-6">
                    {lang === "hi" ? "कैटेगरी व प्रदर्शित नाम (Alias)" : "Category & Display Name (Alias)"}
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    {lang === "hi" ? "संपर्क का सुरक्षित समय" : "Safe Call Window"}
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    {lang === "hi" ? "असली नाम व फोन (NGO Eyes Only)" : "Real Name & Phone (NGO Only)"}
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    {lang === "hi" ? "शहर व स्थिति" : "City & Status"}
                  </th>
                  <th className="py-3 px-4 sm:px-6 text-right">
                    {lang === "hi" ? "सुरक्षित संपर्क व कार्यवाही" : "Safe Contact & Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredConfidential.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      {lang === "hi" ? "कोई गोपनीय अनुरोध नहीं मिला।" : "No confidential requests found."}
                    </td>
                  </tr>
                ) : (
                  filteredConfidential.map((item) => {
                    const isWomen =
                      item.category === "women_help" || item.confidentialCategory === "women_help";
                    return (
                      <tr key={item.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isWomen ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isWomen ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                    isWomen
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isWomen
                                    ? (lang === "hi" ? "महिला सहायता (Safe)" : "Women Help (Safe)")
                                    : (lang === "hi" ? "सट्टा मुक्ति (Secure)" : "De-Addiction (Secure)")}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  #{item.id?.slice(0, 8)}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                                <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                                <span>{item.aliasName || item.patient_name}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{item.safeContactTime || (lang === "hi" ? "दिन में किसी भी समय" : "Direct Safe Contact")}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {lang === "hi" ? "(ससुराल/घर में एकांत का समय)" : "(Strict privacy safe window)"}
                          </div>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 inline-block">
                            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-purple-700" />
                              <span>{lang === "hi" ? "असली: " : "Real: "}{item.realName || item.patient_name}</span>
                            </div>
                            <div className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                              {item.contactPhone || item.phone || "Phone Provided"}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <div className="text-slate-800 font-medium">{item.city || (lang === "hi" ? "भारत" : "India")}</div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-1 ${
                              item.status === "contacted"
                                ? "bg-blue-100 text-blue-800"
                                : item.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status === "contacted"
                              ? (lang === "hi" ? "संपर्क किया गया" : "Contacted")
                              : item.status === "resolved"
                              ? (lang === "hi" ? "समाधान पूर्ण" : "Resolved")
                              : (lang === "hi" ? "कॉल पेंडिंग" : "Pending Call")}
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.contactPhone && (
                              <>
                                <a
                                  href={`tel:${item.contactPhone}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition border border-blue-200"
                                  title={lang === "hi" ? "सुरक्षित कॉल करें" : "Safe Direct Call"}
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{lang === "hi" ? "कॉल" : "Call"}</span>
                                </a>
                                <a
                                  href={`https://wa.me/${item.contactPhone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition border border-emerald-200"
                                  title={lang === "hi" ? "सुरक्षित व्हाट्सएप संदेश" : "Safe WhatsApp Message"}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{lang === "hi" ? "व्हाट्सएप" : "WhatsApp"}</span>
                                </a>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedConfidential(item)}
                              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs transition shadow-xs"
                            >
                              {lang === "hi" ? "विवरण व नोट्स" : "Details & Notes"}
                            </button>
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
      </div>
    ) : adminSection === "exports" ? (
      <AdminExportCenter
        cases={cases}
        confidentialCases={confidentialCases}
        lang={lang}
        onShowToast={(msg) => showToast(msg)}
      />
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
                      onClick={() => {
                        if (selected) handleDeleteSingle(selected);
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 border border-rose-200 transition cursor-pointer"
                      title={lang === "hi" ? "केस स्थायी रूप से हटाएं" : "Permanently Delete Case"}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>{lang === "hi" ? "केस हटाएं" : "Delete Case"}</span>
                    </button>

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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl animate-modal relative">
            <button
              onClick={() => setNewCaseModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {lang === "hi" ? "सीधा एडमिन प्रकाशन" : "Direct Admin Publishing"}
              </span>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {lang === "hi" ? "100% सत्यापित" : "Auto-Verified"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {lang === "hi" ? "नया सत्यापित केस प्रकाशित करें" : "Publish New Verified Case"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {lang === "hi"
                ? "जरूरतमंद व्यक्ति के सभी दस्तावेज, फोन नंबर, अस्पताल विवरण और फोटो सीधे अपलोड करें। यह तुरंत लाइव प्रकाशित होगा।"
                : "Upload all beneficiary documents, contact phone, hospital details, and photos directly. Will be verified and published live immediately."}
            </p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              {/* Beneficiary Details Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  {lang === "hi" ? "1. जरूरतमंद / मरीज का विवरण" : "1. Beneficiary / Patient Details"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "मरीज / जरूरतमंद का नाम *" : "Beneficiary / Patient Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newCaseForm.patientName}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, patientName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "आयु *" : "Age *"}
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 35"
                      value={newCaseForm.age}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, age: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "लिंग" : "Gender"}
                    </label>
                    <select
                      value={newCaseForm.gender}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, gender: e.target.value as "male" | "female" | "other" })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="male">{lang === "hi" ? "पुरुष (Male)" : "Male"}</option>
                      <option value="female">{lang === "hi" ? "महिला (Female)" : "Female"}</option>
                      <option value="other">{lang === "hi" ? "अन्य (Other)" : "Other"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "फोन / व्हाट्सएप नंबर *" : "Contact Phone / WhatsApp *"}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={newCaseForm.phone}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "शहर *" : "City *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indore"
                      value={newCaseForm.city}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Beneficiary Photo Upload Direct Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  {lang === "hi" ? "2. मरीज की तस्वीर अपलोड करें" : "2. Beneficiary Photo (Direct Upload)"}
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center shrink-0 relative shadow-xs">
                    {newCaseForm.photoUrl ? (
                      <>
                        <Image
                          src={newCaseForm.photoUrl}
                          alt="Beneficiary"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewCaseForm({ ...newCaseForm, photoUrl: "" })}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700"
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

                  <div className="flex-1 w-full space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-blue-600 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                      <FileUp className="w-4 h-4 text-blue-600" />
                      <span>{uploadingPhoto ? "Uploading Photo..." : "Choose Beneficiary Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadBeneficiaryPhoto}
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload clear photo of the patient or beneficiary (JPG, PNG). Stored securely on Supabase Storage.
                    </p>
                    {newCaseForm.photoUrl && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Photo uploaded and attached!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Case Title and Medical Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {lang === "hi" ? "3. केस व बीमारी / सहायता शीर्षक" : "3. Case Title & Medical Details"}
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === "hi" ? "केस शीर्षक (English) *" : "Case Title (English) *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent Open Heart Surgery for Master Aarav"
                    value={newCaseForm.title}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "केस श्रेणी *" : "Category *"}
                    </label>
                    <select
                      value={newCaseForm.category}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, category: e.target.value as Case["category"] })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="medical">Medical (चिकित्सा)</option>
                      <option value="education">Education (शिक्षा)</option>
                      <option value="accident">Accident (दुर्घटना)</option>
                      <option value="disability">Disability (दिव्यांगता)</option>
                      <option value="family">Family Emergency (पारिवारिक)</option>
                      <option value="other">Other (अन्य)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "प्राथमिकता स्तर" : "Urgency Level"}
                    </label>
                    <select
                      value={newCaseForm.urgency}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, urgency: e.target.value as Case["urgency"] })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="critical">Critical (अति गंभीर / Urgent)</option>
                      <option value="high">High (उच्च)</option>
                      <option value="medium">Medium (सामान्य)</option>
                      <option value="low">Low (कम)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "अस्पताल का नाम" : "Hospital Name"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AIIMS Delhi / CHL Hospital"
                      value={newCaseForm.hospitalName}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, hospitalName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "डॉक्टर का नाम" : "Doctor Name"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. K. Sharma"
                      value={newCaseForm.doctorName}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, doctorName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "अस्पताल हेल्पलाइन" : "Hospital Contact"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0731-2555555"
                      value={newCaseForm.hospitalContact}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, hospitalContact: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === "hi" ? "विस्तृत विवरण व मेडिकल रिपोर्ट *" : "Full Description & Medical Diagnosis *"}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide patient medical diagnosis, hospital quote, and family background story..."
                    value={newCaseForm.description}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Direct UPI and Bank Account Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  {lang === "hi" ? "4. सहायता राशि व सीधा बैंक/UPI खाता" : "4. Target Amount & Direct Bank / UPI"}
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === "hi" ? "आवश्यक सहायता राशि (₹) *" : "Target Amount Needed (₹) *"}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250000"
                    value={newCaseForm.amountNeeded}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, amountNeeded: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "सीधा UPI ID (QR के लिए) *" : "Direct Beneficiary UPI ID *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="name@okaxis"
                      value={newCaseForm.upiId}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, upiId: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "बैंक खाता संख्या" : "Bank Account Number"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321098"
                      value={newCaseForm.bankAccount}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === "hi" ? "IFSC कोड" : "IFSC Code"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      value={newCaseForm.ifsc}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, ifsc: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono uppercase border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Documents Upload Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    {lang === "hi" ? "5. प्रमाण व दस्तावेज अपलोड करें" : "5. Beneficiary Documents & Proofs (Direct Upload)"}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    {newCaseForm.documents.length} attached
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {lang === "hi"
                    ? "अस्पताल का बिल, आधार कार्ड, डॉक्टर पर्ची या बैंक पासबुक सीधे अपलोड करें। सभी दस्तावेज सार्वजनिक रूप से पारदर्शी सत्यापन के लिए उपलब्ध होंगे।"
                    : "Upload hospital bills, Aadhaar card, doctor prescriptions, or passbook. Available for transparent donor audit."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {lang === "hi" ? "दस्तावेज का प्रकार चुनें" : "Select Document Type"}
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Hospital Estimation Bill">Hospital Estimation Bill (अस्पताल बिल)</option>
                      <option value="Aadhaar / Government ID Card">Aadhaar / Govt ID (पहचान पत्र)</option>
                      <option value="Medical Report / Prescription">Medical Report / Prescription (जांच रिपोर्ट)</option>
                      <option value="Bank Passbook / Cheque">Bank Passbook / Cheque (बैंक पासबुक)</option>
                      <option value="Other Proof">Other Proof (अन्य दस्तावेज)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {lang === "hi" ? "फाइल चुनें (PDF या Image)" : "Choose File (PDF or Image)"}
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

                {/* Uploaded Documents List */}
                {newCaseForm.documents.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Attached Files:</p>
                    {newCaseForm.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{doc.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono shrink-0">
                            {doc.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  {lang === "hi"
                    ? "स्वीकृत करते ही यह केस वेबसाइट पर तुरंत लाइव हो जाएगा।"
                    : "Published cases immediately appear on the home page and cases directory."}
                </span>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setNewCaseModal(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    {lang === "hi" ? "रद्द करें" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-blue-900/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{lang === "hi" ? "सत्यापित केस प्रकाशित करें" : "Publish Verified Case"}</span>
                  </button>
                </div>
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

      {/* Selected Confidential Case Detail & Action Modal */}
      {selectedConfidential && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl animate-modal relative">
            <button
              onClick={() => setSelectedConfidential(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>100% Confidential (Private to NGO)</span>
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedConfidential.category === "women_help" ||
                    selectedConfidential.confidentialCategory === "women_help"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedConfidential.category === "women_help" ||
                  selectedConfidential.confidentialCategory === "women_help"
                    ? (lang === "hi" ? "महिला सहायता (सुरक्षित व गोपनीय)" : "Woman Help (Safe & Secure)")
                    : (lang === "hi" ? "सट्टा मुक्त अभियान (परामर्श)" : "De-Addiction Drive (Guidance)")}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  #{selectedConfidential.id}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {selectedConfidential.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>
                    {lang === "hi" ? "दर्ज: " : "Filed: "}
                    {selectedConfidential.created_at
                      ? new Date(selectedConfidential.created_at).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")
                      : (lang === "hi" ? "अभी हाल ही में" : "Recently")}
                  </span>
                  <span>·</span>
                  <span>{lang === "hi" ? "स्थान: " : "Location: "}{selectedConfidential.city || (lang === "hi" ? "भारत" : "India")}</span>
                </div>
              </div>

              {/* Safe Contact Time Alert */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    {lang === "hi" ? "संपर्क का सुरक्षित समय (कॉल विंडो)" : "Strict Safe Call Window"}
                  </div>
                  <div className="text-sm font-extrabold text-amber-900 mt-0.5">
                    {selectedConfidential.safeContactTime || (lang === "hi" ? "सीधा संपर्क" : "Direct Safe Contact")}
                  </div>
                  <p className="text-[11px] text-amber-800/90 mt-1">
                    {lang === "hi"
                      ? "आवेदक ने यह समय इसलिए चुना है ताकि घर या ससुराल में कोई आसपास न हो। कृपया केवल इसी निर्धारित समय पर ही कॉल करें।"
                      : "The applicant chose this timeframe for strict privacy. Please contact only during this scheduled safe window."}
                  </p>
                </div>
              </div>

              {/* Personal Details (Strictly Internal) */}
              <div className="grid sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === "hi" ? "प्रदर्शित नाम (Alias/Display Name)" : "Display Name (Alias)"}
                  </span>
                  <span className="text-sm font-bold text-purple-900 flex items-center gap-1.5 mt-0.5">
                    <EyeOff className="w-4 h-4 text-purple-600" />
                    <span>
                      {selectedConfidential.aliasName || selectedConfidential.patient_name}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === "hi" ? "वास्तविक नाम (Internal Real Name)" : "Internal Real Name"}
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {selectedConfidential.realName || selectedConfidential.patient_name}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === "hi" ? "संपर्क फोन / WhatsApp" : "Contact Phone / WhatsApp"}
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                    {selectedConfidential.contactPhone ||
                      selectedConfidential.phone ||
                      "Phone Provided"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === "hi" ? "सहायता प्रकार" : "Assistance Type"}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {selectedConfidential.supportType || (lang === "hi" ? "गोपनीय परामर्श व मार्गदर्शन" : "Confidential Support & Guidance")}
                  </span>
                </div>
              </div>

              {/* Case Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {lang === "hi" ? "समस्या व अनुरोध का विवरण" : "Problem & Request Details"}
                </h4>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedConfidential.description}
                </div>
              </div>

              {/* Counselor Action & Notes */}
              <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-700" />
                    <span>{lang === "hi" ? "काउंसलर आंतरिक नोट्स व कार्यवाही" : "Counselor Internal Notes & Actions"}</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateConfidentialStatus(selectedConfidential.id, "contacted")
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                    >
                      {lang === "hi" ? "मार्क: संपर्क हुआ" : "Mark: Contacted"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateConfidentialStatus(selectedConfidential.id, "resolved")
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                    >
                      {lang === "hi" ? "मार्क: समाधान पूर्ण" : "Mark: Resolved"}
                    </button>
                  </div>
                </div>

                {selectedConfidential.counselorNotes && (
                  <div className="p-3 bg-white rounded-xl border border-purple-200 text-xs text-slate-700 leading-relaxed">
                    <strong>{lang === "hi" ? "अद्यतन नोट्स:" : "Updated Notes:"}</strong> {selectedConfidential.counselorNotes}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      lang === "hi"
                        ? "नया काउंसलर नोट लिखें (उदा. कॉल की गई, कानूनी वकील से समय तय हुआ)..."
                        : "Write counselor note (e.g. call completed, lawyer consultation set)..."
                    }
                    value={counselorNoteInput}
                    onChange={(e) => setCounselorNoteInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddCounselorNote(selectedConfidential.id, counselorNoteInput)
                    }
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
                  >
                    {lang === "hi" ? "नोट जोड़ें" : "Add Note"}
                  </button>
                </div>
              </div>

              {/* Direct Safe Communication triggers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {lang === "hi"
                      ? "पब्लिक से 100% पृथक · सुरक्षित एन्क्रिप्शन सक्रिय"
                      : "100% Isolated from Public · Strict Encryption Active"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConfidential.contactPhone && (
                    <>
                      <a
                        href={`tel:${selectedConfidential.contactPhone}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{lang === "hi" ? "सुरक्षित कॉल करें" : "Direct Safe Call"}</span>
                      </a>
                      <a
                        href={`https://wa.me/${selectedConfidential.contactPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{lang === "hi" ? "व्हाट्सएप हेल्पलाइन" : "WhatsApp Helpline"}</span>
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedConfidential(null)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {lang === "hi" ? "बंद करें" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
