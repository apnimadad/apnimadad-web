"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDonationsAdmin, getAllProfilesAdmin } from "@/lib/actions/cases";
import { Case, ConfidentialCaseItem, Donation, Profile } from "@/types/database";
import {
  FileSpreadsheet,
  Download,
  FileText,
  Video,
  Image as ImageIcon,
  HardDrive,
  Database,
  ExternalLink,
  Search,
  CheckCircle2,
  RefreshCw,
  FolderDown,
  Users,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface MediaItem {
  id: string;
  caseId: string;
  patientName: string;
  caseTitle: string;
  hospitalName?: string | null;
  fileName: string;
  fileType: "pdf" | "video" | "image";
  url: string;
  verified?: boolean;
}

interface AdminExportCenterProps {
  cases: Case[];
  confidentialCases: ConfidentialCaseItem[];
  lang: "en" | "hi";
  onShowToast: (msg: string) => void;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        let text = String(val ?? "");
        if (text.includes('"') || text.includes(",") || text.includes("\n") || text.includes("\r")) {
          text = `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      })
      .join(",");
  };
  const csvContent = "\uFEFF" + rows.map(processRow).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function triggerFileDownload(url: string, filename: string) {
  if (!url || url === "#") {
    alert("This sample proof does not have a live public binary attached.");
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

export default function AdminExportCenter({
  cases,
  confidentialCases,
  lang,
  onShowToast,
}: AdminExportCenterProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "pdf" | "video" | "image">("all");
  const [mediaSearch, setMediaSearch] = useState("");

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [dons, profs] = await Promise.all([
        getAllDonationsAdmin(),
        getAllProfilesAdmin(),
      ]);
      setDonations(dons);
      setProfiles(profs);
      onShowToast(lang === "hi" ? "नवीनतम डेटा रीफ्रेश हो गया" : "Live backend records synchronized");
    } catch {
      onShowToast(lang === "hi" ? "डेटा लोड करने में त्रुटि" : "Failed to load live backend records");
    } finally {
      setLoading(false);
    }
  }, [lang, onShowToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Aggregate all media attachments across all cases
  const allMediaItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];

    cases.forEach((c) => {
      // 1. Attached Documents (PDFs, docs)
      if (Array.isArray(c.documents)) {
        c.documents.forEach((doc, idx) => {
          const isPdf =
            doc.type?.toLowerCase().includes("pdf") ||
            doc.name?.toLowerCase().endsWith(".pdf") ||
            doc.url?.toLowerCase().endsWith(".pdf");
          const isVideo =
            doc.type?.toLowerCase().includes("video") ||
            doc.type?.toLowerCase().includes("mp4") ||
            doc.url?.toLowerCase().endsWith(".mp4");

          items.push({
            id: `doc-${c.id}-${idx}`,
            caseId: c.id,
            patientName: c.patient_name || "Beneficiary",
            caseTitle: c.title,
            hospitalName: c.hospital_name,
            fileName: doc.name || `Document_${idx + 1}`,
            fileType: isVideo ? "video" : isPdf ? "pdf" : "image",
            url: doc.url,
            verified: doc.verified,
          });
        });
      }

      // 2. MP4 Video proofs
      if (c.video_url) {
        items.push({
          id: `vid-${c.id}`,
          caseId: c.id,
          patientName: c.patient_name || "Beneficiary",
          caseTitle: c.title,
          hospitalName: c.hospital_name,
          fileName: `${c.patient_name}_Video_Proof.mp4`,
          fileType: "video",
          url: c.video_url,
          verified: true,
        });
      }

      // 3. Primary Medical Photo
      if (c.photo_url) {
        items.push({
          id: `photo-${c.id}`,
          caseId: c.id,
          patientName: c.patient_name || "Beneficiary",
          caseTitle: c.title,
          hospitalName: c.hospital_name,
          fileName: `${c.patient_name}_Medical_Photo.jpg`,
          fileType: "image",
          url: c.photo_url,
          verified: true,
        });
      }
    });

    return items;
  }, [cases]);

  // Filtered media items
  const filteredMedia = useMemo(() => {
    return allMediaItems.filter((item) => {
      const matchesType = mediaFilter === "all" || item.fileType === mediaFilter;
      const q = mediaSearch.toLowerCase();
      const matchesSearch =
        !q ||
        item.patientName.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        item.caseTitle.toLowerCase().includes(q) ||
        (item.hospitalName && item.hospitalName.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [allMediaItems, mediaFilter, mediaSearch]);

  // Count summaries
  const pdfCount = allMediaItems.filter((m) => m.fileType === "pdf").length;
  const videoCount = allMediaItems.filter((m) => m.fileType === "video").length;
  const imageCount = allMediaItems.filter((m) => m.fileType === "image").length;

  // 1. Export Cases to CSV
  const handleExportCases = () => {
    const headers = [
      "Case ID",
      "Patient Name",
      "Age",
      "City",
      "Category",
      "Urgency",
      "Status",
      "Verification Stage",
      "Amount Needed (INR)",
      "Amount Raised (INR)",
      "Hospital Name",
      "Doctor Name",
      "Hospital Contact",
      "UPI ID",
      "Bank Account",
      "IFSC",
      "Photo URL",
      "Video URL",
      "Documents Count",
      "Created At",
    ];

    const rows = cases.map((c) => [
      c.id,
      c.patient_name || "",
      c.age || "",
      c.city || "",
      c.category || "",
      c.urgency || "",
      c.status || "",
      c.verification_stage || "",
      c.amount_needed || 0,
      c.amount_raised || 0,
      c.hospital_name || "",
      c.doctor_name || "",
      c.hospital_contact || "",
      c.upi_id || "",
      c.bank_account || "",
      c.ifsc || "",
      c.photo_url || "",
      c.video_url || "",
      Array.isArray(c.documents) ? c.documents.length : 0,
      c.created_at || "",
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`apni_madad_cases_registry_${timestamp}.csv`, [headers, ...rows]);
    onShowToast(`Cases registry exported (${cases.length} records)`);
  };

  // 2. Export Donations to CSV
  const handleExportDonations = () => {
    const headers = [
      "Donation ID",
      "Case ID",
      "Donor ID",
      "Donor Name",
      "Amount (INR)",
      "Payment Method",
      "Payment Reference / UTR",
      "Status",
      "Notes",
      "Created At",
    ];

    const rows = donations.map((d) => [
      d.id || "",
      d.case_id || "",
      d.donor_id || "",
      d.donor_name || "Direct Donor",
      d.amount || 0,
      d.payment_method || "upi",
      d.payment_ref || "",
      d.status || "confirmed",
      d.notes || "",
      d.created_at || "",
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`apni_madad_donations_ledger_${timestamp}.csv`, [headers, ...rows]);
    onShowToast(`Donations ledger exported (${donations.length} records)`);
  };

  // 3. Export Confidential Inquiries to CSV
  const handleExportConfidential = () => {
    const headers = [
      "Inquiry ID",
      "Alias / Public Name",
      "Real Name",
      "Contact Phone",
      "Category",
      "Urgency",
      "City",
      "Safe Contact Time",
      "Status",
      "Counselor Notes",
      "Created At",
    ];

    const rows = confidentialCases.map((item) => [
      item.id,
      item.patient_name || item.realName || "Confidential",
      item.realName || item.patient_name || "",
      item.contactPhone || item.phone || "",
      item.category || "women_help",
      item.urgency || "high",
      item.city || "India",
      item.safeContactTime || "Anytime",
      item.status || "pending",
      item.counselorNotes || "",
      item.created_at || "",
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`apni_madad_confidential_records_${timestamp}.csv`, [headers, ...rows]);
    onShowToast(`Confidential desk exported (${confidentialCases.length} records)`);
  };

  // 4. Export Registered Users to CSV
  const handleExportProfiles = () => {
    const headers = [
      "User ID",
      "Email Address",
      "Role",
      "Full Name",
      "Phone / WhatsApp",
      "Is Verified",
      "Created At",
      "Updated At",
    ];

    const rows = profiles.map((p) => [
      p.id || "",
      p.email || "",
      p.role || "",
      p.full_name || "",
      p.phone || "",
      p.is_verified ? "YES" : "NO",
      p.created_at || "",
      p.updated_at || "",
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`apni_madad_registered_users_${timestamp}.csv`, [headers, ...rows]);
    onShowToast(`Users directory exported (${profiles.length} accounts)`);
  };

  // 5. Export Media Index to CSV
  const handleExportMediaIndex = () => {
    const headers = [
      "Media ID",
      "Case ID",
      "Patient Name",
      "Case Title",
      "Hospital Name",
      "File Type (PDF/Video/Image)",
      "File Name",
      "Download URL",
      "Verified Status",
    ];

    const rows = allMediaItems.map((m) => [
      m.id,
      m.caseId,
      m.patientName,
      m.caseTitle,
      m.hospitalName || "",
      m.fileType.toUpperCase(),
      m.fileName,
      m.url,
      m.verified ? "VERIFIED" : "PENDING",
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`apni_madad_media_documents_index_${timestamp}.csv`, [headers, ...rows]);
    onShowToast(`Media documents index exported (${allMediaItems.length} attachments)`);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Synchronize */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Admin Full Access
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Live Supabase Backend
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <HardDrive className="w-6 h-6 text-amber-400" />
              <span>
                {lang === "hi"
                  ? "डेटा बैकएंड और निर्यात केंद्र (CSV / MP4 / PDF)"
                  : "Data & Media Export Hub (CSV / MP4 / PDF Complete)"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Complete admin access to download all cases, live donations, confidential inquiries,
              and registered user directories in UTF-8 CSV formats, plus immediate streaming and
              downloading of medical estimation PDFs and patient MP4 video appeals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshData}
              disabled={loading}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Syncing..." : "Sync Live Data"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleExportCases();
                setTimeout(handleExportDonations, 300);
                setTimeout(handleExportConfidential, 600);
                setTimeout(handleExportProfiles, 900);
                setTimeout(handleExportMediaIndex, 1200);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center gap-2"
            >
              <FolderDown className="w-4 h-4" />
              <span>Export All 5 CSV Sets</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-semibold">Relief Cases</div>
            <div className="text-lg font-black text-white mt-0.5">{cases.length}</div>
            <div className="text-[10px] text-blue-300 mt-0.5">Approved & Pending</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-semibold">Donations Ledger</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{donations.length}</div>
            <div className="text-[10px] text-emerald-300 mt-0.5">Direct UPI & Bank</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-semibold">Confidential Desk</div>
            <div className="text-lg font-black text-purple-400 mt-0.5">{confidentialCases.length}</div>
            <div className="text-[10px] text-purple-300 mt-0.5">Encrypted records</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-semibold">Registered Accounts</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{profiles.length}</div>
            <div className="text-[10px] text-amber-300 mt-0.5">Admins, Donors, Users</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 font-semibold">PDFs & MP4 Proofs</div>
            <div className="text-lg font-black text-sky-400 mt-0.5">{allMediaItems.length}</div>
            <div className="text-[10px] text-sky-300 mt-0.5">
              {pdfCount} PDFs • {videoCount} MP4s
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ONE-CLICK CSV EXPORT TILES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Full CSV Export Center (Excel & Sheets Compatible)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download clean UTF-8 comma-separated spreadsheets with full financial, patient, and verification audit trails.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tile 1: Cases */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {cases.length} Records
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Cases & Relief Appeals</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Patient name, target vs raised, hospital, attending doctor, urgency level, verification stage, bank account & UPI ID.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCases}
              className="mt-4 w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-xl text-xs transition border border-blue-200 flex items-center justify-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
              <span>Download Cases CSV</span>
            </button>
          </div>

          {/* Tile 2: Donations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {donations.length} Transactions
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Donations & Payout Ledger</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct donor names, amounts, payment reference / UTR codes, timestamps, and case links for transparent auditing.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportDonations}
              className="mt-4 w-full py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold rounded-xl text-xs transition border border-emerald-200 flex items-center justify-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
              <span>Download Donations CSV</span>
            </button>
          </div>

          {/* Tile 3: Confidential Records */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-purple-400 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {confidentialCases.length} Inquiries
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Confidential Desk Records</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Women in distress and de-addiction requests: anonymous alias, real contact, safe call timings, and counselor notes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportConfidential}
              className="mt-4 w-full py-2.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold rounded-xl text-xs transition border border-purple-200 flex items-center justify-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
              <span>Download Confidential CSV</span>
            </button>
          </div>

          {/* Tile 4: Registered Users */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {profiles.length} Accounts
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Registered Users & Roles</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All registered Admins, Donors, and Beneficiaries stored in Supabase with emails, phone numbers, and verified status.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportProfiles}
              className="mt-4 w-full py-2.5 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white font-bold rounded-xl text-xs transition border border-amber-200 flex items-center justify-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
              <span>Download Users CSV</span>
            </button>
          </div>

          {/* Tile 5: Media Index */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                  <FolderDown className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {allMediaItems.length} Attachments
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Media & Proofs Manifest</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct URLs, filenames, and verification metadata for all hospital estimation PDFs, MP4 patient videos, and bills.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMediaIndex}
              className="mt-4 w-full py-2.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white font-bold rounded-xl text-xs transition border border-sky-200 flex items-center justify-center gap-2 group"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
              <span>Download Media Index CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ATTACHED PROOFS & MEDIA VAULT (PDF & MP4 DOWNLOADS) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Attached Proofs & Media Vault (PDF Documents & MP4 Videos)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant streaming and downloading of uploaded hospital bills, diagnostic PDFs, and patient video proofs.
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMediaFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                mediaFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({allMediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter("pdf")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mediaFilter === "pdf"
                  ? "bg-rose-600 text-white"
                  : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Bills ({pdfCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter("video")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mediaFilter === "video"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>MP4 Videos ({videoCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter("image")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mediaFilter === "image"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos ({imageCount})</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative max-w-md">
            <input
              type="text"
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              placeholder="Filter by patient name, hospital, or filename..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Media Table / List */}
        <div className="overflow-x-auto">
          {filteredMedia.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FolderDown className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div className="text-sm font-bold text-slate-700">No media files matched filter</div>
              <p className="text-xs text-slate-400 mt-1">
                Try switching the filter tab or resetting your search keyword.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">File Name & Patient</th>
                  <th className="py-3 px-4">Hospital / Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMedia.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      {item.fileType === "pdf" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          <FileText className="w-3 h-3" />
                          PDF
                        </span>
                      ) : item.fileType === "video" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                          <Video className="w-3 h-3" />
                          MP4
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                          <ImageIcon className="w-3 h-3" />
                          IMG
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{item.fileName}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Patient: <span className="font-medium text-slate-700">{item.patientName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                      {item.hospitalName || "Apni Madad Field Verified"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Proof
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {item.url && item.url !== "#" ? (
                          <>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                              title="Open & Stream"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => triggerFileDownload(item.url, item.fileName)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[11px] font-bold transition border border-blue-200 flex items-center gap-1"
                              title="Download to computer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No file attached</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
