"use client";

if (typeof window !== "undefined") {
  const isIgnorableNoise = (str: string) => {
    const s = str.toLowerCase();
    return (
      s.includes("bis_skin_checked") ||
      s.includes("hydration failed") ||
      s.includes("did not match") ||
      s.includes("chrome-extension://") ||
      s.includes("m_id") ||
      s.includes("react-hydration-error") ||
      s.includes("cannot read properties of undefined (reading 'm_id')")
    );
  };

  const origError = console.error;
  console.error = function (...args: unknown[]) {
    const fullText = args
      .map((a) => {
        if (!a) return "";
        if (typeof a === "string") return a;
        if (typeof a === "object") {
          const obj = a as { message?: string; stack?: string; digest?: string };
          return obj.message || obj.stack || obj.digest || "";
        }
        return String(a);
      })
      .join(" ");

    if (isIgnorableNoise(fullText)) {
      return;
    }
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = function (...args: unknown[]) {
    const fullText = args
      .map((a) => (typeof a === "string" ? a : String(a || "")))
      .join(" ");

    if (isIgnorableNoise(fullText)) {
      return;
    }
    origWarn.apply(console, args);
  };

  window.addEventListener(
    "error",
    (event) => {
      const msg = String(event?.message || "");
      const file = String(event?.filename || "");
      if (isIgnorableNoise(msg) || isIgnorableNoise(file)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = String(
        (event?.reason as { message?: string })?.message || event?.reason || ""
      );
      if (isIgnorableNoise(reason)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

export default function ClientErrorGuard() {
  return null;
}
