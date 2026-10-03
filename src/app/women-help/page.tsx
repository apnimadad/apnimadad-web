"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Clock,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Heart,
  LogOut,
  MapPin,
  Globe,
} from "lucide-react";
import { submitConfidentialCase } from "@/lib/actions/cases";
import { useLanguage } from "@/components/LanguageContext";

export default function WomenHelpPage() {
  const { lang, setLang } = useLanguage();

  const [aliasName, setAliasName] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [safeContactTime, setSafeContactTime] = useState(
    lang === "hi"
      ? "सुबह 10:00 से दोपहर 12:00 (जब ससुराल/घर पर कोई न हो)"
      : "Morning 10:00 AM to 12:00 PM (Strict privacy window)"
  );
  const [customSafeTime, setCustomSafeTime] = useState("");
  const [city, setCity] = useState("");
  const [supportType, setSupportType] = useState(
    lang === "hi" ? "घरेलू प्रताड़ना व सुरक्षा" : "Domestic Abuse & Safety"
  );
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeTimeOptionsHi = [
    "सुबह 10:00 से दोपहर 12:00 (जब ससुराल/घर पर कोई न हो)",
    "दोपहर 2:00 से शाम 4:00 (शांत व सुरक्षित समय)",
    "शाम 6:00 से रात 8:00 (फुर्सत के समय)",
    "केवल WhatsApp संदेश (कृपया सीधे फोन कॉल न करें)",
    "अन्य सुरक्षित समय (कस्टम चुनें)",
  ];

  const safeTimeOptionsEn = [
    "Morning 10:00 AM to 12:00 PM (Strict privacy window)",
    "Afternoon 2:00 PM to 4:00 PM (Quiet & safe time)",
    "Evening 6:00 PM to 8:00 PM (Leisure hours)",
    "Only WhatsApp Message (Do not place direct phone calls)",
    "Other Safe Time (Custom Specified)",
  ];

  const safeTimeOptions = lang === "hi" ? safeTimeOptionsHi : safeTimeOptionsEn;

  const handleQuickExit = () => {
    // Immediately redirect to Google for emergency personal privacy
    window.location.replace("https://www.google.com");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!aliasName.trim()) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया अपना प्रदर्शित नाम (Alias Name) दर्ज करें।"
          : "Please enter your display/alias name."
      );
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया संपर्क के लिए सही 10-अंकों का मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile number for contact."
      );
      return;
    }

    if (!details.trim()) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया अपनी समस्या या सहायता की जरूरत का संक्षिप्त विवरण लिखें।"
          : "Please write a brief description of your situation or support requirement."
      );
      return;
    }

    const finalSafeTime =
      safeContactTime.includes("कस्टम") || safeContactTime.includes("Custom")
        ? customSafeTime.trim() || (lang === "hi" ? "कस्टम सुरक्षित समय" : "User specified custom safe time")
        : safeContactTime;

    setSubmitting(true);
    try {
      const res = await submitConfidentialCase({
        category: "women_help",
        aliasName: aliasName.trim(),
        realName: realName.trim() || undefined,
        phone: cleanPhone,
        safeContactTime: finalSafeTime,
        city: city.trim() || (lang === "hi" ? "भारत" : "India"),
        supportType,
        details: details.trim(),
        urgency: "high",
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(
          res.error ||
            (lang === "hi"
              ? "अनुरोध भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।"
              : "Failed to send request. Please try again.")
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === "hi"
          ? "अनपेक्षित त्रुटि हुई।"
          : "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-slate-50 to-white pb-24">
      {/* Quick Emergency Exit Bar */}
      <div className="bg-rose-900 text-rose-100 py-2.5 px-4 text-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              {lang === "hi"
                ? "यदि आप सुरक्षित महसूस न करें तो तुरंत बाहर निकलने के लिए Quick Exit दबाएं:"
                : "If you feel unsafe or need to close this page immediately, tap Quick Exit:"}
            </span>
          </div>
          <button
            onClick={handleQuickExit}
            className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-xs transition shrink-0 cursor-pointer"
            title={lang === "hi" ? "तुरंत सुरक्षित Google पेज पर जाएं" : "Immediately exit to safe Google homepage"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quick Exit</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header Breadcrumb & Status & Language Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-100/80 border border-rose-300 text-rose-900 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-rose-700" />
            <span>
              {lang === "hi"
                ? "100% गोपनीय व सुरक्षित सहायता मंच (Safe & Secure)"
                : "100% Confidential & Secure Women Support (Safe & Private)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="inline-flex items-center bg-white p-1 rounded-xl border border-rose-200 shadow-2xs text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-rose-500 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                  lang === "en"
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                  lang === "hi"
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिंदी
              </button>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              {lang === "hi" ? "होम पेज पर वापस जाएं" : "Back to Home"}
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-200/80 shadow-md mb-8">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-widest">
              {lang === "hi"
                ? "अपनी मदद फाउंडेशन · महिला सुरक्षा व परामर्श पहल"
                : "Apni Madad Foundation · Women Support Initiative"}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-2 mb-4 leading-tight">
              {lang === "hi" ? "महिला सहायता" : "Women Support Desk"}{" "}
              <span className="text-rose-600">
                {lang === "hi" ? "(पहचान पूरी तरह गोपनीय)" : "(100% Confidential Identity)"}
              </span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {lang === "hi"
                ? "अपनी मदद फाउंडेशन हर उस बहन और बेटी के साथ मजबूती से खड़ा है जो किसी भी तरह की घरेलू, कानूनी, आर्थिक या मानसिक परेशानी से जूझ रही हैं। आपकी सुरक्षा और सम्मान हमारी सर्वोच्च प्राथमिकता है।"
                : "Apni Madad Foundation stands firmly with every woman and girl facing domestic, legal, financial, or emotional distress. Your privacy, safety, and dignity are our highest priorities."}
            </p>
          </div>

          {/* 3 Privacy Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  {lang === "hi" ? "गोपनीयता (100% Confidential)" : "100% Privacy Protection"}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {lang === "hi"
                    ? "मदद मांगने वाली बहन का नाम, फोन और पता सार्वजनिक वेबसाइट पर कभी नहीं दिखेगा।"
                    : "The applicant's name, phone, and location are never published or visible to the public."}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  {lang === "hi" ? "सुरक्षित समय पर कॉल" : "Strict Safe Call Window"}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {lang === "hi"
                    ? "NGO की टीम सिर्फ आपके द्वारा चुने गए सुरक्षित समय पर ही कॉल या मैसेज करेगी।"
                    : "Our team contacts you only during the specific timeframe selected by you when you are safe."}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  {lang === "hi" ? "महिला काउंसलर सहायता" : "Female Counselor Guidance"}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {lang === "hi"
                    ? "कानूनी मदद, भरण-पोषण सलाह, और मनोबल बढ़ाने के लिए महिला प्रतिनिधि द्वारा मार्गदर्शन।"
                    : "Empathetic guidance by trained female counselors for legal rights, maintenance, and support."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-lg text-center space-y-5 animate-modal">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-black text-slate-900">
                {lang === "hi"
                  ? "आपका अनुरोध सुरक्षित प्राप्त हुआ 🙏"
                  : "Your Request Received Safely 🙏"}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {lang === "hi" ? (
                  <>
                    प्रिय <strong className="text-slate-900">{aliasName}</strong>, आपकी जानकारी
                    पूरी तरह एन्क्रिप्टेड है। हमारी महिला काउंसलर टीम आपके द्वारा चुने गए सुरक्षित समय
                    (<strong>{safeContactTime}</strong>) पर संपर्क करेगी।
                  </>
                ) : (
                  <>
                    Dear <strong className="text-slate-900">{aliasName}</strong>, your information
                    is securely encrypted. Our female counselor team will contact you strictly during your
                    safe window (<strong>{safeContactTime}</strong>).
                  </>
                )}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-xs text-slate-500">
              {lang === "hi"
                ? "यह केस वेबसाइट या किसी भी बाहरी व्यक्ति को कभी नहीं दिखेगा। यह केवल ट्रस्ट के अधिकृत काउंसलर्स द्वारा संभाला जा रहा है।"
                : "This request will never be visible on public pages or to external visitors. It is strictly handled by authorized NGO counselors."}
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                {lang === "hi" ? "नया अनुरोध भरें" : "Submit Another Request"}
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                {lang === "hi" ? "मुख्य पृष्ठ पर जाएं" : "Go to Homepage"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md">
            <div className="mb-8 pb-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                <span>
                  {lang === "hi"
                    ? "गोपनीय सहायता फॉर्म भरें"
                    : "Fill Confidential Support Request"}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {lang === "hi"
                  ? "अपनी पहचान छिपाने के लिए आप कोई भी काल्पनिक नाम (Alias) चुन सकती हैं।"
                  : "You can choose any alias/display name to protect your identity."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trust Factor 1: Alias Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi"
                      ? "प्रदर्शित नाम (Alias/Display Name)"
                      : "Display / Alias Name"}{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {lang === "hi"
                      ? "कोई भी काल्पनिक नाम (जैसे: बहन X, स्वाति) चुनें, ताकि असली नाम किसी को न दिखे।"
                      : "Choose a private pseudonym (e.g. Sister X, Priya) so your real name stays secret."}
                  </p>
                  <input
                    type="text"
                    required
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder={
                      lang === "hi" ? "उदा. बहन X, स्वाति, सीमा" : "e.g. Sister X, Priya, Seema"
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-semibold text-slate-900 transition bg-rose-50/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {lang === "hi"
                      ? "असली नाम (वैकल्पिक / Optional)"
                      : "Real Name (Optional)"}
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {lang === "hi"
                      ? "केवल NGO के आंतरिक रिकॉर्ड के लिए, किसी के साथ साझा नहीं किया जाएगा।"
                      : "Strictly for NGO internal record; never shared with anyone."}
                  </p>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder={
                      lang === "hi" ? "यदि साझा करना चाहें तो लिखें" : "Write here if you wish to share"
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Trust Factor 2: Safe Contact Time & Safe Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi"
                      ? "संपर्क का सुरक्षित समय (Safe Contact Time)"
                      : "Strict Safe Call Window"}{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {lang === "hi"
                      ? "वह समय चुनें जब परिवार में कोई आपके आसपास न हो।"
                      : "Choose the timeframe when you have complete privacy from family members."}
                  </p>
                  <select
                    value={safeContactTime}
                    onChange={(e) => setSafeContactTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-xs sm:text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    {safeTimeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {(safeContactTime.includes("कस्टम") || safeContactTime.includes("Custom")) && (
                    <input
                      type="text"
                      placeholder={
                        lang === "hi"
                          ? "उदा. केवल रात 9:30 के बाद, या दोपहर 1:15 से 2:00"
                          : "e.g. Only after 9:30 PM, or between 1:15 PM and 2:00 PM"
                      }
                      value={customSafeTime}
                      onChange={(e) => setCustomSafeTime(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl border border-rose-300 focus:border-rose-500 text-xs font-medium text-slate-900"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi"
                      ? "सुरक्षित मोबाइल नंबर / WhatsApp नंबर"
                      : "Safe Phone / WhatsApp Number"}{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {lang === "hi"
                      ? "वह नंबर जिस पर सिर्फ आप ही संदेश या कॉल देख सकें।"
                      : "A private number where only you can view incoming calls or messages."}
                  </p>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={
                        lang === "hi"
                          ? "10-अंकों का सुरक्षित मोबाइल नंबर"
                          : "10-digit private mobile number"
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-semibold text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* City and Support Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi" ? "सहायता का मुख्य प्रकार" : "Primary Assistance Category"}
                  </label>
                  <select
                    value={supportType}
                    onChange={(e) => setSupportType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    <option value={lang === "hi" ? "घरेलू प्रताड़ना व सुरक्षा" : "Domestic Abuse & Safety"}>
                      {lang === "hi"
                        ? "घरेलू प्रताड़ना व सुरक्षा (Domestic Abuse)"
                        : "Domestic Abuse & Physical Safety"}
                    </option>
                    <option value={lang === "hi" ? "कानूनी सहायता व भरण-पोषण" : "Legal Aid & Maintenance"}>
                      {lang === "hi"
                        ? "कानूनी सहायता व भरण-पोषण (Legal Aid)"
                        : "Legal Guidance & Spousal Maintenance"}
                    </option>
                    <option value={lang === "hi" ? "बच्चों की शिक्षा व सुरक्षा" : "Child Protection & Education"}>
                      {lang === "hi"
                        ? "बच्चों की सुरक्षा व शिक्षा सहायता"
                        : "Child Protection & Schooling Support"}
                    </option>
                    <option value={lang === "hi" ? "चिकित्सा व आपातकालीन मदद" : "Medical & Emergency Care"}>
                      {lang === "hi"
                        ? "चिकित्सा व आपातकालीन दवाएं"
                        : "Emergency Medical & Healthcare Aid"}
                    </option>
                    <option value={lang === "hi" ? "आर्थिक स्वावलंबन व रोजगार" : "Livelihood & Self-Reliance"}>
                      {lang === "hi"
                        ? "आर्थिक स्वावलंबन व सिलाई/काम"
                        : "Livelihood & Economic Self-Reliance"}
                    </option>
                    <option value={lang === "hi" ? "अन्य गोपनीय परामर्श" : "Other Confidential Guidance"}>
                      {lang === "hi"
                        ? "अन्य व्यक्तिगत गोपनीय परामर्श"
                        : "Other Personal Confidential Guidance"}
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi" ? "शहर / जिला (City / District)" : "City / District"}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={
                        lang === "hi"
                          ? "उदा. लखनऊ, दिल्ली, कानपुर, भोपाल"
                          : "e.g. Lucknow, Delhi, Kanpur, Bhopal"
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Situation Details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  {lang === "hi"
                    ? "अपनी स्थिति या जरूरत का विवरण साझा करें"
                    : "Describe your situation or assistance required"}{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    lang === "hi"
                      ? "कृपया सुरक्षित रूप से बताएं कि आपको किस तरह की मदद या मार्गदर्शन की आवश्यकता है। यह पूरी तरह गोपनीय है।"
                      : "Please safely share what help or guidance you need. This remains strictly private and confidential."
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-slate-900 transition leading-relaxed resize-none"
                />
              </div>

              {/* Exact Reassurance Line Right Above Submit Button */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <p className="text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed">
                  {lang === "hi"
                    ? "यह फॉर्म पूरी तरह एन्क्रिप्टेड है। आपकी जानकारी केवल NGO के आंतरिक सत्यापन के लिए सुरक्षित रहेगी।"
                    : "This form is end-to-end encrypted. Your details remain strictly protected for internal NGO counselor verification only."}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-purple-800 hover:from-rose-700 hover:to-purple-900 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {lang === "hi"
                        ? "सुरक्षित भेजा जा रहा है..."
                        : "Sending securely..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-rose-200" />
                    <span>
                      {lang === "hi"
                        ? "सुरक्षित सहायता अनुरोध भेजें (100% Confidential)"
                        : "Submit Confidential Request (100% Private)"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Direct WhatsApp SOS Helpline Card */}
        <div className="mt-8 bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-emerald-100">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>
                {lang === "hi" ? "तुरंत सुरक्षित WhatsApp चैट" : "Instant Confidential WhatsApp Chat"}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              {lang === "hi"
                ? "सीधे गोपनीय महिला हेल्पलाइन पर संदेश भेजें"
                : "Direct Message to Confidential Female Helpline"}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
              {lang === "hi"
                ? "यदि आप फॉर्म नहीं भरना चाहती हैं, तो सीधे हमारे आधिकारिक हेल्पलाइन नंबर पर WhatsApp संदेश भेजकर संपर्क कर सकती हैं।"
                : "If you prefer not to fill out the form, you can message our official counselor helpline on WhatsApp directly."}
            </p>
          </div>

          <a
            href="https://wa.me/919876543210?text=Salam%20%2F%20Namaste%20Apni%20Madad%20Foundation.%20Mujhe%20gopniya%20mahila%20sahayata%20ki%20zaroorat%20hai."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>
              {lang === "hi" ? "WhatsApp पर बात करें" : "Chat on WhatsApp"}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
