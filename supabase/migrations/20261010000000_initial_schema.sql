-- ============================================================
-- Apni Madad Foundation - Complete Production Supabase Schema
-- Includes: Authentication, Multi-Tier Verification, In-App Notifications,
-- Direct Donations Tracking, Audit Trail, and Storage Policies
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Profiles Table (extends auth.users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'beneficiary', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Cases Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_hi TEXT,
  description TEXT NOT NULL,
  description_hi TEXT,
  patient_name TEXT NOT NULL,
  age INT,
  age_group TEXT CHECK (age_group IN ('child', 'adult', 'elderly')),
  city TEXT,
  category TEXT NOT NULL CHECK (category IN ('medical', 'education', 'accident', 'disability', 'family', 'other')),
  amount_needed NUMERIC NOT NULL CHECK (amount_needed > 0),
  amount_raised NUMERIC DEFAULT 0 CHECK (amount_raised >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'funded', 'closed', 'rejected')),
  verified BOOLEAN DEFAULT FALSE,
  verification_stage TEXT DEFAULT 'submitted' CHECK (verification_stage IN ('submitted', 'docs_under_review', 'field_check', 'verified', 'rejected')),
  verification_badges JSONB DEFAULT '[]'::jsonb,
  hospital_name TEXT,
  doctor_name TEXT,
  hospital_contact TEXT,
  admin_notes TEXT,
  photo_url TEXT,
  video_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  upi_id TEXT,
  bank_account TEXT,
  ifsc TEXT,
  qr_code_url TEXT,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_category ON public.cases(category);
CREATE INDEX IF NOT EXISTS idx_cases_patient ON public.cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_created ON public.cases(created_at DESC);

-- ------------------------------------------------------------
-- 3. Case Verifications (Deep Audit & Checklists)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  checklist JSONB NOT NULL DEFAULT '{
    "idVerified": false,
    "medicalVerified": false,
    "bankAccountVerified": false,
    "fieldVisitDone": false
  }'::jsonb,
  decision TEXT DEFAULT 'pending' CHECK (decision IN ('approved', 'rejected', 'needs_info', 'pending')),
  decision_reason TEXT,
  verification_badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_verifications_case ON public.case_verifications(case_id);

-- ------------------------------------------------------------
-- 4. Direct Donations Table (Platform takes ₹0, tracks proof)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_name TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_ref TEXT,
  payment_method TEXT DEFAULT 'upi' CHECK (payment_method IN ('upi', 'bank_transfer')),
  notes TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_case ON public.donations(case_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);

-- ------------------------------------------------------------
-- 5. Notifications System Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_role TEXT CHECK (recipient_role IN ('donor', 'beneficiary', 'admin', 'all')),
  type TEXT NOT NULL CHECK (type IN ('case_submitted', 'case_approved', 'case_rejected', 'donation_received', 'verification_update', 'payout_proof', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(recipient_role);

-- ------------------------------------------------------------
-- 6. Audit Logs Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------
-- 7. Automated Notification Triggers
-- ------------------------------------------------------------

-- Trigger 1: When a new case is submitted -> Notify Admins
CREATE OR REPLACE FUNCTION public.notify_admin_on_case_submit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (recipient_role, type, title, message, link_url, metadata)
  VALUES (
    'admin',
    'case_submitted',
    'New Case Submitted: ' || NEW.patient_name,
    'Urgency: ' || NEW.urgency || '. Needs ₹' || NEW.amount_needed || ' for ' || NEW.title,
    '/admin',
    jsonb_build_object('case_id', NEW.id, 'category', NEW.category)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_case_submit ON public.cases;
CREATE TRIGGER trigger_on_case_submit
  AFTER INSERT ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_case_submit();

-- Trigger 2: When a case is Approved or Rejected -> Notify Patient
CREATE OR REPLACE FUNCTION public.notify_patient_on_case_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_id IS NOT NULL AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link_url, metadata)
      VALUES (
        NEW.patient_id,
        'case_approved',
        'Your Case Has Been Approved & Verified! 🎉',
        'Your fundraising appeal is now live on Apni Madad. Donors can send funds directly to your UPI/Bank.',
        '/cases/' || NEW.id,
        jsonb_build_object('case_id', NEW.id, 'status', NEW.status)
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link_url, metadata)
      VALUES (
        NEW.patient_id,
        'case_rejected',
        'Case Verification Update',
        COALESCE(NEW.admin_notes, 'Your case requires additional verification or documents. Please check details.'),
        '/dashboard',
        jsonb_build_object('case_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_case_update ON public.cases;
CREATE TRIGGER trigger_on_case_update
  AFTER UPDATE OF status ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.notify_patient_on_case_update();

-- Trigger 3: When a donation is recorded -> Notify Beneficiary & update amount
CREATE OR REPLACE FUNCTION public.handle_donation_recorded()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_id UUID;
  v_patient_name TEXT;
  v_case_title TEXT;
BEGIN
  -- Fetch patient info
  SELECT patient_id, patient_name, title INTO v_patient_id, v_patient_name, v_case_title
  FROM public.cases WHERE id = NEW.case_id;

  -- Update raised amount on case
  UPDATE public.cases
  SET amount_raised = amount_raised + NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.case_id;

  -- Notify beneficiary if linked
  IF v_patient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link_url, metadata)
    VALUES (
      v_patient_id,
      'donation_received',
      'New Direct Donation Received: ₹' || NEW.amount || ' 🙏',
      'A donor reported sending ₹' || NEW.amount || ' directly to your account. Ref: ' || COALESCE(NEW.payment_ref, 'UPI Transfer'),
      '/cases/' || NEW.case_id,
      jsonb_build_object('case_id', NEW.case_id, 'amount', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_donation_recorded ON public.donations;
CREATE TRIGGER trigger_on_donation_recorded
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.handle_donation_recorded();

-- ------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper check for admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles Policies
CREATE POLICY "Public read user profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cases Policies
CREATE POLICY "Public read verified or active cases"
  ON public.cases FOR SELECT USING (
    status IN ('approved', 'funded', 'closed') OR public.is_admin() OR auth.uid() = patient_id
  );

CREATE POLICY "Users can submit cases"
  ON public.cases FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR patient_id IS NULL
  );

CREATE POLICY "Patients can update own pending cases"
  ON public.cases FOR UPDATE USING (
    (auth.uid() = patient_id AND status = 'pending') OR public.is_admin()
  );

CREATE POLICY "Admins full management on cases"
  ON public.cases FOR ALL USING (public.is_admin());

-- Verifications Policies
CREATE POLICY "Admins manage verifications"
  ON public.case_verifications FOR ALL USING (public.is_admin());

CREATE POLICY "Patients view own case verifications"
  ON public.case_verifications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.patient_id = auth.uid()
    )
  );

-- Donations Policies
CREATE POLICY "Public can record donation confirmation"
  ON public.donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view donations"
  ON public.donations FOR SELECT USING (
    donor_id = auth.uid() OR public.is_admin() OR EXISTS (
      SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.patient_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT USING (
    user_id = auth.uid() OR (recipient_role = 'admin' AND public.is_admin()) OR recipient_role = 'all'
  );

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE USING (
    user_id = auth.uid() OR (recipient_role = 'admin' AND public.is_admin())
  );

CREATE POLICY "System insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

-- Audit Policies
CREATE POLICY "Admins full access audit logs"
  ON public.audit_logs FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- 9. Storage Buckets (Execute via Supabase Dashboard or API)
-- ------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('case-photos', 'case-photos', true),
--   ('case-videos', 'case-videos', true),
--   ('case-docs', 'case-docs', false),
--   ('receipts', 'receipts', false)
-- ON CONFLICT (id) DO NOTHING;
