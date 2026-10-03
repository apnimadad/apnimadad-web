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
} from "lucide-react";
import { submitConfidentialCase } from "@/lib/actions/cases";

export default function WomenHelpPage() {
  const [aliasName, setAliasName] = useState("");
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [safeContactTime, setSafeContactTime] = useState(
    "सुबह 10:00 से दोपहर 12:00 (जब ससुराल/घर पर कोई न हो)"
  );
  const [customSafeTime, setCustomSafeTime] = useState("");
  const [city, setCity] = useState("");
  const [supportType, setSupportType] = useState("घरेलू प्रताड़ना व सुरक्षा");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeTimeOptions = [
    "सुबह 10:00 से दोपहर 12:00 (जब ससुराल/घर पर कोई न हो)",
    "दोपहर 2:00 से शाम 4:00 (शांत व सुरक्षित समय)",
    "शाम 6:00 से रात 8:00 (फुर्सत के समय)",
    "केवल WhatsApp संदेश (कृपया सीधे फोन कॉल न करें)",
    "अन्य सुरक्षित समय (कस्टम चुनें)",
  ];

  const handleQuickExit = () => {
    // Immediately redirect to Google for emergency personal privacy
    window.location.replace("https://www.google.com");
  };

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
      setErrorMsg("कृपया अपनी समस्या या सहायता की जरूरत का संक्षिप्त विवरण लिखें।");
      return;
    }

    const finalSafeTime =
      safeContactTime === "अन्य सुरक्षित समय (कस्टम चुनें)"
        ? customSafeTime.trim() || "User specified custom safe time"
        : safeContactTime;

    setSubmitting(true);
    try {
      const res = await submitConfidentialCase({
        category: "women_help",
        aliasName: aliasName.trim(),
        realName: realName.trim() || undefined,
        phone: cleanPhone,
        safeContactTime: finalSafeTime,
        city: city.trim() || "India",
        supportType,
        details: details.trim(),
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-slate-50 to-white pb-24">
      {/* Quick Emergency Exit Bar */}
      <div className="bg-rose-900 text-rose-100 py-2.5 px-4 text-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              यदि आप सुरक्षित महसूस न करें तो तुरंत बाहर निकलने के लिए Quick Exit दबाएं:
            </span>
          </div>
          <button
            onClick={handleQuickExit}
            className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-xs transition shrink-0 cursor-pointer"
            title="तुरंत सुरक्षित Google पेज पर जाएं"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quick Exit</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-100/80 border border-rose-300 text-rose-900 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-rose-700" />
            <span>100% गोपनीय व सुरक्षित सहायता मंच (Safe & Secure)</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            होम पेज पर वापस जाएं
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-rose-200/80 shadow-md mb-8">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-widest">
              Apni Madad Foundation · Women Support Initiative
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mt-2 mb-4 leading-tight">
              महिला सहायता{" "}
              <span className="text-rose-600">(पहचान पूरी तरह गोपनीय)</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              अपनी मदद फाउंडेशन हर उस बहन और बेटी के साथ मजबूती से खड़ा है जो किसी भी तरह की
              घरेलू, कानूनी, आर्थिक या मानसिक परेशानी से जूझ रही हैं। आपकी सुरक्षा और सम्मान
              हमारी सर्वोच्च प्राथमिकता है।
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
                  गोपनीयता (100% Confidential)
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  मदद मांगने वाली बहन का नाम, फोन और पता सार्वजनिक वेबसाइट पर कभी नहीं दिखेगा।
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  सुरक्षित समय पर कॉल
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  NGO की टीम सिर्फ आपके द्वारा चुने गए सुरक्षित समय पर ही कॉल या मैसेज करेगी।
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  महिला काउंसलर सहायता
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  कानूनी मदद, भरण-पोषण सलाह, और मनोबल बढ़ाने के लिए महिला प्रतिनिधि द्वारा मार्गदर्शन।
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
                आपका अनुरोध सुरक्षित प्राप्त हुआ 🙏
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                प्रिय <strong className="text-slate-900">{aliasName}</strong>, आपकी जानकारी
                पूरी तरह एन्क्रिप्टेड है। हमारी महिला काउंसलर टीम आपके द्वारा चुने गए सुरक्षित समय
                (<strong>{safeContactTime}</strong>) पर संपर्क करेगी।
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-xs text-slate-500">
              यह केस वेबसाइट या किसी भी बाहरी व्यक्ति को कभी नहीं दिखेगा। यह केवल ट्रस्ट के अधिकृत
              काउंसलर्स द्वारा संभाला जा रहा है।
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
                <Lock className="w-5 h-5 text-rose-600" />
                <span>गोपनीय सहायता फॉर्म भरें</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                अपनी पहचान छिपाने के लिए आप कोई भी काल्पनिक नाम (Alias) चुन सकती हैं।
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
                    प्रदर्शित नाम (Alias/Display Name) <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    वह अपना कोई काल्पनिक नाम (जैसे: बहन X, स्वाति) चुन सकती हैं, ताकि असली नाम किसी को न दिखे।
                  </p>
                  <input
                    type="text"
                    required
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder="उदा. बहन X, स्वाति, सीमा"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-semibold text-slate-900 transition bg-rose-50/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    असली नाम (वैकल्पिक / Optional)
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    केवल NGO के आंतरिक रिकॉर्ड के लिए, किसी के साथ साझा नहीं किया जाएगा।
                  </p>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="यदि साझा करना चाहें तो लिखें"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Trust Factor 2: Safe Contact Time & Safe Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    संपर्क का सुरक्षित समय (Safe Contact Time) <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    वह चुन सकें कि NGO टीम उन्हें किस समय कॉल करे, ताकि ससुराल में कोई उनके पास न हो।
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

                  {safeContactTime === "अन्य सुरक्षित समय (कस्टम चुनें)" && (
                    <input
                      type="text"
                      placeholder="उदा. केवल रात 9:30 के बाद, या दोपहर 1:15 से 2:00"
                      value={customSafeTime}
                      onChange={(e) => setCustomSafeTime(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl border border-rose-300 focus:border-rose-500 text-xs font-medium text-slate-900"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    सुरक्षित मोबाइल नंबर / WhatsApp नंबर <span className="text-rose-600">*</span>
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-semibold text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* City and Support Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">
                    सहायता का मुख्य प्रकार
                  </label>
                  <select
                    value={supportType}
                    onChange={(e) => setSupportType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-semibold text-slate-900 transition bg-white"
                  >
                    <option value="घरेलू प्रताड़ना व सुरक्षा">घरेलू प्रताड़ना व सुरक्षा (Domestic Abuse)</option>
                    <option value="कानूनी सहायता व भरण-पोषण">कानूनी सहायता व भरण-पोषण (Legal Aid)</option>
                    <option value="बच्चों की शिक्षा व सुरक्षा">बच्चों की सुरक्षा व शिक्षा सहायता</option>
                    <option value="चिकित्सा व आपातकालीन मदद">चिकित्सा व आपातकालीन दवाएं</option>
                    <option value="आर्थिक स्वावलंबन व रोजगार">आर्थिक स्वावलंबन व सिलाई/काम</option>
                    <option value="अन्य गोपनीय परामर्श">अन्य व्यक्तिगत गोपनीय परामर्श</option>
                  </select>
                </div>

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
                      placeholder="उदा. लखनऊ, दिल्ली, कानपुर, भोपाल"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Situation Details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  अपनी स्थिति या जरूरत का विवरण साझा करें <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="कृपया सुरक्षित रूप से बताएं कि आपको किस तरह की मदद या मार्गदर्शन की आवश्यकता है। यह पूरी तरह गोपनीय है।"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm text-slate-900 transition leading-relaxed resize-none"
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
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-purple-800 hover:from-rose-700 hover:to-purple-900 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>सुरक्षित भेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-rose-200" />
                    <span>सुरक्षित सहायता अनुरोध भेजें (100% Confidential)</span>
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
              <span>तुरंत सुरक्षित WhatsApp चैट</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              सीधे गोपनीय महिला हेल्पलाइन पर संदेश भेजें
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
              यदि आप फॉर्म नहीं भरना चाहती हैं, तो सीधे हमारे आधिकारिक हेल्पलाइन नंबर पर
              WhatsApp संदेश भेजकर संपर्क कर सकती हैं।
            </p>
          </div>

          <a
            href="https://wa.me/919876543210?text=Salam%20%2F%20Namaste%20Apni%20Madad%20Foundation.%20Mujhe%20gopniya%20mahila%20sahayata%20ki%20zaroorat%20hai."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>WhatsApp पर बात करें</span>
          </a>
        </div>
      </div>
    </div>
  );
}
