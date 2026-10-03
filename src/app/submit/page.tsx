"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { useAuth } from "@/components/AuthContext";
import { compressImage, compressVideo, formatBytes } from "@/lib/compression";
import { submitCase, submitConfidentialCase } from "@/lib/actions/cases";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Category } from "@/lib/mock-data";
import { ShieldCheck, Lock, EyeOff, Clock } from "lucide-react";

type FileStatus = {
  name: string;
  original: string;
  compressed: string;
  status: "pending" | "compressing" | "done" | "error";
  progress?: number;
};

export default function SubmitCasePage() {
  const { t } = useLanguage();
  const { user, profile, role, loginAsDemo } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    aliasName: "",
    safeContactTime: "दोपहर 01:00 PM से 03:00 PM (ससुराल में शांति का समय)",
    age: "",
    city: "",
    category: "medical",
    title: "",
    description: "",
    amountNeeded: "",
    upiId: "",
    bankAccount: "",
    ifsc: "",
    phone: "",
  });

  const isConfidential = form.category === "women_help" || form.category === "satta_mukt";

  // Pre-fill name and phone from profile if available
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
      }));
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateFileStatus = (name: string, update: Partial<FileStatus>) => {
    setFileStatuses((prev) => {
      const idx = prev.findIndex((f) => f.name === name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...update };
        return next;
      }
      return [...prev, { name, original: "", compressed: "", status: "pending", ...update }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setFileStatuses([]);

    try {
      let photoUrl = "";
      let videoUrl = "";
      const documents: { name: string; type: string; url: string }[] = [];

      // --- Compress & prepare Photo ---
      const photoFile = photoRef.current?.files?.[0];
      if (photoFile) {
        updateFileStatus(photoFile.name, {
          original: formatBytes(photoFile.size),
          status: "compressing",
        });
        const { file: compressed, originalSize, compressedSize } = await compressImage(
          photoFile,
          100
        );
        updateFileStatus(photoFile.name, {
          original: formatBytes(originalSize),
          compressed: formatBytes(compressedSize),
          status: "done",
        });

        // In production with Supabase: upload compressed file
        if (isSupabaseConfigured()) {
          const fd = new FormData();
          fd.append("file", compressed);
          const path = `photos/${Date.now()}_${compressed.name}`;
          // Dynamic import to avoid SSR issues
          const { uploadToStorage } = await import("@/lib/actions/upload");
          const res = await uploadToStorage("case-photos", path, fd);
          if (res.success && res.url) photoUrl = res.url;
          else throw new Error(res.error || "Photo upload failed");
        } else {
          // Demo mode: use object URL
          photoUrl = URL.createObjectURL(compressed);
        }
      }

      // --- Compress & prepare Video (optional) ---
      const videoFile = videoRef.current?.files?.[0];
      if (videoFile) {
        updateFileStatus(videoFile.name, {
          original: formatBytes(videoFile.size),
          status: "compressing",
          progress: 0,
        });
        const { file: compressed, originalSize, compressedSize } = await compressVideo(
          videoFile,
          (p) => updateFileStatus(videoFile.name, { progress: Math.round(p * 100) })
        );
        updateFileStatus(videoFile.name, {
          original: formatBytes(originalSize),
          compressed: formatBytes(compressedSize),
          status: "done",
        });

        if (isSupabaseConfigured()) {
          const fd = new FormData();
          fd.append("file", compressed);
          const path = `videos/${Date.now()}_${compressed.name}`;
          const { uploadToStorage } = await import("@/lib/actions/upload");
          const res = await uploadToStorage("case-videos", path, fd);
          if (res.success && res.url) videoUrl = res.url;
        } else {
          videoUrl = URL.createObjectURL(compressed);
        }
      }

      // --- Compress Documents ---
      const docFiles = docsRef.current?.files;
      if (docFiles && docFiles.length > 0) {
        for (const f of Array.from(docFiles)) {
          updateFileStatus(f.name, {
            original: formatBytes(f.size),
            status: "compressing",
          });
          let finalFile = f;
          if (f.type.startsWith("image/")) {
            const r = await compressImage(f, 150);
            finalFile = r.file;
            updateFileStatus(f.name, {
              original: formatBytes(r.originalSize),
              compressed: formatBytes(r.compressedSize),
              status: "done",
            });
          } else {
            updateFileStatus(f.name, {
              compressed: formatBytes(f.size),
              status: "done",
            });
          }

          if (isSupabaseConfigured()) {
            const fd = new FormData();
            fd.append("file", finalFile);
            const path = `docs/${Date.now()}_${finalFile.name}`;
            const { uploadToStorage } = await import("@/lib/actions/upload");
            const res = await uploadToStorage("case-docs", path, fd);
            if (res.success && res.url) {
              documents.push({ name: f.name, type: f.type, url: res.url });
            }
          } else {
            documents.push({
              name: f.name,
              type: f.type,
              url: URL.createObjectURL(finalFile),
            });
          }
        }
      }

      // Handle Confidential Categories (Woman Help & Satta Mukt)
      if (form.category === "women_help" || form.category === "satta_mukt") {
        const confResult = await submitConfidentialCase({
          category: form.category,
          aliasName: form.aliasName || (form.category === "women_help" ? "बहन (गोपनीय)" : "साथी (गोपनीय)"),
          realName: form.fullName,
          phone: form.phone,
          city: form.city,
          description: form.description || form.title,
          safeContactTime: form.safeContactTime,
          supportType:
            form.category === "women_help"
              ? "महिला सुरक्षा, आश्रय व कानूनी सहायता"
              : "सट्टा मुक्ति मनोवैज्ञानिक परामर्श व ऋण मुक्ति मार्गदर्शन",
          urgency: "high",
        });

        if (!confResult.success) {
          if (!isSupabaseConfigured()) {
            setSubmitted(true);
            return;
          }
          throw new Error(confResult.error || "Submission failed");
        }

        setSubmitted(true);
        return;
      }

      // Submit standard public case data
      const result = await submitCase({
        title: form.title,
        description: form.description,
        patient_name: form.fullName,
        age: form.age ? Number(form.age) : undefined,
        age_group:
          Number(form.age) < 18
            ? "child"
            : Number(form.age) >= 60
            ? "elderly"
            : "adult",
        city: form.city,
        category: form.category as Category,
        amount_needed: Number(form.amountNeeded || 0),
        upi_id: form.upiId,
        bank_account: form.bankAccount,
        ifsc: form.ifsc,
        photo_url: photoUrl || undefined,
        video_url: videoUrl || undefined,
        documents,
        urgency: "medium",
      });

      if (!result.success) {
        // Demo mode still shows success if no supabase
        if (!isSupabaseConfigured()) {
          setSubmitted(true);
          return;
        }
        throw new Error(result.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Case Submitted Successfully
        </h1>
        <p className="text-slate-600 mb-6">
          Our team will verify your documents and contact you within 24 to 48 hours.
          You will receive a notification once your case is approved.
        </p>
        <Link href="/" className="text-blue-700 font-semibold hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Status banner */}
      {user ? (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900">
                Verified Applicant: {profile?.full_name || user?.email || "Beneficiary"}
              </div>
              <div className="text-[11px] text-emerald-700">
                Account Role: {role === "admin" ? "Admin Desk" : "Needy / Patient Beneficiary"}
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            My Dashboard
          </Link>
        </div>
      ) : (
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                Needy Case Registration & 4-Pillar Verification
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Fill your genuine medical or emergency details below. Photos and videos will be automatically compressed before submission.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/login?role=beneficiary&mode=signup_otp&redirect=/submit"
              className="flex-1 sm:flex-none text-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-2xs"
            >
              Verify Account
            </Link>
            <button
              type="button"
              onClick={() => loginAsDemo("beneficiary")}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl text-xs hover:bg-amber-50 transition"
            >
              Demo Fill
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("needHelp")}</h1>
      <p className="text-slate-600 mb-8">
        Fill carefully. Photos & videos are auto-compressed (approx 100 KB images, optimized 720p videos)
        directly in your browser before upload.
      </p>

      {!isSupabaseConfigured() && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>Demo mode:</strong> Supabase keys not set. Compression works, data is saved in memory and mock state.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
      >
        {/* Personal */}
        <fieldset>
          <legend className="font-bold text-lg text-slate-900 mb-4">
            1. Personal Information
          </legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                required
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age *</label>
              <input
                required
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                required
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone / WhatsApp *</label>
              <input
                required
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Case details */}
        <fieldset>
          <legend className="font-bold text-lg text-slate-900 mb-4">2. Case Details</legend>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <optgroup label="🔒 100% Confidential (ऑडियंस से पूरी तरह गुप्त - कभी पब्लिक नहीं होगा)">
                  <option value="women_help">Woman Help (Safe & Secure) / महिला सहायता (पहचान गोपनीय)</option>
                  <option value="satta_mukt">सट्टा मुक्त अभियान (Secure) / जुआ-सट्टा मुक्ति काउंसलिंग</option>
                </optgroup>
                <optgroup label="सार्वजनिक मदद / Public Fundraisers">
                  <option value="medical">Medical / चिकित्सा सहायता</option>
                  <option value="education">Education / शिक्षा सहायता</option>
                  <option value="accident">Accident / दुर्घटना राहत</option>
                  <option value="disability">Disability / दिव्यांग सहायता</option>
                  <option value="family">Family Emergency / पारिवारिक सहायता</option>
                  <option value="other">Other / अन्य</option>
                </optgroup>
              </select>
            </div>

            {isConfidential && (
              <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">
                      गोपनीयता (100% Confidential Guarantee)
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed mt-1">
                      मदद मांगने वाले व्यक्ति या उसके परिवार का नाम, फोन नंबर और पहचान पूरी तरह गुप्त रखी जाएगी। एडमिन अप्रूव होने के बाद भी यह जानकारी पब्लिक ऑडियंस को कभी नहीं दिखाई जाएगी।
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                      <span>प्रदर्शित नाम (Alias/Display Name):</span>
                    </label>
                    <input
                      name="aliasName"
                      value={form.aliasName}
                      onChange={handleChange}
                      placeholder="उदा. बहन X, स्वाति या राहुल"
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-amber-800/80 mt-1">
                      वह अपना कोई काल्पनिक नाम चुन सकती हैं, ताकि असली नाम किसी को न दिखे।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>संपर्क का सुरक्षित समय (Safe Contact Time):</span>
                    </label>
                    <select
                      name="safeContactTime"
                      value={form.safeContactTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="दोपहर 01:00 PM से 03:00 PM (ससुराल में शांति का समय)">
                        दोपहर 01:00 PM से 03:00 PM (ससुराल में शांति का समय)
                      </option>
                      <option value="सुबह 10:00 AM से 12:00 PM (जब सब काम पर हों)">
                        सुबह 10:00 AM से 12:00 PM (जब सब काम पर हों)
                      </option>
                      <option value="शाम 05:00 PM से 07:00 PM">
                        शाम 05:00 PM से 07:00 PM
                      </option>
                      <option value="रात 09:00 PM से 10:00 PM (एकांत में)">
                        रात 09:00 PM से 10:00 PM (एकांत में)
                      </option>
                      <option value="केवल WhatsApp संदेश (कॉल बिल्कुल न करें)">
                        केवल WhatsApp संदेश (कॉल बिल्कुल न करें)
                      </option>
                    </select>
                    <p className="text-[11px] text-amber-800/80 mt-1">
                      ताकि NGO टीम कॉल करते समय ससुराल या घर में कोई पास न हो।
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {isConfidential ? "विषय / समस्या संक्षेप में *" : "Case Title *"}
              </label>
              <input
                required
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={
                  isConfidential
                    ? "उदा. पारिवारिक संकट व कानूनी सलाह / सट्टे की लत व कर्ज से मुक्ति"
                    : "e.g. Urgent heart surgery for my son"
                }
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isConfidential ? "पूरी बात लिखें (केवल NGO टीम पढ़ेगी) *" : "Full Description *"}
              </label>
              <textarea
                required
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder={
                  isConfidential
                    ? "आप जो भी साझा करेंगी वह 100% सुरक्षित और आंतरिक रहेगा..."
                    : "Describe the situation..."
                }
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y"
              />
            </div>
            {!isConfidential && (
              <div>
                <label className="block text-sm font-medium mb-1">Required Amount (₹) *</label>
                <input
                  required
                  type="number"
                  name="amountNeeded"
                  value={form.amountNeeded}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>
        </fieldset>

        {/* Bank (Public fundraisers only) */}
        {!isConfidential && (
          <fieldset>
            <legend className="font-bold text-lg text-slate-900 mb-4">
              3. Bank / UPI (Direct Donation)
            </legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">UPI ID *</label>
                <input
                  required
                  name="upiId"
                  value={form.upiId}
                  onChange={handleChange}
                  placeholder="name@upi"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bank Account *</label>
                <input
                  required
                  name="bankAccount"
                  value={form.bankAccount}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IFSC *</label>
                <input
                  required
                  name="ifsc"
                  value={form.ifsc}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </fieldset>
        )}

        {/* Media with auto-compress */}
        <fieldset>
          <legend className="font-bold text-lg text-slate-900 mb-4">
            {isConfidential ? "3. दस्तावेज या प्रमाण (वैकल्पिक / Optional)" : "4. Photo, Video & Documents (Auto-Compressed)"}
          </legend>
          <p className="text-sm text-slate-500 mb-4">
            {isConfidential
              ? "यदि कोई दस्तावेज या रिपोर्ट साझा करना चाहें तो संलग्न करें। यह केवल NGO के पास सुरक्षित रहेगा।"
              : "Images → ~100 KB WebP · Videos → optimized 720p MP4 (Fast, direct compression)."}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {isConfidential ? "फोटो (वैकल्पिक / Optional)" : "Patient / Case Photo *"}
              </label>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                required={!isConfidential}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Short Video (optional, max ~45 sec recommended)
              </label>
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Documents (Prescription, Reports, Aadhaar, Estimate)
              </label>
              <input
                ref={docsRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"
              />
            </div>
          </div>

          {/* Compression progress */}
          {fileStatuses.length > 0 && (
            <div className="mt-4 space-y-2">
              {fileStatuses.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="truncate max-w-[40%]">{f.name}</span>
                  <span className="text-slate-500">
                    {f.original}
                    {f.compressed && f.status === "done" && (
                      <> → <strong className="text-emerald-600">{f.compressed}</strong></>
                    )}
                  </span>
                  <span>
                    {f.status === "compressing" && (
                      <span className="text-blue-600">
                        Compressing{f.progress != null ? ` ${f.progress}%` : "..."}
                      </span>
                    )}
                    {f.status === "done" && (
                      <span className="text-emerald-600 font-medium">Done</span>
                    )}
                    {f.status === "error" && (
                      <span className="text-red-600">Error</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        <div className="flex items-start gap-3">
          <input type="checkbox" required id="consent" className="mt-1" />
          <label htmlFor="consent" className="text-sm text-slate-600">
            I declare all information is true. I consent to verification by Apni Madad team
            and understand donations go directly to my account.
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        {/* Reassurance text right above submit button */}
        <div className="p-4 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center gap-3 text-emerald-950 text-xs sm:text-sm font-semibold shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <span>
            यह फॉर्म पूरी तरह एन्क्रिप्टेड है। आपकी जानकारी केवल NGO के आंतरिक सत्यापन के लिए सुरक्षित रहेगी।
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 ${
            isConfidential
              ? "bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900"
              : "bg-blue-800 hover:bg-blue-900"
          } disabled:bg-slate-400`}
        >
          {submitting ? (
            "Compressing & Submitting..."
          ) : isConfidential ? (
            <>
              <Lock className="w-4 h-4" />
              <span>गोपनीय सहायता अनुरोध सबमिट करें (100% Confidential)</span>
            </>
          ) : (
            "Submit Case for Verification"
          )}
        </button>
      </form>
    </div>
  );
}
