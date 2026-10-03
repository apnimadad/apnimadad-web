"use server";

import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { Case, CaseInsert, CaseStatus } from "@/types/database";
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
  return (data || []) as Case[];
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

  if (error) return null;
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
