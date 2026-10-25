"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Award,
  Heart,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  ArrowRight,
  FileCheck2
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useSiteSettings } from "@/components/SiteSettingsContext";

export default function JoinPage() {
  const { lang } = useLanguage();
  const { settings } = useSiteSettings();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [profession, setProfession] = useState("");
  const [contributionArea, setContributionArea] = useState<string[]>([]);
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const contributionOptionsHi = [
    "जमीनी सत्यापन एवं मरीज से मुलाकात (Ground Case Verification)",
    "आपातकालीन रक्तदान एवं चिकित्सा सहायता (Blood Donation & Medical Relief)",
    "सोशल मीडिया एवं डिजिटल जागरूकता (Social Media & Outreach)",
    "कानूनी / चिकित्सीय / पेशेवर मार्गदर्शन (Legal / Medical / Counseling)",
    "मासिक आर्थिक समर्थक / दानदाता सदस्य (Monthly Patron / Contributor)",
    "स्थानीय राहत सामग्री वितरण (Local Relief Distribution)"
  ];

  const contributionOptionsEn = [
    "Ground Case Verification & Hospital Visits",
    "Emergency Blood Donation & Medical Relief",
    "Social Media & Digital Awareness Outreach",
    "Legal / Medical / Professional Counseling",
    "Monthly Financial Patron / Contributor",
    "Local Relief & Ration Distribution"
  ];

  const contributionOptions = lang === "hi" ? contributionOptionsHi : contributionOptionsEn;

  const toggleContribution = (opt: string) => {
    if (contributionArea.includes(opt)) {
      setContributionArea(contributionArea.filter((item) => item !== opt));
    } else {
      setContributionArea([...contributionArea, opt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया अपना पूरा नाम दर्ज करें।"
          : "Please enter your full name."
      );
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया 10 अंकों का वैध मोबाइल / WhatsApp नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile / WhatsApp number."
      );
      return;
    }

    if (!city.trim() || !stateName.trim()) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया अपना शहर और राज्य दर्ज करें।"
          : "Please enter your city and state."
      );
      return;
    }

    if (contributionArea.length === 0) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया कम से कम एक योगदान क्षेत्र चुनें।"
          : "Please select at least one area of contribution."
      );
      return;
    }

    setSubmitting(true);

    try {
      // Generate clean unique membership reference ID
      const generatedId = `AMF-MBR-${Math.floor(100000 + Math.random() * 900000)}`;
      setAppId(generatedId);

      // Save to local storage for local persistence
      const savedMembers = JSON.parse(localStorage.getItem("apni_madad_members") || "[]");
      savedMembers.push({
        id: generatedId,
        fullName,
        phone: cleanPhone,
        email,
        city,
        stateName,
        profession,
        contributionArea,
        motivation,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("apni_madad_members", JSON.stringify(savedMembers));

      setSubmitted(true);
    } catch {
      setErrorMsg(
        lang === "hi"
          ? "आवेदन सबमिट करने में कोई त्रुटि हुई। कृपया पुनः प्रयास करें।"
          : "An error occurred while submitting your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappNumber = (settings?.whatsappHelpline || "919376998999").replace(/\D/g, "");

  const getWhatsAppMessageUrl = () => {
    const text = lang === "hi"
      ? `नमस्ते अपनी मदद फाउंडेशन! मैंने NGO सदस्यता के लिए आवेदन किया है:\n\n*आवेदन आईडी:* ${appId}\n*नाम:* ${fullName}\n*फोन:* ${phone}\n*शहर/राज्य:* ${city}, ${stateName}\n*पेशा:* ${profession || "N/A"}\n*योगदान क्षेत्र:* ${contributionArea.join(", ")}\n*संदेश:* ${motivation || "राष्ट्र सेवा"}\n\nकृपया मेरी सदस्यता सत्यापित करें। धन्यवाद!`
      : `Hello Apni Madad Foundation! I have submitted my membership application:\n\n*Application ID:* ${appId}\n*Name:* ${fullName}\n*Phone:* ${phone}\n*City/State:* ${city}, ${stateName}\n*Profession:* ${profession || "N/A"}\n*Contribution Area:* ${contributionArea.join(", ")}\n*Message:* ${motivation || "Public Service"}\n\nPlease verify my membership. Thank you!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-bold border border-emerald-400/30">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === "hi"
                ? "राष्ट्र निर्माण एवं निस्वार्थ मानव सेवा"
                : "Nation Building & Selfless Human Relief"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {lang === "hi" ? (
              <>
                अपनी मदद NGO के <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">सम्मानित सदस्य</span> बनें
              </>
            ) : (
              <>
                Become a Respected Member of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-300">Apni Madad NGO</span>
              </>
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {lang === "hi"
              ? "शून्य कमीशन, 100% प्रत्यक्ष सहायता और पारदर्शी सेवा मिशन से जुड़ें। अपने शहर में जरूरतमंदों की आवाज बनें और सीधे जरूरतमंदों तक राहत पहुंचाएं।"
              : "Join India's radical zero-commission humanitarian movement. Empower verified patients, fight fraud, and ensure 100% of help reaches real families directly."}
          </p>

          {/* Quick Stat Pill */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              NGO Reg: IV-190300183
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <Users className="w-4 h-4 text-blue-400" />
              1,200+ Active Members & Volunteers
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <Award className="w-4 h-4 text-amber-400" />
              Official Volunteer Certificate
            </span>
          </div>
        </div>
      </section>

      {/* 4 Pillars of NGO Membership */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/90 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-sm mb-1">
              {lang === "hi" ? "आधिकारिक प्रमाण पत्र" : "Official Certificate"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === "hi"
                ? "NGO के सत्यापित सदस्य व स्वयंसेवक के रूप में आधिकारिक सदस्यता आईडी व प्रमाण पत्र।"
                : "Official volunteer certificate and digital member ID issued by the registered trust."}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/90 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-sm mb-1">
              {lang === "hi" ? "ग्राउंड वेरिफिकेशन अधिकार" : "Ground Verification"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === "hi"
                ? "अपने स्थानीय क्षेत्र में आपातकालीन केस का प्रत्यक्ष निरीक्षण कर मदद की अनुशंसा करने का अधिकार।"
                : "Direct power to verify hospital cases on the ground and recommend transparent aid."}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/90 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-3">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-sm mb-1">
              {lang === "hi" ? "100% शून्य कमीशन" : "Zero Commission"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === "hi"
                ? "कोई बिचौलिया या कट नहीं। दान सीधे जरूरतमंद मरीज या अस्पताल के खाते में सुरक्षित पहुंचता है।"
                : "Complete financial transparency where every single rupee goes straight to the patient."}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/90 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-sm mb-1">
              {lang === "hi" ? "राष्ट्रीय सेवा नेटवर्क" : "National Network"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === "hi"
                ? "देश भर के डॉक्टरों, वकीलों, समाजसेवियों और युवाओं के मजबूत संगठित परिवार का हिस्सा बनें।"
                : "Connect with doctors, lawyers, students, and humanitarians across India."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content: Form or Submitted Success */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
        {submitted ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {lang === "hi"
                  ? "बधाई हो! सदस्यता आवेदन प्राप्त हुआ"
                  : "Congratulations! Application Received"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                {lang === "hi"
                  ? "अपनी मदद फाउंडेशन के महान सेवा मिशन से जुड़ने के लिए आपका धन्यवाद। आपकी सदस्यता संदर्भ संख्या है:"
                  : "Thank you for stepping up to serve humanity. Your official application reference is:"}
              </p>
              <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl font-mono text-base sm:text-lg font-black text-blue-800 border border-slate-200 shadow-2xs">
                {appId}
              </div>
            </div>

            {/* Direct WhatsApp Forward Button */}
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {lang === "hi"
                    ? "त्वरित सत्यापन हेतु WhatsApp पर सूचना भेजें"
                    : "Send details directly to Admin on WhatsApp for Quick Verification"}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {lang === "hi"
                  ? "अपनी सदस्यता कार्ड और प्रमाण पत्र तुरंत सक्रिय करने के लिए नीचे दिए गए बटन पर क्लिक करके अपने आवेदन का विवरण हमारे आधिकारिक WhatsApp पर भेजें।"
                  : "To get your membership card and volunteer onboarding verified faster, click below to message our central coordinator on WhatsApp."}
              </p>
              <a
                href={getWhatsAppMessageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>
                  {lang === "hi"
                    ? "WhatsApp पर विवरण भेजें (1-टैप)"
                    : "Send Application on Official WhatsApp"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/cases"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                {lang === "hi" ? "सत्यापित केस देखें" : "Browse Verified Cases"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFullName("");
                  setPhone("");
                  setEmail("");
                  setCity("");
                  setStateName("");
                  setProfession("");
                  setMotivation("");
                  setContributionArea([]);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
              >
                {lang === "hi" ? "नया आवेदन करें" : "Submit Another Application"}
              </button>
            </div>
          </div>
        ) : (
          /* Application Form Card */
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200/80 mb-2">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{lang === "hi" ? "निःशुल्क सदस्यता आवेदन" : "Free Volunteer Membership Form"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lang === "hi" ? "सदस्यता पंजीकरण फॉर्म" : "Membership Registration Form"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "hi"
                  ? "कृपया अपना सही विवरण भरें ताकि हमारी टीम आपसे संपर्क करके सदस्यता कार्ड व आईडी जारी कर सके।"
                  : "Please provide your verified details. Our coordinator will contact you to issue your membership credential."}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === "hi" ? "पूरा नाम *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "hi" ? "उदा. राहुल शर्मा" : "e.g. Rahul Sharma"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === "hi" ? "मोबाइल / WhatsApp नंबर *" : "Mobile / WhatsApp Number *"}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9376998999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email & Profession */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === "hi" ? "ईमेल पता (वैकल्पिक)" : "Email Address (Optional)"}
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === "hi" ? "व्यवसाय / पेशा" : "Profession / Occupation"}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === "hi" ? "उदा. डॉक्टर / छात्र / व्यापारी / नौकरीपेशा" : "e.g. Doctor / Student / Business / Teacher"}
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === "hi" ? "शहर / जिला *" : "City / District *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "hi" ? "उदा. जयपुर / लखनऊ / दिल्ली" : "e.g. Jaipur / Lucknow / Delhi"}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {lang === "hi" ? "राज्य *" : "State *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "hi" ? "उदा. राजस्थान / उत्तर प्रदेश / बिहार" : "e.g. Rajasthan / UP / Bihar"}
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Contribution Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {lang === "hi"
                    ? "आप किस प्रकार योगदान देना चाहते हैं? (एक या अधिक चुनें) *"
                    : "How would you like to contribute? (Select all that apply) *"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {contributionOptions.map((opt) => {
                    const isSelected = contributionArea.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleContribution(opt)}
                        className={`p-3 rounded-xl text-xs font-semibold text-left border flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-600 text-blue-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {lang === "hi"
                    ? "आप अपनी मदद फाउंडेशन से क्यों जुड़ना चाहते हैं? (वैकल्पिक)"
                    : "Why do you want to join Apni Madad Foundation? (Optional)"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    lang === "hi"
                      ? "अपने विचार या पूर्व सामाजिक अनुभव के बारे में बताएं..."
                      : "Share your thoughts or any prior volunteer experience..."
                  }
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 hover:from-blue-800 hover:to-emerald-800 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition active:scale-98 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  <span>
                    {submitting
                      ? (lang === "hi" ? "आवेदन जमा किया जा रहा है..." : "Submitting Application...")
                      : (lang === "hi" ? "सदस्यता हेतु आवेदन जमा करें" : "Submit Membership Application")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  {lang === "hi"
                    ? "सदस्यता पूर्णतः निःशुल्क है। आपकी जानकारी संस्था के आंतरिक रिकॉर्ड में सुरक्षित रहेगी।"
                    : "Membership is 100% free and voluntary. Your details are safe with the registered trust."}
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Direct Helpline Strip */}
        <div className="mt-8 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-amber-300">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{lang === "hi" ? "सीधा संपर्क व मार्गदर्शन" : "Direct Helpline"}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              {lang === "hi"
                ? "क्या सदस्यता के संबंध में कोई प्रश्न है?"
                : "Have any questions about NGO membership?"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              {lang === "hi"
                ? "हमारी केंद्रीय टीम से सीधे WhatsApp पर बात करके तुरंत समाधान प्राप्त करें।"
                : "Chat directly with our central team on WhatsApp to get instant clarity."}
            </p>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("नमस्ते अपनी मदद फाउंडेशन! मुझे NGO सदस्यता के बारे में जानकारी चाहिए।")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>{lang === "hi" ? "WhatsApp पर पूछें" : "Ask on WhatsApp"}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
