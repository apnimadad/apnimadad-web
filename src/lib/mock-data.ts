export type CaseStatus = "pending" | "approved" | "funded" | "closed" | "rejected";
export type AgeGroup = "child" | "adult" | "elderly";
export type Category = "medical" | "education" | "accident" | "disability" | "family" | "women_help" | "satta_mukt" | "other";

export interface Case {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  patientName: string;
  age: number;
  ageGroup: AgeGroup;
  city: string;
  category: Category;
  amountNeeded: number;
  amountRaised: number;
  status: CaseStatus;
  verified: boolean;
  photoUrl: string;
  videoUrl?: string;
  documents: { name: string; type: string; url: string }[];
  upiId: string;
  bankAccount: string;
  ifsc: string;
  qrCodeUrl: string;
  createdAt: string;
  urgency: "high" | "medium" | "low";
}

export interface TopDonor {
  id: string;
  name: string;
  amount: number;
  photoUrl: string;
  caseTitle: string;
}

export const mockCases: Case[] = [
  {
    id: "case-001",
    title: "Urgent Heart Surgery for 8-year-old Aarav",
    titleHi: "8 वर्षीय आरव के लिए जरूरी हृदय शल्य चिकित्सा",
    description:
      "Aarav is an 8-year-old boy from Lucknow diagnosed with a congenital heart defect. Doctors have recommended immediate open-heart surgery. His father is a daily wage worker and cannot afford the ₹4,50,000 estimated cost.",
    descriptionHi:
      "आरव लखनऊ का 8 वर्षीय लड़का है जिसे जन्मजात हृदय दोष का निदान हुआ है। डॉक्टरों ने तुरंत ओपन-हार्ट सर्जरी की सलाह दी है। उसके पिता दिहाड़ी मजदूर हैं और ₹4,50,000 का अनुमानित खर्च वहन नहीं कर सकते।",
    patientName: "Aarav Sharma",
    age: 8,
    ageGroup: "child",
    city: "Lucknow",
    category: "medical",
    amountNeeded: 450000,
    amountRaised: 287500,
    status: "approved",
    verified: true,
    photoUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    documents: [
      { name: "Doctor Prescription", type: "pdf", url: "#" },
      { name: "Hospital Estimate", type: "pdf", url: "#" },
      { name: "Aadhaar Card", type: "pdf", url: "#" },
    ],
    upiId: "aarav.heart@upi",
    bankAccount: "XXXXXX4521",
    ifsc: "SBIN0001234",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=aarav.heart@upi&pn=Aarav%20Sharma&am=1000",
    createdAt: "2026-09-15",
    urgency: "high",
  },
  {
    id: "case-002",
    title: "Cancer Treatment for Meera Devi",
    titleHi: "मीरा देवी का कैंसर इलाज",
    description:
      "Meera Devi, 52, from Varanasi is undergoing chemotherapy for breast cancer. She needs continued treatment and medicines for the next 6 months. Family has already spent all savings.",
    descriptionHi:
      "वाराणसी की 52 वर्षीय मीरा देवी स्तन कैंसर के लिए कीमोथेरेपी करवा रही हैं। अगले 6 महीने के इलाज और दवाओं की जरूरत है। परिवार की सारी बचत खर्च हो चुकी है।",
    patientName: "Meera Devi",
    age: 52,
    ageGroup: "adult",
    city: "Varanasi",
    category: "medical",
    amountNeeded: 320000,
    amountRaised: 198000,
    status: "approved",
    verified: true,
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop",
    documents: [
      { name: "Pathology Report", type: "pdf", url: "#" },
      { name: "Treatment Plan", type: "pdf", url: "#" },
    ],
    upiId: "meera.devi@upi",
    bankAccount: "XXXXXX7890",
    ifsc: "HDFC0002345",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=meera.devi@upi&pn=Meera%20Devi",
    createdAt: "2026-09-20",
    urgency: "high",
  },
  {
    id: "case-003",
    title: "Education Support for Orphan Siblings",
    titleHi: "अनाथ भाई-बहनों की शिक्षा सहायता",
    description:
      "Three siblings aged 7, 10 and 13 lost both parents in an accident. They need school fees, books and uniforms for the current academic year.",
    descriptionHi:
      "7, 10 और 13 वर्ष के तीन भाई-बहनों ने दुर्घटना में दोनों माता-पिता को खो दिया। उन्हें वर्तमान शैक्षणिक वर्ष के लिए स्कूल फीस, किताबें और यूनिफॉर्म की जरूरत है।",
    patientName: "Rahul, Priya & Ankit",
    age: 10,
    ageGroup: "child",
    city: "Kanpur",
    category: "education",
    amountNeeded: 85000,
    amountRaised: 62000,
    status: "approved",
    verified: true,
    photoUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop",
    documents: [
      { name: "School Fee Receipt", type: "pdf", url: "#" },
      { name: "Death Certificates", type: "pdf", url: "#" },
    ],
    upiId: "orphan.support@upi",
    bankAccount: "XXXXXX1122",
    ifsc: "ICIC0003456",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=orphan.support@upi",
    createdAt: "2026-09-25",
    urgency: "medium",
  },
  {
    id: "case-004",
    title: "Wheelchair & Physiotherapy for Accident Victim",
    titleHi: "दुर्घटना पीड़ित के लिए व्हीलचेयर और फिजियोथेरेपी",
    description:
      "Ramesh Kumar lost both legs in a road accident. He needs a motorized wheelchair and ongoing physiotherapy to regain independence.",
    descriptionHi:
      "रमेश कुमार सड़क दुर्घटना में दोनों पैर खो बैठे। उन्हें मोटरयुक्त व्हीलचेयर और निरंतर फिजियोथेरेपी की जरूरत है ताकि वे स्वतंत्रता वापस पा सकें।",
    patientName: "Ramesh Kumar",
    age: 34,
    ageGroup: "adult",
    city: "Delhi",
    category: "accident",
    amountNeeded: 175000,
    amountRaised: 45000,
    status: "approved",
    verified: true,
    photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop",
    documents: [
      { name: "Accident Report", type: "pdf", url: "#" },
      { name: "Medical Certificate", type: "pdf", url: "#" },
    ],
    upiId: "ramesh.help@upi",
    bankAccount: "XXXXXX6677",
    ifsc: "PUNB0004567",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ramesh.help@upi",
    createdAt: "2026-09-28",
    urgency: "medium",
  },
  {
    id: "case-005",
    title: "Elderly Care for Widow Sushila",
    titleHi: "विधवा सुशीला के लिए बुजुर्ग देखभाल",
    description:
      "Sushila, 71, lives alone after her husband's death. She needs support for medicines, food and basic medical check-ups.",
    descriptionHi:
      "71 वर्षीय सुशीला अपने पति की मृत्यु के बाद अकेली रहती हैं। उन्हें दवाइयों, भोजन और बुनियादी मेडिकल चेक-अप के लिए सहायता चाहिए।",
    patientName: "Sushila Devi",
    age: 71,
    ageGroup: "elderly",
    city: "Jaipur",
    category: "family",
    amountNeeded: 60000,
    amountRaised: 60000,
    status: "funded",
    verified: true,
    photoUrl: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400&h=400&fit=crop",
    documents: [
      { name: "Aadhaar", type: "pdf", url: "#" },
      { name: "Medical Prescription", type: "pdf", url: "#" },
    ],
    upiId: "sushila.care@upi",
    bankAccount: "XXXXXX9988",
    ifsc: "BARB0005678",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=sushila.care@upi",
    createdAt: "2026-08-10",
    urgency: "low",
  },
];

export const topDonors: TopDonor[] = [
  { id: "d1", name: "Rajesh Gupta", amount: 50000, photoUrl: "https://i.pravatar.cc/100?img=11", caseTitle: "Aarav Heart Surgery" },
  { id: "d2", name: "Priya Sharma", amount: 25000, photoUrl: "https://i.pravatar.cc/100?img=5", caseTitle: "Meera Cancer Treatment" },
  { id: "d3", name: "Amit Verma", amount: 20000, photoUrl: "https://i.pravatar.cc/100?img=12", caseTitle: "Orphan Education" },
  { id: "d4", name: "Sunita Patel", amount: 15000, photoUrl: "https://i.pravatar.cc/100?img=9", caseTitle: "Aarav Heart Surgery" },
  { id: "d5", name: "Vikram Singh", amount: 10000, photoUrl: "https://i.pravatar.cc/100?img=15", caseTitle: "Ramesh Wheelchair" },
  { id: "d6", name: "Anjali Mehta", amount: 10000, photoUrl: "https://i.pravatar.cc/100?img=20", caseTitle: "Meera Cancer Treatment" },
  { id: "d7", name: "Mohammed Khan", amount: 8000, photoUrl: "https://i.pravatar.cc/100?img=33", caseTitle: "Orphan Education" },
  { id: "d8", name: "Neha Kapoor", amount: 7500, photoUrl: "https://i.pravatar.cc/100?img=25", caseTitle: "Aarav Heart Surgery" },
  { id: "d9", name: "Suresh Yadav", amount: 5000, photoUrl: "https://i.pravatar.cc/100?img=52", caseTitle: "Sushila Care" },
  { id: "d10", name: "Kavita Joshi", amount: 5000, photoUrl: "https://i.pravatar.cc/100?img=32", caseTitle: "Ramesh Wheelchair" },
];

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProgress(raised: number, needed: number): number {
  if (needed <= 0) return 0;
  return Math.min(100, Math.round((raised / needed) * 100));
}

export interface MockNotification {
  id: string;
  userId?: string | null;
  recipientRole?: "donor" | "beneficiary" | "admin" | "all";
  type: "case_submitted" | "case_approved" | "case_rejected" | "donation_received" | "verification_update" | "payout_proof" | "system";
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export const initialMockNotifications: MockNotification[] = [
  // Beneficiary / User Notifications
  {
    id: "notif-b1",
    recipientRole: "beneficiary",
    type: "donation_received",
    title: "Direct Donation Received: ₹5,000",
    message: "Donor Vikram Mehta transferred ₹5,000 directly to your registered UPI (aarav.heart@upi). Ref: UPI/6291038291.",
    linkUrl: "/cases/case-001",
    isRead: false,
    createdAt: "15 mins ago",
  },
  {
    id: "notif-b2",
    recipientRole: "beneficiary",
    type: "case_approved",
    title: "All 4 Verification Pillars Approved",
    message: "KGMU Hospital estimate, Aadhaar ID, and bank details have been verified by NGO doctors. Your appeal is live.",
    linkUrl: "/cases/case-001",
    isRead: false,
    createdAt: "1 hour ago",
  },
  {
    id: "notif-b3",
    recipientRole: "beneficiary",
    type: "verification_update",
    title: "Milestone: 64% of Medical Target Raised",
    message: "Your case has received ₹2,87,500 in direct patient donations. ₹1,62,500 remaining for surgery.",
    linkUrl: "/dashboard",
    isRead: true,
    createdAt: "5 hours ago",
  },
  {
    id: "notif-b4",
    recipientRole: "beneficiary",
    type: "system",
    title: "Welcome to Apni Madad: Case #case-001 Registered",
    message: "Zero commission platform active. Keep hospital receipts ready for post-surgery transparency updates.",
    linkUrl: "/dashboard",
    isRead: true,
    createdAt: "1 day ago",
  },

  // Donor Notifications
  {
    id: "notif-d1",
    recipientRole: "donor",
    type: "donation_received",
    title: "Direct Transfer Confirmed: ₹5,000 to Aarav Sharma",
    message: "Beneficiary confirmed receipt of ₹5,000 directly in their SBI account. 100% of your gift reached the child.",
    linkUrl: "/cases/case-001",
    isRead: false,
    createdAt: "10 mins ago",
  },
  {
    id: "notif-d2",
    recipientRole: "donor",
    type: "case_approved",
    title: "Patient Recovery Update: Aarav's Surgery Successful",
    message: "Dr. Shahnawaz confirmed open-heart surgery at KGMU was successful. Child is currently recovering in ICU.",
    linkUrl: "/cases/case-001",
    isRead: false,
    createdAt: "2 hours ago",
  },
  {
    id: "notif-d3",
    recipientRole: "donor",
    type: "verification_update",
    title: "80G Charity Acknowledgement Ready",
    message: "Your annual direct philanthropy confirmation record is ready for download in your dashboard.",
    linkUrl: "/dashboard",
    isRead: true,
    createdAt: "1 day ago",
  },
  {
    id: "notif-d4",
    recipientRole: "donor",
    type: "system",
    title: "New Critical Case in Lucknow: Sunil Paswan",
    message: "An emergency orthopedic implant case was just verified near you. Direct UPI is open for assistance.",
    linkUrl: "/cases/case-003",
    isRead: true,
    createdAt: "2 days ago",
  },

  // Admin Notifications
  {
    id: "notif-a1",
    recipientRole: "admin",
    type: "case_submitted",
    title: "Urgent Review Required: Sunil Paswan (Accident)",
    message: "Civil Hospital Lucknow estimate ₹1,80,000 and bone trauma x-rays submitted for 4-pillar verification.",
    linkUrl: "/admin",
    isRead: false,
    createdAt: "5 mins ago",
  },
  {
    id: "notif-a2",
    recipientRole: "admin",
    type: "verification_update",
    title: "Hospital Billing Desk Cross-Check Pending",
    message: "Orphan siblings school fee confirmation awaiting principal call for case #case-003.",
    linkUrl: "/admin",
    isRead: false,
    createdAt: "45 mins ago",
  },
  {
    id: "notif-a3",
    recipientRole: "admin",
    type: "system",
    title: "Bank Account Match Authenticated",
    message: "Penny-drop validation and passbook match confirmed for Aarav Sharma beneficiary bank account.",
    linkUrl: "/admin",
    isRead: true,
    createdAt: "3 hours ago",
  },
  {
    id: "notif-a4",
    recipientRole: "admin",
    type: "case_approved",
    title: "Daily NGO Audit: 5 Cases Live, ₹7,500 Transferred Today",
    message: "Platform running zero-commission direct routing with 100% donor-to-patient settlement.",
    linkUrl: "/admin",
    isRead: true,
    createdAt: "6 hours ago",
  },
];