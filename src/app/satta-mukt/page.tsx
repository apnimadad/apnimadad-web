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
} from "lucide-react";
import { submitConfidentialCase } from "@/lib/actions/cases";

export default function SattaMuktPage() {
  const [aliasName, setAliasName] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [safeContactTime, setSafeContactTime] = useState(
    "शाम 7:00 से रात 9:00 (काम के बाद एकांत समय)"
  );
  const [customSafeTime, setCustomSafeTime] = useState("");
  const [city, setCity] = useState("");
  const [bettingType, setBettingType] = useState("ऑनलाइन सट्टा ऐप्स (क्रिकेट, कसीनो, गेमिंग ऐप्स)");
  const [supportArea, setSupportArea] = useState("सट्टे की लत छुड़ाने हेतु मनोवैज्ञानिक काउंसलिंग");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeTimeOptions = [
    "शाम 7:00 से रात 9:00 (काम के बाद एकांत समय)",
    "दोपहर 1:00 से 3:00 (लंच / फुर्सत का समय)",
    "सुबह 9:00 से 11:00 (दिन की शुरुआत में)",
    "केवल WhatsApp संदेश (कृपया सीधे फोन कॉल न करें)",
    "अन्य सुरक्षित समय (कस्टम चुनें)",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!aliasName.trim()) {
      setErrorMsg("कृपया अपना प्रदर्शित नाम (Alias Name) दर्ज करें।");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("कृपया संपर्क के लिए सही 10-अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (!details.trim()) {
      setErrorMsg("कृपया अपनी समस्या या स्थिति का संक्षिप्त विवरण लिखें।");
      return;
    }

    const finalSafeTime =
      safeContactTime === "अन्य सुरक्षित समय (कस्टम चुनें)"
        ? customSafeTime.trim() || "User custom safe time"
        : safeContactTime;

    const fullDetails = `[सट्टे का प्रकार]: ${bettingType}\n[सहायता का क्षेत्र]: ${supportArea}\n[विवरण]: ${details.trim()}`;

    setSubmitting(true);
    try {
      const res = await submitConfidentialCase({
        category: "satta_mukt",
        aliasName: aliasName.trim(),
        realName: realName.trim() || undefined,
        phone: cleanPhone,
        safeContactTime: finalSafeTime,
        city: city.trim() || "India",
        supportType: supportArea,
        details: fullDetails,
        urgency: "high",
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || "अनुरोध भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "अनपेक्षित त्रुटि हुई।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-slate-50 to-white pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-100/80 border border-amber-300 text-amber-950 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>100% गोपनीय व सुरक्षित अभियान (Secure De-Addiction)</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            होम पेज पर वापस जाएं
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/90 shadow-md mb-8">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-widest">
              Apni Madad Foundation · Life Restoration Mission
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-2 mb-4 leading-tight">
              सट्टा मुक्त अभियान{" "}
              <span className="text-amber-700">(Secure & 100% Confidential)</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              सट्टे और जुए की लत ने अनगिनत परिवारों को कर्ज, मानसिक अवसाद और कानूनी संकट में डाला है।
              अपनी मदद फाउंडेशन आपको बिना किसी सामाजिक कलंक या सार्वजनिक खुलासे के इस दलदल से
              सम्मानपूर्वक बाहर निकलने का एक सुरक्षित रास्ता प्रदान करता है।
            </p>
          </div>

          {/* 2 Core Highlights requested by User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/70 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  गोपनीयता (100% Confidential)
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  मदद मांगने वाले व्यक्ति या उसके परिवार का नाम, फोन नंबर और पहचान पूरी तरह गुप्त रखी जाएगी।
                  यह जानकारी किसी सार्वजनिक मंच या दानदाता को कभी नहीं दिखाई जाएगी।
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/70 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  काउंसलिंग व मार्गदर्शन
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  सट्टे की लत छुड़ाने के लिए मनोवैज्ञानिक सलाह और कर्ज से निपटने के लिए कानूनी/आर्थिक
                  मार्गदर्शन उपलब्ध कराया जाएगा।
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
                आपका गोपनीय परामर्श अनुरोध सुरक्षित दर्ज हुआ 🙏
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                प्रिय <strong className="text-slate-900">{aliasName}</strong>, आपकी पहचान पूरी तरह
                सुरक्षित है। हमारे विशेषज्ञ काउंसलर आपके चुने हुए समय (<strong>{safeContactTime}</strong>) पर
                अत्यंत सावधानी से संपर्क करेंगे।
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-xs text-slate-500">
              यह केस वेबसाइट या किसी बाहरी दर्शक को कभी प्रदर्शित नहीं किया जाएगा। यह केवल आंतरिक परामर्श व मार्गदर्शन के लिए है।
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                नया अनुरोध भरें
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                मुख्य पृष्ठ पर जाएं
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md">
            <div className="mb-8 pb-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-700" />
                <span>गोपनीय परामर्श फॉर्म (100% Confidential Request)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                अपनी असली पहचान छिपाने के लिए आप कोई भी उपनाम या काल्पनिक नाम (Alias) चुन सकते हैं।
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
                    प्रदर्शित नाम (Alias/Display Name) <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    काल्पनिक नाम चुनें ताकि आपकी असली पहचान किसी को न दिखे।
                  </p>
                  <input
                    type="text"
                    required
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder="उदा. भाई R, साहिल, आजाद"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition bg-amber-50/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    असली नाम (वैकल्पिक / Optional)
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    केवल NGO के आंतरिक रिकॉर्ड के लिए (पूरी तरह गोपनीय)।
                  </p>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="यदि साझा करना चाहें तो लिखें"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Safe Contact Time & Safe Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    संपर्क का सुरक्षित समय (Safe Contact Time) <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    चुनें कि टीम आपको कब कॉल करे ताकि परिवार या ऑफिस में कोई पास न हो।
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

                  {safeContactTime === "अन्य सुरक्षित समय (कस्टम चुनें)" && (
                    <input
                      type="text"
                      placeholder="उदा. रात 10 बजे के बाद, या दोपहर 1:30 बजे"
                      value={customSafeTime}
                      onChange={(e) => setCustomSafeTime(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl border border-amber-300 focus:border-amber-500 text-xs font-medium text-slate-900"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    सुरक्षित मोबाइल नंबर / WhatsApp <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    वह नंबर जिस पर सिर्फ आप ही संदेश या कॉल देख सकें।
                  </p>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-अंकों का सुरक्षित मोबाइल नंबर"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Addiction Type & Support Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    सट्टे या जुए का मुख्य माध्यम
                  </label>
                  <select
                    value={bettingType}
                    onChange={(e) => setBettingType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    <option value="ऑनलाइन सट्टा ऐप्स (क्रिकेट, कसीनो, गेमिंग ऐप्स)">
                      ऑनलाइन सट्टा ऐप्स (क्रिकेट, कसीनो, गेमिंग ऐप्स)
                    </option>
                    <option value="स्थानीय सट्टा / मटका">स्थानीय सट्टा / मटका</option>
                    <option value="शेयर बाजार ऑप्शंस / इंट्राडे गैंबलिंग">
                      शेयर बाजार ऑप्शंस / इंट्राडे गैंबलिंग
                    </option>
                    <option value="ताश के खेल / क्लब्स / अन्य जुआ">ताश के खेल / क्लब्स / अन्य जुआ</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    सहायता का मुख्य क्षेत्र
                  </label>
                  <select
                    value={supportArea}
                    onChange={(e) => setSupportArea(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    <option value="सट्टे की लत छुड़ाने हेतु मनोवैज्ञानिक काउंसलिंग">
                      सट्टे की लत छुड़ाने हेतु मनोवैज्ञानिक काउंसलिंग
                    </option>
                    <option value="कर्ज व साहूकारों से निपटने की कानूनी सलाह">
                      कर्ज व साहूकारों से निपटने की कानूनी सलाह
                    </option>
                    <option value="आर्थिक सुधार व वित्तीय बजट योजना">
                      आर्थिक सुधार व वित्तीय बजट योजना
                    </option>
                    <option value="पारिवारिक तनाव व मानसिक तनाव से मुक्ति">
                      पारिवारिक तनाव व मानसिक तनाव से मुक्ति
                    </option>
                  </select>
                </div>
              </div>

              {/* City and Situation Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  शहर / जिला (City / District)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="उदा. इंदौर, मुंबई, अहमदाबाद, जयपुर, दिल्ली"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  अपनी स्थिति या कर्ज/मानसिक दबाव का संक्षिप्त विवरण <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="कृपया अपनी स्थिति साझा करें (उदा. कितने समय से लत है, किस प्रकार का दबाव है)। आपकी हर बात 100% गुप्त रहेगी।"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition leading-relaxed resize-none"
                />
              </div>

              {/* Exact Reassurance Line Right Above Submit Button */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <p className="text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed">
                  यह फॉर्म पूरी तरह एन्क्रिप्टेड है। आपकी जानकारी केवल NGO के आंतरिक सत्यापन के लिए सुरक्षित रहेगी।
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
                    <span>सुरक्षित भेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-200" />
                    <span>सुरक्षित परामर्श अनुरोध भेजें (100% Confidential)</span>
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
              <span>गोपनीय हेल्पलाइन चैट</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              सीधे WhatsApp पर गोपनीय बात करें
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              यदि आप तत्काल गोपनीय मार्गदर्शन चाहते हैं, तो हमारे हेल्पलाइन नंबर पर WhatsApp संदेश भेज सकते हैं।
            </p>
          </div>

          <a
            href="https://wa.me/919876543210?text=Salam%20%2F%20Namaste%20Apni%20Madad%20Foundation.%20Mujhe%20Satta%20Mukt%20Abhiyan%20ke%20tehat%20gopniya%20counseling%20chahiye."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>WhatsApp पर संदेश भेजें</span>
          </a>
        </div>
      </div>
    </div>
  );
}
