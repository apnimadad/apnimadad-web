"use server";

import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { Case, CaseInsert, CaseStatus, ConfidentialCaseItem } from "@/types/database";
import { revalidatePath } from "next/cache";

/**
 * Fetch all public approved/funded cases directly from Supabase
 */
export async function getPublicCases(filters?: {
  category?: string;
  ageGroup?: string;
  status?: string;
  search?: string;
}): Promise<Case[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

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
  if (error) {
    console.error("getPublicCases error:", error);
    return [];
  }

  // Strict privacy guarantee: Confidential cases are NEVER displayed to public audience
  const rawList = (data || []) as Case[];
  const publicCases = rawList.filter((c) => {
    if (c.title && c.title.includes("[CONFIDENTIAL")) return false;
    if (c.admin_notes && c.admin_notes.includes('"isConfidential":true')) return false;
    if ((c.category as string) === "women_help" || (c.category as string) === "satta_mukt") return false;
    return true;
  });

  return publicCases;
}

/**
 * Fetch a single case by ID from Supabase
 */
export async function getCaseById(id: string): Promise<Case | null> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // If this is a confidential case, restrict access strictly to admin
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

/**
 * Submit a new case (Patient / Beneficiary)
 */
export async function submitCase(
  payload: CaseInsert
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const authClient = await createServerSupabase();
  let patientId: string | null = null;
  if (authClient) {
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user) patientId = user.id;
  }

  // Generate dynamic QR Code URL if UPI ID is present
  const qrCodeUrl = payload.upi_id
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=${encodeURIComponent(
        payload.upi_id
      )}&pn=${encodeURIComponent(payload.patient_name || "Beneficiary")}&cu=INR`
    : null;

  const insertPayload = {
    ...payload,
    patient_id: patientId,
    amount_raised: 0,
    status: "pending" as CaseStatus,
    verified: false,
    verification_stage: "submitted" as const,
    qr_code_url: qrCodeUrl,
    documents: payload.documents || [],
  };

  const { data, error } = await supabase
    .from("cases")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("submitCase error:", error);
    return { success: false, error: error.message };
  }

  // Trigger admin notification in Supabase
  try {
    await supabase.from("notifications").insert({
      recipient_role: "admin",
      type: "case_submitted",
      title: "New Case Submitted for Verification",
      message: `${payload.patient_name} submitted a case: "${payload.title}" (${payload.category}) needing ₹${payload.amount_needed}.`,
      link_url: "/admin",
      metadata: { case_id: data.id },
    });
  } catch (notifErr) {
    console.warn("Could not insert notification:", notifErr);
  }

  revalidatePath("/cases");
  revalidatePath("/admin");
  return { success: true, id: data.id };
}

/**
 * Admin: update any field on a case in Supabase
 */
export async function updateCase(
  id: string,
  updates: Partial<Case>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const { error } = await supabase
    .from("cases")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/cases");
  revalidatePath(`/cases/${id}`);
  revalidatePath("/admin");
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
 * Get all cases for Admin desk from Supabase
 */
export async function getAllCasesAdmin(): Promise<Case[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllCasesAdmin error:", error);
    return [];
  }
  return (data || []) as Case[];
}

/**
 * Record a direct donation in Supabase
 */
export async function recordDonation(params: {
  case_id: string;
  amount: number;
  donor_name?: string;
  payment_ref?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return { success: false, error: "Database not connected" };

  const authClient = await createServerSupabase();
  let donorId: string | null = null;
  if (authClient) {
    const {
      data: { user },
    } = await authClient.auth.getUser();
    donorId = user?.id || null;
  }

  const { error: donError } = await supabase.from("donations").insert({
    case_id: params.case_id,
    donor_id: donorId,
    donor_name: params.donor_name || "Generous Supporter",
    amount: params.amount,
    payment_ref: params.payment_ref || null,
    notes: params.notes || null,
    status: "confirmed",
  });

  if (donError) return { success: false, error: donError.message };

  // Increment amount_raised on case
  const { data: c } = await supabase
    .from("cases")
    .select("amount_raised, amount_needed")
    .eq("id", params.case_id)
    .single();

  if (c) {
    const newRaised = Number(c.amount_raised) + params.amount;
    const updates: Partial<Case> = { amount_raised: newRaised };
    if (newRaised >= Number(c.amount_needed)) {
      updates.status = "funded";
    }
    await supabase.from("cases").update(updates).eq("id", params.case_id);
  }

  revalidatePath(`/cases/${params.case_id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
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
): Promise<{ success: boolean; id?: string; error?: string }> {
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

  revalidatePath("/admin");
  return { success: true, id: data.id };
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
export async function getUserCases(userId?: string): Promise<Case[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  let query = supabase.from("cases").select("*").order("created_at", { ascending: false });
  if (userId) {
    query = query.eq("patient_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getUserCases error:", error);
    return [];
  }
  return (data || []) as Case[];
}

/**
 * Fetch donations for a specific donor from Supabase
 */
export async function getUserDonations(donorId?: string): Promise<Record<string, unknown>[]> {
  const supabase = createServiceClient() || (await createServerSupabase());
  if (!supabase) return [];

  let query = supabase
    .from("donations")
    .select("*, cases(title, title_hi, patient_name, upi_id)")
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
