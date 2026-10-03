import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { AuthProvider } from "@/components/AuthContext";
import { SiteSettingsProvider } from "@/components/SiteSettingsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apni Madad Foundation | Direct Help, Zero Commission",
  description:
    "Transparent platform where verified needy people receive donations directly into their bank/UPI. 100% of every donation reaches the beneficiary.",
  keywords: "donation, charity, medical help, education support, India, NGO, direct donation",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/logo-circle.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                var origError = console.error;
                console.error = function() {
                  var msg = '';
                  for (var i = 0; i < arguments.length; i++) {
                    var arg = arguments[i];
                    msg += ' ' + String(arg && arg.message ? arg.message : arg || '');
                  }
                  if (
                    msg.indexOf('bis_skin_checked') !== -1 ||
                    msg.indexOf('chrome-extension://') !== -1 ||
                    msg.indexOf('Hydration') !== -1 ||
                    msg.indexOf('M_ID') !== -1
                  ) {
                    return;
                  }
                  origError.apply(console, arguments);
                };

                window.addEventListener('error', function(event) {
                  if (!event) return;
                  var filename = String(event.filename || '');
                  var msg = String(event.message || '');
                  if (
                    filename.indexOf('chrome-extension://') !== -1 ||
                    msg.indexOf('chrome-extension://') !== -1 ||
                    msg.indexOf('M_ID') !== -1 ||
                    msg.indexOf('bis_skin_checked') !== -1
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  if (!event) return;
                  var reason = String(event.reason && event.reason.message ? event.reason.message : event.reason || '');
                  if (
                    reason.indexOf('chrome-extension://') !== -1 ||
                    reason.indexOf('M_ID') !== -1 ||
                    reason.indexOf('bis_skin_checked') !== -1
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">
        <AuthProvider>
          <LanguageProvider>
            <SiteSettingsProvider>
              <Header />
              <main suppressHydrationWarning className="flex-1">{children}</main>
              <Footer />
            </SiteSettingsProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
