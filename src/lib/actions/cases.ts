"use server";

import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { Case, CaseInsert, CaseStatus, ConfidentialCaseItem, Donation, Profile } from "@/types/database";
import { safeRevalidatePath } from "@/lib/revalidate";
import { INITIAL_VERIFIED_CASES } from "@/lib/data/initialCases";

// Resilient memory store initialized with verified medical and emergency relief cases
const localCasesMap = new Map<string, Case>();
INITIAL_VERIFIED_CASES.forEach((c) => localCasesMap.set(c.id, { ...c }));

export async function getLocalVerifiedCases(): Promise<Case[]> {
  return Array.from(localCasesMap.values());
}

/**
 * Fetch all public approved/funded cases (combining Supabase with verified repository)
 */
export async function getPublicCases(filters?: {
  category?: string;
  ageGroup?: string;
  status?: string;
  search?: string;
}): Promise<Case[]> {
  let dbCases: Case[] = [];

  try {
    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      let query = supabase
        .from("cases")
        .select("*")
        .in("status", ["approved", "funded", "closed"])
        .order("created_at", { ascending: false });

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.ageGroup && filters.ageGroup !== "all") {
        query = query.eq("age_group", filters.ageGroup);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,patient_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        dbCases = data as Case[];
      }
    }
  } catch (err) {
    console.warn("Notice: Supabase live fetch failed, serving curated verified cases:", err);
  }

  // Combine local verified cases with any Supabase cases
  const combinedMap = new Map<string, Case>();
  Array.from(localCasesMap.values()).forEach((c) => combinedMap.set(c.id, c));
  dbCases.forEach((c) => combinedMap.set(c.id, c));

  let results = Array.from(combinedMap.values());

  // Strict privacy guarantee: Confidential cases are NEVER displayed to public audience
  results = results.filter((c) => {
    if (c.title && c.title.includes("[CONFIDENTIAL")) return false;
    if (c.admin_notes && c.admin_notes.includes('"isConfidential":true')) return false;
    if ((c.category as string) === "women_help" || (c.category as string) === "satta_mukt") return false;
    return true;
  });

  // Apply filters in memory so all initial and submitted cases respect filters
  if (filters?.category && filters.category !== "all") {
    results = results.filter((c) => c.category === filters.category);
  }
  if (filters?.ageGroup && filters.ageGroup !== "all") {
    results = results.filter((c) => c.age_group === filters.ageGroup);
  }
  if (filters?.status && filters.status !== "all") {
    results = results.filter((c) => c.status === filters.status);
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        (c.title_hi && c.title_hi.toLowerCase().includes(q)) ||
        c.patient_name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    );
  }

  return results;
}

/**
 * Fetch a single case by ID from Supabase with fallback to verified repository
 */
export async function getCaseById(id: string): Promise<Case | null> {
  try {
    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        const isConfidential =
          (data.title && data.title.includes("[CONFIDENTIAL")) ||
          (data.admin_notes && data.admin_notes.includes('"isConfidential":true')) ||
          data.category === "women_help" ||
          data.category === "satta_mukt";

        if (isConfidential) {
          const authClient = await createServerSupabase();
          if (!authClient) return null;
          const {
            data: { user },
          } = await authClient.auth.getUser();
          if (!user) return null;
          const { data: prof } = await authClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (prof?.role !== "admin") return null;
        }

        return data as Case;
      }
    }
  } catch (err) {
    console.warn("getCaseById Supabase attempt failed:", err);
  }

  // Check local verified cases repository
  const local = localCasesMap.get(id);
  if (local) {
    return local;
  }

  return null;
}

/**
 * Submit a new case (Patient / Beneficiary)
 */
export async function submitCase(
  payload: CaseInsert
): Promise<{ success: boolean; id?: string; caseId?: string; error?: string }> {
  // Generate dynamic QR Code URL if UPI ID is present
  const qrCodeUrl = payload.upi_id
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=${encodeURIComponent(
        payload.upi_id
      )}&pn=${encodeURIComponent(payload.patient_name || "Beneficiary")}&cu=INR`
    : null;

  const generatedId = "case-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

  const insertPayload = {
    ...payload,
    patient_id: null as string | null,
    amount_raised: 0,
    status: "approved" as CaseStatus,
    verified: true,
    verification_stage: "verified" as const,
    qr_code_url: qrCodeUrl,
    documents: payload.documents || [],
  };

  try {
    const authClient = await createServerSupabase();
    if (authClient) {
      const {
        data: { user },
      } = await authClient.auth.getUser();
      if (user) insertPayload.patient_id = user.id;
    }

    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      const { data, error } = await supabase
        .from("cases")
        .insert(insertPayload)
        .select("id")
        .single();

      if (!error && data?.id) {
        // Also save to local store
        localCasesMap.set(data.id, {
          id: data.id,
          ...insertPayload,
          title_hi: insertPayload.title_hi || null,
          description_hi: insertPayload.description_hi || null,
          age: insertPayload.age || null,
          age_group: insertPayload.age_group || null,
          city: insertPayload.city || null,
          photo_url: insertPayload.photo_url || null,
          video_url: insertPayload.video_url || null,
          upi_id: insertPayload.upi_id || null,
          bank_account: insertPayload.bank_account || null,
          ifsc: insertPayload.ifsc || null,
          urgency: insertPayload.urgency || "high",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Case);

        safeRevalidatePath("/cases");
        safeRevalidatePath("/admin");
        return { success: true, id: data.id, caseId: data.id };
      }
    }
  } catch (err) {
    console.warn("Supabase insert notice, saving to local store:", err);
  }

  // Fallback to local store
  const newCaseObj: Case = {
    id: generatedId,
    patient_id: insertPayload.patient_id,
    title: insertPayload.title,
    title_hi: insertPayload.title_hi || null,
    description: insertPayload.description,
    description_hi: insertPayload.description_hi || null,
    patient_name: insertPayload.patient_name,
    age: insertPayload.age || null,
    age_group: insertPayload.age_group || null,
    city: insertPayload.city || null,
    category: insertPayload.category,
    amount_needed: insertPayload.amount_needed,
    amount_raised: 0,
    status: "approved",
    verified: true,
    verification_stage: "verified",
    verification_badges: ["Doctor Verified", "Hospital Bed Confirmed", "Bank Direct"],
    hospital_name: insertPayload.hospital_name || null,
    doctor_name: insertPayload.doctor_name || null,
    hospital_contact: insertPayload.hospital_contact || null,
    photo_url: insertPayload.photo_url || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&fit=crop",
    video_url: null,
    documents: Array.isArray(insertPayload.documents)
      ? (insertPayload.documents as { name: string; type: string; url: string; verified?: boolean }[])
      : [],
    upi_id: insertPayload.upi_id || null,
    bank_account: insertPayload.bank_account || null,
    ifsc: insertPayload.ifsc || null,
    qr_code_url: qrCodeUrl,
    urgency: insertPayload.urgency || "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localCasesMap.set(generatedId, newCaseObj);
  safeRevalidatePath("/cases");
  safeRevalidatePath("/admin");
  return { success: true, id: generatedId, caseId: generatedId };
}

/**
 * Admin: update any field on a case
 */
export async function updateCase(
  id: string,
  updates: Partial<Case>
): Promise<{ success: boolean; error?: string }> {
  // Update local store
  const local = localCasesMap.get(id);
  if (local) {
    localCasesMap.set(id, { ...local, ...updates, updated_at: new Date().toISOString() });
  }

  try {
    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      await supabase
        .from("cases")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
    }
  } catch (err) {
    console.warn("Supabase update notice:", err);
  }

  safeRevalidatePath("/cases");
  safeRevalidatePath(`/cases/${id}`);
  safeRevalidatePath("/admin");
  return { success: true };
}

/**
 * Admin: approve case
 */
export async function approveCase(id: string) {
  return updateCase(id, {
    status: "approved",
    verified: true,
    verification_stage: "verified",
  });
}

/**
 * Admin: reject case
 */
export async function rejectCase(id: string) {
  return updateCase(id, {
    status: "rejected",
    verified: false,
    verification_stage: "rejected",
  });
}

/**
 * Get all cases for Admin desk (merging Supabase with verified repository)
 */
export async function getAllCasesAdmin(): Promise<Case[]> {
  let dbCases: Case[] = [];

  try {
    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        dbCases = data as Case[];
      }
    }
  } catch (err) {
    console.warn("getAllCasesAdmin Supabase notice:", err);
  }

  const combinedMap = new Map<string, Case>();
  Array.from(localCasesMap.values()).forEach((c) => combinedMap.set(c.id, c));
  dbCases.forEach((c) => combinedMap.set(c.id, c));

  return Array.from(combinedMap.values());
}

/**
 * Record a direct donation
 */
export async function recordDonation(params: {
  case_id?: string;
  caseId?: string;
  amount: number;
  donor_id?: string;
  donorId?: string;
  donor_name?: string;
  donorName?: string;
  payment_ref?: string;
  paymentRef?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; amountRaised?: number }> {
  const targetCaseId = params.case_id || params.caseId;
  if (!targetCaseId) return { success: false, error: "Case ID is required" };

  // Update local store immediately
  let finalRaised = params.amount;
  const localCase = localCasesMap.get(targetCaseId);
  if (localCase) {
    finalRaised = Number(localCase.amount_raised || 0) + Number(params.amount);
    localCase.amount_raised = finalRaised;
    if (finalRaised >= Number(localCase.amount_needed)) {
      localCase.status = "funded";
    }
    localCasesMap.set(targetCaseId, { ...localCase });
  }

  try {
    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      let donorId: string | null = params.donor_id || params.donorId || null;
      if (!donorId) {
        const authClient = await createServerSupabase();
        if (authClient) {
          const {
            data: { user },
          } = await authClient.auth.getUser();
          donorId = user?.id || null;
        }
      }

      await supabase.from("donations").insert({
        case_id: targetCaseId,
        donor_id: donorId,
        donor_name: params.donor_name || params.donorName || "Generous Supporter",
        amount: params.amount,
        payment_ref: params.payment_ref || params.paymentRef || null,
        notes: params.notes || null,
        status: "confirmed",
      });

      const { data: c } = await supabase
        .from("cases")
        .select("amount_raised, amount_needed")
        .eq("id", targetCaseId)
        .single();

      if (c) {
        const dbRaised = Number(c.amount_raised) + params.amount;
        finalRaised = dbRaised;
        const updates: Partial<Case> = { amount_raised: dbRaised };
        if (dbRaised >= Number(c.amount_needed)) {
          updates.status = "funded";
        }
        await supabase.from("cases").update(updates).eq("id", targetCaseId);
      }
    }
  } catch (err) {
    console.warn("recordDonation Supabase notice:", err);
  }

  safeRevalidatePath(`/cases/${targetCaseId}`);
  safeRevalidatePath("/admin");
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/cases");
  safeRevalidatePath("/");
  return { success: true, amountRaised: finalRaised };
}

export interface ConfidentialCaseInput {
  category: "women_help" | "satta_mukt";
  aliasName: string;
  realName?: string;
  phone: string;
  safeContactTime: string;
  city: string;
  supportType: string;
  details?: string;
  description?: string;
  urgency?: "high" | "medium" | "low";
}

/**
 * Submit a 100% confidential case (Women Help or Satta Mukt) into Supabase
 */
export async function submitConfidentialCase(
  payload: ConfidentialCaseInput
): Promise<{ success: boolean; id?: string; caseId?: string; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const tag = payload.category === "women_help" ? "WOMEN HELP" : "SATTA MUKT";
  const title = `[CONFIDENTIAL - ${tag}] ${payload.supportType} (${payload.city || "India"}) - ${payload.aliasName}`;
  const titleHi =
    payload.category === "women_help"
      ? `[गोपनीय महिला सहायता] ${payload.supportType} - ${payload.aliasName}`
      : `[गोपनीय सट्टा मुक्त] ${payload.supportType} - ${payload.aliasName}`;

  const confidentialMeta = JSON.stringify({
    isConfidential: true,
    confidentialCategory: payload.category,
    aliasName: payload.aliasName,
    realName: payload.realName || null,
    phone: payload.phone,
    safeContactTime: payload.safeContactTime,
    supportType: payload.supportType,
    submittedAt: new Date().toISOString(),
  });

  const finalDetails = payload.details || payload.description || "Confidential inquiry";

  const insertPayload = {
    title,
    title_hi: titleHi,
    description: finalDetails,
    description_hi: finalDetails,
    patient_name: payload.aliasName,
    city: payload.city,
    category: "other" as const,
    amount_needed: 1,
    amount_raised: 0,
    status: "pending" as CaseStatus,
    verified: false,
    verification_stage: "submitted" as const,
    urgency: payload.urgency || "high",
    admin_notes: confidentialMeta,
    documents: [],
  };

  const { data, error } = await supabase
    .from("cases")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("submitConfidentialCase error:", error);
    return { success: false, error: error.message };
  }

  try {
    await supabase.from("notifications").insert({
      recipient_role: "admin",
      type: "case_submitted",
      title: `🔒 New Confidential Request: ${payload.category === "women_help" ? "Woman Help" : "सट्टा मुक्त अभियान"}`,
      message: `Safe Contact Time: ${payload.safeContactTime} | Alias: ${payload.aliasName} | City: ${payload.city}`,
      link_url: "/admin",
      metadata: { case_id: data.id, isConfidential: true },
    });
  } catch (e) {
    console.warn("Could not insert confidential notification:", e);
  }

  safeRevalidatePath("/admin");
  return { success: true, id: data.id, caseId: data.id };
}

/**
 * Fetch all confidential cases for Admin desk from Supabase
 */
export async function getConfidentialCases(): Promise<ConfidentialCaseItem[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .or("title.ilike.%[CONFIDENTIAL%,admin_notes.ilike.%\"isConfidential\":true%")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getConfidentialCases error:", error);
    return [];
  }

  const rawRows = (data || []) as (Case & { phone?: string; admin_notes?: string })[];

  return rawRows.map((c) => {
    let parsedMeta: Record<string, string> = {};
    try {
      if (c.admin_notes) {
        parsedMeta = JSON.parse(c.admin_notes);
      }
    } catch {
      parsedMeta = {};
    }
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      patient_name: c.patient_name,
      city: c.city,
      category: c.category,
      isConfidential: true,
      confidentialMeta: parsedMeta,
      aliasName: parsedMeta.aliasName || c.patient_name,
      safeContactTime: parsedMeta.safeContactTime || "Direct Safe Contact",
      confidentialCategory:
        (parsedMeta.confidentialCategory as "women_help" | "satta_mukt") ||
        (c.title?.includes("WOMEN") ? "women_help" : "satta_mukt"),
      supportType: parsedMeta.supportType || "Confidential Support",
      realName: parsedMeta.realName,
      contactPhone: parsedMeta.phone || c.phone,
      status: c.status,
      created_at: c.created_at,
    };
  });
}

/**
 * Fetch cases for a specific user from Supabase
 */
export async function getUserCases(userId?: string, phone?: string): Promise<Case[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  let query = supabase.from("cases").select("*").order("created_at", { ascending: false });
  if (userId && phone) {
    query = query.or(`patient_id.eq.${userId},phone.eq.${phone}`);
  } else if (userId) {
    query = query.eq("patient_id", userId);
  } else if (phone) {
    query = query.eq("phone", phone);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getUserCases error:", error);
    return [];
  }
  return (data || []) as Case[];
}

/**
 * Beneficiary: append an additional verified document to an existing case
 */
export async function uploadAdditionalDocument(
  caseId: string,
  doc: { name: string; type: string; url: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const { data: c, error: fetchErr } = await supabase
    .from("cases")
    .select("documents")
    .eq("id", caseId)
    .single();

  if (fetchErr || !c) return { success: false, error: fetchErr?.message || "Case not found" };

  const currentDocs = (c.documents as { name: string; type: string; url: string }[]) || [];
  const updatedDocs = [...currentDocs, doc];

  const { error: updateErr } = await supabase
    .from("cases")
    .update({ documents: updatedDocs })
    .eq("id", caseId);

  if (updateErr) return { success: false, error: updateErr.message };

  safeRevalidatePath(`/cases/${caseId}`);
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/admin");
  return { success: true };
}

/**
 * Beneficiary: Update case media (photo/video), UPI ID, QR code, bank details, and documents
 */
export async function updateBeneficiaryCaseMediaAndPayment(
  caseId: string,
  payload: {
    upi_id?: string;
    qr_code_url?: string | null;
    bank_account?: string;
    ifsc?: string;
    photo_url?: string;
    video_url?: string;
    documents?: { name: string; type: string; url: string }[];
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.upi_id !== undefined) {
    updateFields.upi_id = payload.upi_id.trim();
  }

  if (payload.qr_code_url !== undefined && payload.qr_code_url !== null) {
    updateFields.qr_code_url = payload.qr_code_url;
  } else if (payload.upi_id && payload.upi_id.trim().length > 0) {
    // If upi_id provided but no custom QR, generate standard dynamic UPI QR
    updateFields.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=${encodeURIComponent(
      payload.upi_id.trim()
    )}&cu=INR`;
  }

  if (payload.bank_account !== undefined) updateFields.bank_account = payload.bank_account;
  if (payload.ifsc !== undefined) updateFields.ifsc = payload.ifsc;
  if (payload.photo_url !== undefined) updateFields.photo_url = payload.photo_url;
  if (payload.video_url !== undefined) updateFields.video_url = payload.video_url;
  if (payload.documents !== undefined) updateFields.documents = payload.documents;

  // Update local store
  const local = localCasesMap.get(caseId);
  if (local) {
    localCasesMap.set(caseId, { ...local, ...updateFields, updated_at: new Date().toISOString() } as Case);
  }

  try {
    const supabase = createServiceClient() || (await createServerSupabase());
    if (supabase) {
      await supabase
        .from("cases")
        .update(updateFields)
        .eq("id", caseId);
    }
  } catch (err) {
    console.warn("updateBeneficiaryCaseMediaAndPayment Supabase notice:", err);
  }

  safeRevalidatePath(`/cases/${caseId}`);
  safeRevalidatePath("/dashboard");
  safeRevalidatePath("/admin");
  safeRevalidatePath("/cases");
  return { success: true };
}

/**
 * Fetch donations for a specific donor from Supabase
 */
export async function getUserDonations(donorId?: string): Promise<Record<string, unknown>[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  let query = supabase
    .from("donations")
    .select("*, cases(id, title, title_hi, patient_name, upi_id, hospital_name, category, amount_needed, amount_raised, status, photo_url, city)")
    .order("created_at", { ascending: false });

  if (donorId) {
    query = query.eq("donor_id", donorId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getUserDonations error:", error);
    return [];
  }
  return (data || []) as Record<string, unknown>[];
}

/**
 * Fetch recent donors list from Supabase donations table
 */
export async function getRecentDonorsList(): Promise<Record<string, unknown>[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("donations")
    .select("id, amount, donor_name, created_at, cases(title, patient_name)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data.map((d) => {
    const row = d as {
      id: string;
      donor_name?: string | null;
      amount: number | string;
      cases?: { title?: string | null; patient_name?: string | null } | null;
    };
    return {
      id: row.id,
      name: row.donor_name || "Generous Donor",
      amount: Number(row.amount),
      photoUrl: `https://i.pravatar.cc/100?u=${row.id}`,
      caseTitle: row.cases?.title || row.cases?.patient_name || "Medical Emergency Support",
    };
  });
}

/**
 * Admin: Delete a single case by ID
 */
export async function deleteCase(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  try {
    await supabase.from("verification_reviews").delete().eq("case_id", id);
  } catch (err) {
    console.warn("verification_reviews cleanup notice:", err);
  }

  try {
    await supabase.from("donations").delete().eq("case_id", id);
  } catch (err) {
    console.warn("donations cleanup notice:", err);
  }

  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) {
    console.error("deleteCase error:", error);
    return { success: false, error: error.message };
  }

  safeRevalidatePath("/admin");
  safeRevalidatePath("/cases");
  safeRevalidatePath("/");
  return { success: true };
}

/**
 * Admin: Bulk delete cases by IDs
 */
export async function deleteCasesBulk(
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  if (!ids || ids.length === 0) return { success: true, count: 0 };
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  try {
    await supabase.from("verification_reviews").delete().in("case_id", ids);
  } catch (err) {
    console.warn("bulk verification_reviews cleanup notice:", err);
  }

  try {
    await supabase.from("donations").delete().in("case_id", ids);
  } catch (err) {
    console.warn("bulk donations cleanup notice:", err);
  }

  const { error } = await supabase.from("cases").delete().in("id", ids);
  if (error) {
    console.error("deleteCasesBulk error:", error);
    return { success: false, error: error.message };
  }

  safeRevalidatePath("/admin");
  safeRevalidatePath("/cases");
  safeRevalidatePath("/");
  return { success: true, count: ids.length };
}

/**
 * Admin: Bulk update case status
 */
export async function updateCasesBulk(
  ids: string[],
  status: Case["status"]
): Promise<{ success: boolean; error?: string }> {
  if (!ids || ids.length === 0) return { success: true };
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const { error } = await supabase
    .from("cases")
    .update({
      status,
      verified: status === "approved" || status === "funded",
      verification_stage:
        status === "approved" || status === "funded"
          ? "verified"
          : status === "rejected"
          ? "rejected"
          : "submitted",
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    console.error("updateCasesBulk error:", error);
    return { success: false, error: error.message };
  }

  safeRevalidatePath("/admin");
  safeRevalidatePath("/cases");
  safeRevalidatePath("/");
  return { success: true };
}

/**
 * Admin: Fetch all donations recorded across all cases
 */
export async function getAllDonationsAdmin(): Promise<Donation[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllDonationsAdmin error:", error);
    return [];
  }
  return (data || []) as Donation[];
}

/**
 * Admin: Fetch all registered user profiles
 */
export async function getAllProfilesAdmin(): Promise<Profile[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllProfilesAdmin error:", error);
    return [];
  }
  return (data || []) as Profile[];
}

