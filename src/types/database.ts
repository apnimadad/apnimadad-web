export type CaseStatus = "pending" | "approved" | "funded" | "closed" | "rejected";
export type AgeGroup = "child" | "adult" | "elderly";
export type Category = "medical" | "education" | "accident" | "disability" | "family" | "other";
export type UserRole = "donor" | "beneficiary" | "admin";
export type VerificationStage = "submitted" | "docs_under_review" | "field_check" | "verified" | "rejected";
export type NotificationType = "case_submitted" | "case_approved" | "case_rejected" | "donation_received" | "verification_update" | "payout_proof" | "system";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface VerificationChecklist {
  idVerified: boolean;
  idNotes?: string;
  medicalVerified: boolean;
  medicalNotes?: string;
  bankAccountVerified: boolean;
  bankNotes?: string;
  fieldVisitDone: boolean;
  fieldNotes?: string;
}

export interface CaseVerification {
  id: string;
  case_id: string;
  reviewer_id: string | null;
  reviewer_name?: string | null;
  checklist: VerificationChecklist;
  decision: "approved" | "rejected" | "needs_info" | "pending";
  decision_reason?: string | null;
  verification_badges: string[];
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  patient_id: string | null;
  title: string;
  title_hi: string | null;
  description: string;
  description_hi: string | null;
  patient_name: string;
  age: number | null;
  age_group: AgeGroup | null;
  city: string | null;
  category: Category;
  amount_needed: number;
  amount_raised: number;
  status: CaseStatus;
  verified: boolean;
  verification_stage?: VerificationStage;
  verification_badges?: string[];
  hospital_name?: string | null;
  doctor_name?: string | null;
  hospital_contact?: string | null;
  admin_notes?: string | null;
  photo_url: string | null;
  video_url: string | null;
  documents: { name: string; type: string; url: string; verified?: boolean }[];
  upi_id: string | null;
  bank_account: string | null;
  ifsc: string | null;
  qr_code_url: string | null;
  urgency: "high" | "medium" | "low";
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  case_id: string;
  donor_id: string | null;
  donor_name?: string | null;
  amount: number;
  payment_ref: string | null;
  payment_method?: "upi" | "bank_transfer";
  notes: string | null;
  receipt_url?: string | null;
  status?: "pending" | "confirmed" | "rejected";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string | null;
  recipient_role?: UserRole | "all";
  type: NotificationType;
  title: string;
  message: string;
  link_url?: string | null;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CaseInsert {
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  patient_name: string;
  age?: number;
  age_group?: AgeGroup;
  city?: string;
  category: Category;
  amount_needed: number;
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  phone?: string;
  photo_url?: string;
  video_url?: string;
  hospital_name?: string;
  doctor_name?: string;
  hospital_contact?: string;
  documents?: { name: string; type: string; url: string }[];
  urgency?: "high" | "medium" | "low";
}
