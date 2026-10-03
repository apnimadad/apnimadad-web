"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Brain,
  MapPin,
  Globe,
} from "lucide-react";
import { submitConfidentialCase } from "@/lib/actions/cases";
import { useLanguage } from "@/components/LanguageContext";

export default function SattaMuktPage() {
  const { lang, setLang } = useLanguage();

  const [aliasName, setAliasName] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [safeContactTime, setSafeContactTime] = useState(
    lang === "hi"
      ? "शाम 7:00 से रात 9:00 (काम के बाद एकांत समय)"
      : "Evening 7:00 PM to 9:00 PM (Quiet time after work)"
  );
  const [customSafeTime, setCustomSafeTime] = useState("");
  const [city, setCity] = useState("");
  const [bettingType, setBettingType] = useState(
    lang === "hi"
      ? "ऑनलाइन सट्टा ऐप्स (क्रिकेट, कसीनो, गेमिंग ऐप्स)"
      : "Online Betting Apps (Cricket, Casino, Gaming Apps)"
  );
  const [supportArea, setSupportArea] = useState(
    lang === "hi"
      ? "सट्टे की लत छुड़ाने हेतु मनोवैज्ञानिक काउंसलिंग"
      : "Psychological Counseling to Overcome Addiction"
  );
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeTimeOptionsHi = [
    "शाम 7:00 से रात 9:00 (काम के बाद एकांत समय)",
    "दोपहर 1:00 से 3:00 (लंच / फुर्सत का समय)",
    "सुबह 9:00 से 11:00 (दिन की शुरुआत में)",
    "केवल WhatsApp संदेश (कृपया सीधे फोन कॉल न करें)",
    "अन्य सुरक्षित समय (कस्टम चुनें)",
  ];

  const safeTimeOptionsEn = [
    "Evening 7:00 PM to 9:00 PM (Quiet time after work)",
    "Afternoon 1:00 PM to 3:00 PM (Lunch / leisure hours)",
    "Morning 9:00 AM to 11:00 AM (Start of day)",
    "Only WhatsApp Message (Do not place direct phone calls)",
    "Other Safe Time (Custom Specified)",
  ];

  const safeTimeOptions = lang === "hi" ? safeTimeOptionsHi : safeTimeOptionsEn;

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
          ? "कृपया अपनी समस्या या स्थिति का संक्षिप्त विवरण लिखें।"
          : "Please write a brief description of your situation or struggle."
      );
      return;
    }

    const finalSafeTime =
      safeContactTime.includes("कस्टम") || safeContactTime.includes("Custom")
        ? customSafeTime.trim() || (lang === "hi" ? "कस्टम सुरक्षित समय" : "User custom safe time")
        : safeContactTime;

    const fullDetails = `[Betting Medium]: ${bettingType}\n[Assistance Area]: ${supportArea}\n[Details]: ${details.trim()}`;

    setSubmitting(true);
    try {
      const res = await submitConfidentialCase({
        category: "satta_mukt",
        aliasName: aliasName.trim(),
        realName: realName.trim() || undefined,
        phone: cleanPhone,
        safeContactTime: finalSafeTime,
        city: city.trim() || (lang === "hi" ? "भारत" : "India"),
        supportType: supportArea,
        details: fullDetails,
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-slate-50 to-white pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header Breadcrumb & Status & Language Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-100/80 border border-amber-300 text-amber-950 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>
              {lang === "hi"
                ? "100% गोपनीय व सुरक्षित अभियान (Secure De-Addiction)"
                : "100% Confidential & Secure Mission (De-Addiction & Support)"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="inline-flex items-center bg-white p-1 rounded-xl border border-amber-200 shadow-2xs text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-amber-600 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                  lang === "en"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
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
                    ? "bg-amber-600 text-white font-bold shadow-xs"
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

        {/* Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/90 shadow-md mb-8">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-widest">
              {lang === "hi"
                ? "अपनी मदद फाउंडेशन · जीवन पुनर्वास अभियान"
                : "Apni Madad Foundation · Life Restoration Mission"}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-2 mb-4 leading-tight">
              {lang === "hi" ? "सट्टा मुक्त अभियान" : "De-Addiction Support Desk"}{" "}
              <span className="text-amber-700">
                {lang === "hi"
                  ? "(Secure & 100% Confidential)"
                  : "(Secure & 100% Confidential)"}
              </span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {lang === "hi"
                ? "सट्टे और जुए की लत ने अनगिनत परिवारों को कर्ज, मानसिक अवसाद और कानूनी संकट में डाला है। अपनी मदद फाउंडेशन आपको बिना किसी सामाजिक कलंक या सार्वजनिक खुलासे के इस दलदल से सम्मानपूर्वक बाहर निकलने का एक सुरक्षित रास्ता प्रदान करता है।"
                : "Betting and gambling addiction trap individuals in crippling debt, emotional stress, and family turmoil. Apni Madad Foundation provides a safe, completely private, and stigma-free path toward recovery and dignity."}
            </p>
          </div>

          {/* 2 Core Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/70 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {lang === "hi"
                    ? "गोपनीयता (100% Confidential)"
                    : "100% Confidentiality Guarantee"}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {lang === "hi"
                    ? "मदद मांगने वाले व्यक्ति या उसके परिवार का नाम, फोन नंबर और पहचान पूरी तरह गुप्त रखी जाएगी। यह जानकारी किसी सार्वजनिक मंच या दानदाता को कभी नहीं दिखाई जाएगी।"
                    : "Your personal details, phone number, and location are protected with strict secrecy. Never published or visible to anyone outside certified NGO counselors."}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/70 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {lang === "hi"
                    ? "काउंसलिंग व मार्गदर्शन"
                    : "Counseling & Financial Guidance"}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {lang === "hi"
                    ? "सट्टे की लत छुड़ाने के लिए मनोवैज्ञानिक सलाह और कर्ज से निपटने के लिए कानूनी/आर्थिक मार्गदर्शन उपलब्ध कराया जाएगा।"
                    : "Psychological counseling to break addictive urges, combined with practical advice for debt management and family stress relief."}
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
                  ? "आपका गोपनीय परामर्श अनुरोध सुरक्षित दर्ज हुआ 🙏"
                  : "Your Confidential Consultation Request Recorded Safely 🙏"}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {lang === "hi" ? (
                  <>
                    प्रिय <strong className="text-slate-900">{aliasName}</strong>, आपकी पहचान पूरी तरह
                    सुरक्षित है। हमारे विशेषज्ञ काउंसलर आपके चुने हुए समय (<strong>{safeContactTime}</strong>) पर
                    अत्यंत सावधानी से संपर्क करेंगे।
                  </>
                ) : (
                  <>
                    Dear <strong className="text-slate-900">{aliasName}</strong>, your request is safely
                    encrypted. Our certified counselor will discreetly reach out during your chosen window
                    (<strong>{safeContactTime}</strong>).
                  </>
                )}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-xs text-slate-500">
              {lang === "hi"
                ? "यह केस वेबसाइट या किसी बाहरी दर्शक को कभी प्रदर्शित नहीं किया जाएगा। यह केवल आंतरिक परामर्श व मार्गदर्शन के लिए है।"
                : "This inquiry will never be displayed on public pages or search engines. It is handled exclusively by verified counselors."}
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
                <Lock className="w-5 h-5 text-amber-700" />
                <span>
                  {lang === "hi"
                    ? "गोपनीय परामर्श फॉर्म (100% Confidential Request)"
                    : "Confidential Consultation Form (100% Private)"}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {lang === "hi"
                  ? "अपनी असली पहचान छिपाने के लिए आप कोई भी उपनाम या काल्पनिक नाम (Alias) चुन सकते हैं।"
                  : "You can choose any alias or pseudonym to keep your identity completely private."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alias and Real Name */}
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
                      ? "काल्पनिक नाम चुनें ताकि आपकी असली पहचान किसी को न दिखे।"
                      : "Choose a pseudonym (e.g. Brother R, Sahil) so your real name stays secret."}
                  </p>
                  <input
                    type="text"
                    required
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder={
                      lang === "hi" ? "उदा. भाई R, साहिल, आजाद" : "e.g. Brother R, Sahil, Azad"
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition bg-amber-50/20"
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
                      ? "केवल NGO के आंतरिक रिकॉर्ड के लिए (पूरी तरह गोपनीय)।"
                      : "Strictly for NGO internal record (100% confidential)."}
                  </p>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder={
                      lang === "hi" ? "यदि साझा करना चाहें तो लिखें" : "Write here if you wish to share"
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Safe Contact Time & Safe Phone */}
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
                      ? "चुनें कि टीम आपको कब कॉल करे ताकि परिवार या ऑफिस में कोई पास न हो।"
                      : "Select when you will be alone without family or colleagues around."}
                  </p>
                  <select
                    value={safeContactTime}
                    onChange={(e) => setSafeContactTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm font-semibold text-slate-900 transition bg-white"
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
                          ? "उदा. रात 10 बजे के बाद, या दोपहर 1:30 बजे"
                          : "e.g. After 10:00 PM, or around 1:30 PM lunch"
                      }
                      value={customSafeTime}
                      onChange={(e) => setCustomSafeTime(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl border border-amber-300 focus:border-amber-500 text-xs font-medium text-slate-900"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi"
                      ? "सुरक्षित मोबाइल नंबर / WhatsApp"
                      : "Safe Mobile / WhatsApp Number"}{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {lang === "hi"
                      ? "वह नंबर जिस पर सिर्फ आप ही संदेश या कॉल देख सकें।"
                      : "A private number where only you can access incoming calls or messages."}
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Addiction Type & Support Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi" ? "सट्टे या जुए का मुख्य माध्यम" : "Primary Gambling / Betting Medium"}
                  </label>
                  <select
                    value={bettingType}
                    onChange={(e) => setBettingType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    <option value={lang === "hi" ? "ऑनलाइन सट्टा ऐप्स (क्रिकेट, कसीनो, गेमिंग ऐप्स)" : "Online Betting Apps (Cricket, Casino, Gaming)"}>
                      {lang === "hi"
                        ? "ऑनलाइन सट्टा ऐप्स (क्रिकेट, कसीनो, गेमिंग ऐप्स)"
                        : "Online Betting Apps (Cricket, Casino, Gaming)"}
                    </option>
                    <option value={lang === "hi" ? "स्थानीय सट्टा / मटका" : "Local Matka / Offline Gambling"}>
                      {lang === "hi" ? "स्थानीय सट्टा / मटका" : "Local Matka / Offline Gambling"}
                    </option>
                    <option value={lang === "hi" ? "शेयर बाजार ऑप्शंस / इंट्राडे गैंबलिंग" : "Stock Market F&O / Intraday Gambling"}>
                      {lang === "hi"
                        ? "शेयर बाजार ऑप्शंस / इंट्राडे गैंबलिंग"
                        : "Stock Market F&O / Intraday Gambling"}
                    </option>
                    <option value={lang === "hi" ? "ताश के खेल / क्लब्स / अन्य जुआ" : "Cards / Casinos / Club Gambling"}>
                      {lang === "hi" ? "ताश के खेल / क्लब्स / अन्य जुआ" : "Cards / Casinos / Club Gambling"}
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    {lang === "hi" ? "सहायता का मुख्य क्षेत्र" : "Primary Area of Assistance"}
                  </label>
                  <select
                    value={supportArea}
                    onChange={(e) => setSupportArea(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    <option value={lang === "hi" ? "सट्टे की लत छुड़ाने हेतु मनोवैज्ञानिक काउंसलिंग" : "Psychological Counseling to Overcome Addiction"}>
                      {lang === "hi"
                        ? "सट्टे की लत छुड़ाने हेतु मनोवैज्ञानिक काउंसलिंग"
                        : "Psychological Counseling to Overcome Addiction"}
                    </option>
                    <option value={lang === "hi" ? "कर्ज व साहूकारों से निपटने की कानूनी सलाह" : "Legal & Debt Restructuring Guidance"}>
                      {lang === "hi"
                        ? "कर्ज व साहूकारों से निपटने की कानूनी सलाह"
                        : "Legal & Debt Restructuring Guidance"}
                    </option>
                    <option value={lang === "hi" ? "आर्थिक सुधार व वित्तीय बजट योजना" : "Financial Recovery & Budget Planning"}>
                      {lang === "hi"
                        ? "आर्थिक सुधार व वित्तीय बजट योजना"
                        : "Financial Recovery & Budget Planning"}
                    </option>
                    <option value={lang === "hi" ? "पारिवारिक तनाव व मानसिक तनाव से मुक्ति" : "Family Conflict & Mental Stress Relief"}>
                      {lang === "hi"
                        ? "पारिवारिक तनाव व मानसिक तनाव से मुक्ति"
                        : "Family Conflict & Mental Stress Relief"}
                    </option>
                  </select>
                </div>
              </div>

              {/* City and Situation Notes */}
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
                        ? "उदा. इंदौर, मुंबई, अहमदाबाद, जयपुर, दिल्ली"
                        : "e.g. Indore, Mumbai, Ahmedabad, Jaipur, Delhi"
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  {lang === "hi"
                    ? "अपनी स्थिति या कर्ज/मानसिक दबाव का संक्षिप्त विवरण"
                    : "Brief description of situation, debt, or mental stress"}{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    lang === "hi"
                      ? "कृपया अपनी स्थिति साझा करें (उदा. कितने समय से लत है, किस प्रकार का दबाव है)। आपकी हर बात 100% गुप्त रहेगी।"
                      : "Please safely describe your challenge (e.g. duration of betting, debt burden). Everything remains 100% private."
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition leading-relaxed resize-none"
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
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-800 hover:to-orange-800 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
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
                    <Lock className="w-4 h-4 text-amber-200" />
                    <span>
                      {lang === "hi"
                        ? "सुरक्षित परामर्श अनुरोध भेजें (100% Confidential)"
                        : "Submit Confidential Request (100% Private)"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Direct WhatsApp Counseling Contact */}
        <div className="mt-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 border border-indigo-900/50">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>
                {lang === "hi" ? "गोपनीय हेल्पलाइन चैट" : "Confidential Helpline Chat"}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              {lang === "hi"
                ? "सीधे WhatsApp पर गोपनीय बात करें"
                : "Confidential Consultation via WhatsApp"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              {lang === "hi"
                ? "यदि आप तत्काल गोपनीय मार्गदर्शन चाहते हैं, तो हमारे हेल्पलाइन नंबर पर WhatsApp संदेश भेज सकते हैं।"
                : "If you need immediate confidential guidance, you can message our verified helpline directly on WhatsApp."}
            </p>
          </div>

          <a
            href="https://wa.me/919876543210?text=Salam%20%2F%20Namaste%20Apni%20Madad%20Foundation.%20Mujhe%20Satta%20Mukt%20Abhiyan%20ke%20tehat%20gopniya%20counseling%20chahiye."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>
              {lang === "hi" ? "WhatsApp पर संदेश भेजें" : "Message on WhatsApp"}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
