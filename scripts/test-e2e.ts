import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        process.env[k] = v;
      }
    }
  }
}

import { createServiceClient } from "./src/lib/supabase/server.ts";
import { getPublicCases, getAllCasesAdmin, submitCase, getCaseById, recordDonation, submitConfidentialCase, getConfidentialCases } from "./src/lib/actions/cases.ts";
import { submitVerificationReview } from "./src/lib/actions/verification.ts";
import { getNotifications, createNotification, markNotificationAsRead } from "./src/lib/actions/notifications.ts";

async function runEndToEndTests() {
  console.log("=== STARTING FULL END-TO-END SYSTEM TEST ===");
  const results: { test: string; status: "PASS" | "FAIL"; details?: string }[] = [];

  const supabase = createServiceClient();
  if (!supabase) {
    console.error("FATAL: Supabase service client failed to initialize!");
    process.exit(1);
  }

  // TEST 1: Database Connection & Profiles Check
  try {
    const { data: profiles, error } = await supabase.from("profiles").select("*");
    if (error) throw error;
    console.log(`[PASS] DB Connection OK. Found ${profiles?.length || 0} profiles.`);
    results.push({ test: "DB Connectivity & Profiles", status: "PASS", details: `${profiles.length} profiles` });
  } catch (err: any) {
    results.push({ test: "DB Connectivity & Profiles", status: "FAIL", details: err.message });
  }

  // TEST 2: Public Cases Fetching
  try {
    const publicCases = await getPublicCases();
    console.log(`[PASS] getPublicCases OK. Found ${publicCases.length} public cases.`);
    results.push({ test: "Public Cases Feed", status: "PASS", details: `${publicCases.length} cases returned` });
  } catch (err: any) {
    results.push({ test: "Public Cases Feed", status: "FAIL", details: err.message });
  }

  // TEST 3: Admin Cases Fetching
  try {
    const adminCases = await getAllCasesAdmin();
    console.log(`[PASS] getAllCasesAdmin OK. Found ${adminCases.length} cases in admin repository.`);
    results.push({ test: "Admin Cases Feed", status: "PASS", details: `${adminCases.length} cases total` });
  } catch (err: any) {
    results.push({ test: "Admin Cases Feed", status: "FAIL", details: err.message });
  }

  // TEST 4: Beneficiary Appeal Submission
  let testCaseId: string | null = null;
  try {
    const testCasePayload = {
      title: "Test Emergency Relief Appeal - Automated QA",
      title_hi: "परीक्षण आपातकालीन राहत अपील",
      description: "Automated end-to-end verification case created by QA test runner.",
      patient_name: "Ramesh Kumar (QA Test)",
      age: 42,
      age_group: "adult" as const,
      city: "Bhopal",
      category: "medical" as const,
      amount_needed: 75000,
      hospital_name: "Bhopal Memorial Hospital",
      doctor_name: "Dr. A. Verma",
      hospital_contact: "0755-1234567",
      upi_id: "ramesh@upi",
      bank_account: "123456789012",
      ifsc: "SBIN0001234",
      photo_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=400&fit=crop",
      urgency: "high" as const,
    };

    const submitRes = await submitCase(testCasePayload);
    const caseId = submitRes.id || (submitRes as any).caseId;
    if (!submitRes.success || !caseId) {
      throw new Error("Case submission returned failure: " + JSON.stringify(submitRes));
    }
    testCaseId = caseId;
    console.log(`[PASS] Beneficiary Case Submitted successfully with ID: ${testCaseId}`);
    results.push({ test: "Beneficiary Submit Appeal", status: "PASS", details: `Case ID: ${testCaseId}` });
  } catch (err: any) {
    results.push({ test: "Beneficiary Submit Appeal", status: "FAIL", details: err.message });
  }

  // TEST 5: 4-Pillar Verification Checklist by Admin
  if (testCaseId) {
    try {
      const reviewRes = await submitVerificationReview({
        caseId: testCaseId,
        reviewerId: "96ce609f-b6a7-43dd-b834-98ce54712180", // Admin user ID
        reviewerName: "Apni Madad Admin",
        verificationStage: "verified",
        notes: "Automated QA Verification: All 4 pillars verified.",
        checklist: {
          medicalDocsVerified: true,
          identityVerified: true,
          hospitalConfirmed: true,
          financialNeedVerified: true,
          fieldVisitCompleted: true,
        },
      });

      if (!reviewRes.success) throw new Error("Verification review failed: " + reviewRes.error);
      console.log("[PASS] 4-Pillar Admin Verification Review updated successfully.");
      results.push({ test: "4-Pillar Verification Review", status: "PASS" });
    } catch (err: any) {
      results.push({ test: "4-Pillar Verification Review", status: "FAIL", details: err.message });
    }
  }

  // TEST 6: Donor Direct Donation Recording & Receipt
  if (testCaseId) {
    try {
      const donationRes = await recordDonation({
        caseId: testCaseId,
        amount: 2500,
        donorName: "Generous Test Supporter",
        paymentRef: "UTR-TEST-" + Date.now(),
        notes: "Direct UPI payment test",
      });

      if (!donationRes.success) throw new Error("Donation recording failed: " + donationRes.error);
      console.log(`[PASS] Donor direct donation recorded. New raised amount: ₹${donationRes.amountRaised}`);
      results.push({ test: "Donor Direct Donation & Receipt", status: "PASS", details: `Raised: ₹${donationRes.amountRaised}` });
    } catch (err: any) {
      results.push({ test: "Donor Direct Donation & Receipt", status: "FAIL", details: err.message });
    }
  }

  // TEST 7: Confidential Case Submission (Women Help / Satta-Mukt)
  let confidentialId: string | null = null;
  try {
    const confRes = await submitConfidentialCase({
      category: "women_help",
      aliasName: "Confidential Sister (QA)",
      realName: "Private Beneficiary Name",
      phone: "+91 99999 88888",
      safeContactTime: "10:00 AM - 12:00 PM",
      city: "Indore",
      supportType: "Legal and emergency counseling",
      details: "Private testing of confidential intake protocol",
    });

    if (!confRes.success || !confRes.caseId) {
      throw new Error("Confidential submission failed: " + JSON.stringify(confRes));
    }
    confidentialId = confRes.caseId;
    console.log(`[PASS] Confidential Case submitted successfully with ID: ${confidentialId}`);

    // Verify it is NOT exposed to public
    const publicList = await getPublicCases();
    const leaked = publicList.find((c) => c.id === confidentialId);
    if (leaked) {
      throw new Error("SECURITY FAILURE: Confidential case leaked into public cases feed!");
    }
    console.log("[PASS] Confidentiality check confirmed: Case is NOT exposed to public.");

    // Verify admin CAN access it
    const adminConfList = await getConfidentialCases();
    const foundByAdmin = adminConfList.find((c) => c.id === confidentialId);
    if (!foundByAdmin) {
      throw new Error("Admin failed to retrieve confidential case from secure inbox!");
    }
    console.log("[PASS] Admin secure confidential retrieval confirmed.");
    results.push({ test: "Confidential Case Isolation & Security", status: "PASS" });
  } catch (err: any) {
    results.push({ test: "Confidential Case Isolation & Security", status: "FAIL", details: err.message });
  }

  // TEST 8: In-App Notifications
  try {
    const notifRes = await createNotification({
      recipientRole: "admin",
      type: "case_submitted",
      title: "QA Test Notification",
      message: "End-to-end verification notification test",
    });

    if (!notifRes.success || !notifRes.id) throw new Error("Notification creation failed");
    console.log(`[PASS] Notification created with ID: ${notifRes.id}`);

    const notifs = await getNotifications({ role: "admin" });
    const found = notifs.find((n) => n.id === notifRes.id);
    if (!found) throw new Error("Notification not found in query results");

    await markNotificationAsRead(notifRes.id);
    console.log("[PASS] Notification marked as read successfully.");
    results.push({ test: "Notification System", status: "PASS" });
  } catch (err: any) {
    results.push({ test: "Notification System", status: "FAIL", details: err.message });
  }

  // TEST 9: Storage Buckets Upload Testing (Photos, Docs, Videos)
  for (const bucket of ["case-photos", "case-docs", "case-videos"]) {
    try {
      const testContent = Buffer.from(`Apni Madad Storage Upload Test - ${bucket} - ${Date.now()}`);
      const testPath = `qa-test/${Date.now()}-${bucket}.txt`;

      const { data, error } = await supabase.storage.from(bucket).upload(testPath, testContent, {
        contentType: "text/plain",
        upsert: true,
      });

      if (error) throw error;
      console.log(`[PASS] Storage Bucket "${bucket}" upload verified at path: ${data.path}`);

      // Clean up test file
      await supabase.storage.from(bucket).remove([testPath]);
      results.push({ test: `Storage Bucket: ${bucket}`, status: "PASS" });
    } catch (err: any) {
      results.push({ test: `Storage Bucket: ${bucket}`, status: "FAIL", details: err.message });
    }
  }

  // CLEANUP: Remove test case and test confidential case so DB remains pristine
  if (testCaseId) {
    await supabase.from("cases").delete().eq("id", testCaseId);
    console.log(`[CLEANUP] Removed test case ${testCaseId}`);
  }
  if (confidentialId) {
    await supabase.from("cases").delete().eq("id", confidentialId);
    console.log(`[CLEANUP] Removed confidential test case ${confidentialId}`);
  }

  console.log("\n=== TEST SUMMARY ===");
  console.table(results);
  const allPassed = results.every((r) => r.status === "PASS");
  console.log(`\nOVERALL STATUS: ${allPassed ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
}

runEndToEndTests().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
