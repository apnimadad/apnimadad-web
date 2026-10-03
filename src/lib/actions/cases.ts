"use server";

import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { Case, CaseInsert, CaseStatus, ConfidentialCaseItem } from "@/types/database";
import { mockCases as rawMockCases } from "@/lib/mock-data";
import { revalidatePath } from "next/cache";

function toDbCase(c: typeof rawMockCases[0]): Case {
  return {
    id: c.id,
    patient_id: "demo-patient",
    title: c.title,
    title_hi: c.titleHi,
    description: c.description,
    description_hi: c.descriptionHi,
    patient_name: c.patientName,
    age: c.age,
    age_group: c.ageGroup,
    city: c.city,
    category: c.category,
    amount_needed: c.amountNeeded,
    amount_raised: c.amountRaised,
    status: c.status,
    verified: c.verified,
    photo_url: c.photoUrl,
    video_url: c.videoUrl || null,
    documents: c.documents,
    upi_id: c.upiId,
    bank_account: c.bankAccount,
    ifsc: c.ifsc,
    qr_code_url: c.qrCodeUrl,
    urgency: c.urgency,
    created_at: c.createdAt,
    updated_at: c.createdAt,
  };
}

/** Fetch all public (approved/funded) cases */
export async function getPublicCases(filters?: {
  category?: string;
  ageGroup?: string;
  status?: string;
  search?: string;
}): Promise<Case[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    let list = rawMockCases.map(toDbCase);
    if (filters?.category && filters.category !== "all") {
      list = list.filter((c) => c.category === filters.category);
    }
    if (filters?.ageGroup && filters.ageGroup !== "all") {
      list = list.filter((c) => c.age_group === filters.ageGroup);
    }
    if (filters?.status && filters.status !== "all") {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.patient_name.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }
    return list;
  }

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
  // Guarantee: Confidential cases (Women Help & Satta Mukt) are NEVER shown to public audience
  const rawList = (data || []) as Case[];
  const publicCases = rawList.filter((c) => {
    if (c.title && c.title.includes("[CONFIDENTIAL")) return false;
    if (c.admin_notes && c.admin_notes.includes('"isConfidential":true')) return false;
    if ((c.category as string) === "women_help" || (c.category as string) === "satta_mukt") return false;
    return true;
  });
  return publicCases;
}

export async function getCaseById(id: string): Promise<Case | null> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    const found = rawMockCases.find((c) => c.id === id);
    return found ? toDbCase(found) : null;
  }

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // If this is a confidential case, block public access completely
  const isConfidential =
    (data.title && data.title.includes("[CONFIDENTIAL")) ||
    (data.admin_notes && data.admin_notes.includes('"isConfidential":true')) ||
    data.category === "women_help" ||
    data.category === "satta_mukt";

  if (isConfidential) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (prof?.role !== "admin") return null;
  }

  return data as Case;
}

/** Submit a new case (patient) */
export async function submitCase(
  payload: CaseInsert & { patient_id?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase not configured. Running in demo mode." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insertData = {
    ...payload,
    patient_id: payload.patient_id || user?.id || null,
    status: "pending" as CaseStatus,
    verified: false,
    amount_raised: 0,
    documents: payload.documents || [],
  };

  const { data, error } = await supabase
    .from("cases")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("submitCase error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/cases");
  revalidatePath("/admin");
  return { success: true, id: data.id };
}

/** Admin: update case */
export async function updateCase(
  id: string,
  updates: Partial<Case>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { success: false, error: "Not configured" };

  // Check admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // Allow service role fallback for first setup
    const service = createServiceClient();
    if (!service) return { success: false, error: "Admin access required" };
  }

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

/** Admin: approve case */
export async function approveCase(id: string) {
  return updateCase(id, { status: "approved", verified: true });
}

/** Admin: reject case */
export async function rejectCase(id: string) {
  return updateCase(id, { status: "rejected", verified: false });
}

/** Get all cases for admin */
export async function getAllCasesAdmin(): Promise<Case[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Case[];
}

/** Record a donation (manual confirmation by admin or donor) */
export async function recordDonation(params: {
  case_id: string;
  amount: number;
  payment_ref?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { success: false, error: "Not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: donError } = await supabase.from("donations").insert({
    case_id: params.case_id,
    donor_id: user?.id || null,
    amount: params.amount,
    payment_ref: params.payment_ref || null,
    notes: params.notes || null,
  });

  if (donError) return { success: false, error: donError.message };

  // Increment amount_raised
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

/** Submit a 100% confidential case (Women Help or Satta Mukt) */
export async function submitConfidentialCase(
  payload: ConfidentialCaseInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createServiceClient() || (await createServerSupabase());

  const tag = payload.category === "women_help" ? "WOMEN HELP" : "SATTA MUKT";
  const title = `[CONFIDENTIAL ${tag}] ${payload.supportType} (${payload.city || "India"}) - ${payload.aliasName}`;
  const titleHi = payload.category === "women_help" 
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
    category: "other",
    amount_needed: 1,
    amount_raised: 0,
    status: "pending" as CaseStatus,
    verified: false,
    verification_stage: "submitted" as const,
    urgency: payload.urgency || "high",
    admin_notes: confidentialMeta,
    documents: [],
  };

  if (!supabase) {
    return {
      success: true,
      id: "demo-confidential-" + Date.now(),
    };
  }

  const { data, error } = await supabase.from("cases").insert(insertPayload).select("id").single();
  if (error) {
    console.error("submitConfidentialCase error:", error);
    return { success: false, error: error.message };
  }

  try {
    await supabase.from("notifications").insert({
      recipient_role: "admin",
      type: "case_submitted",
      title: `🔒 New Confidential Case: ${payload.category === "women_help" ? "Woman Help" : "सट्टा मुक्त अभियान"}`,
      message: `Safe Contact Time: ${payload.safeContactTime} | Alias: ${payload.aliasName} | City: ${payload.city}`,
      link_url: "/admin",
      metadata: { case_id: data.id, isConfidential: true },
    });
  } catch (notifErr) {
    console.warn("Confidential notification notice:", notifErr);
  }

  revalidatePath("/admin");
  return { success: true, id: data.id };
}

/** Retrieve all confidential cases (Admin only) */
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
      confidentialCategory: (parsedMeta.confidentialCategory as "women_help" | "satta_mukt") || (c.title?.includes("WOMEN") ? "women_help" : "satta_mukt"),
      supportType: parsedMeta.supportType || "Confidential Support",
      realName: parsedMeta.realName,
      contactPhone: parsedMeta.phone || c.phone,
      status: c.status,
      created_at: c.created_at,
    };
  });
}
