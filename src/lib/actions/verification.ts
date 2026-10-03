"use server";

import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { CaseVerification, VerificationChecklist } from "@/types/database";
import { createNotification } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";

// In-memory verification store for demo mode fallback
const demoVerificationsStore: Record<string, CaseVerification> = {
  "case-001": {
    id: "verif-001",
    case_id: "case-001",
    reviewer_id: "admin-01",
    reviewer_name: "Dr. Shahnawaz (NGO Head)",
    checklist: {
      idVerified: true,
      idNotes: "Aadhaar Card cross-checked with father Raju Sharma.",
      medicalVerified: true,
      medicalNotes: "King George's Medical University Cardiology estimate of ₹4,50,000 verified.",
      bankAccountVerified: true,
      bankNotes: "SBI bank account IFSC & UPI handle match beneficiary.",
      fieldVisitDone: true,
      fieldNotes: "NGO volunteer visited family in Lucknow on 28 Aug 2026.",
    },
    decision: "approved",
    decision_reason: "All 4 pillars verified. Immediate open-heart surgery required.",
    verification_badges: ["id_verified", "hospital_verified", "field_verified", "zero_commission_guarantee"],
    created_at: "2026-08-28T10:00:00Z",
    updated_at: "2026-08-28T12:00:00Z",
  },
};

export async function getCaseVerification(caseId: string): Promise<CaseVerification | null> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return demoVerificationsStore[caseId] || null;
  }

  const { data, error } = await supabase
    .from("case_verifications")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as CaseVerification;
}

export async function submitVerificationReview(params: {
  caseId: string;
  checklist: VerificationChecklist;
  decision: "approved" | "rejected" | "needs_info";
  decisionReason?: string;
  badges: string[];
  reviewerName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  if (!supabase) {
    // Save to demo store
    demoVerificationsStore[params.caseId] = {
      id: "verif-" + Date.now(),
      case_id: params.caseId,
      reviewer_id: "demo-admin",
      reviewer_name: params.reviewerName || "NGO Verification Committee",
      checklist: params.checklist,
      decision: params.decision,
      decision_reason: params.decisionReason || null,
      verification_badges: params.badges,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Trigger demo notification
    if (params.decision === "approved") {
      await createNotification({
        recipientRole: "all",
        type: "case_approved",
        title: "Case Verified & Approved",
        message: `Case ${params.caseId} has been successfully verified with ${params.badges.length} badges.`,
        linkUrl: `/cases/${params.caseId}`,
      });
    } else if (params.decision === "rejected") {
      await createNotification({
        recipientRole: "beneficiary",
        type: "case_rejected",
        title: "Case Verification Status",
        message: params.decisionReason || "Your case could not be approved at this time.",
        linkUrl: "/dashboard",
      });
    }

    revalidatePath(`/cases/${params.caseId}`);
    revalidatePath("/admin");
    return { success: true };
  }

  const service = createServiceClient() || supabase;

  // Insert or update verification record
  const { error: verifError } = await service.from("case_verifications").insert({
    case_id: params.caseId,
    reviewer_name: params.reviewerName || "NGO Verification Officer",
    checklist: params.checklist,
    decision: params.decision,
    decision_reason: params.decisionReason,
    verification_badges: params.badges,
  });

  if (verifError) {
    console.error("Verification insert error:", verifError);
    return { success: false, error: verifError.message };
  }

  // Update cases status
  const caseUpdates: Record<string, unknown> = {
    admin_notes: params.decisionReason || null,
    updated_at: new Date().toISOString(),
  };

  if (params.decision === "approved") {
    caseUpdates.status = "approved";
    caseUpdates.verified = true;
    caseUpdates.verification_stage = "verified";
    caseUpdates.verification_badges = params.badges;
  } else if (params.decision === "rejected") {
    caseUpdates.status = "rejected";
    caseUpdates.verified = false;
    caseUpdates.verification_stage = "rejected";
  } else if (params.decision === "needs_info") {
    caseUpdates.verification_stage = "docs_under_review";
  }

  const { error: caseError } = await service
    .from("cases")
    .update(caseUpdates)
    .eq("id", params.caseId);

  if (caseError) {
    return { success: false, error: caseError.message };
  }

  revalidatePath(`/cases/${params.caseId}`);
  revalidatePath("/cases");
  revalidatePath("/admin");
  return { success: true };
}
