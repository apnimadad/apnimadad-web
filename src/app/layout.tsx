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

                function cleanAttributes() {
                  try {
                    var els = document.querySelectorAll('[bis_skin_checked]');
                    for (var i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                    }
                  } catch (e) {}
                }
                cleanAttributes();

                try {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked' && m.target && m.target.removeAttribute) {
                        m.target.removeAttribute('bis_skin_checked');
                      } else if (m.addedNodes) {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var node = m.addedNodes[j];
                          if (node && node.nodeType === 1) {
                            if (node.hasAttribute && node.hasAttribute('bis_skin_checked')) {
                              node.removeAttribute('bis_skin_checked');
                            }
                            if (node.querySelectorAll) {
                              var children = node.querySelectorAll('[bis_skin_checked]');
                              for (var k = 0; k < children.length; k++) {
                                children[k].removeAttribute('bis_skin_checked');
                              }
                            }
                          }
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    childList: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                } catch (e) {}

                var origError = console.error;
                console.error = function() {
                  var msg = '';
                  for (var i = 0; i < arguments.length; i++) {
                    var arg = arguments[i];
                    msg += ' ' + String(arg && arg.message ? arg.message : arg || '');
                  }
                  if (msg.indexOf('bis_skin_checked') !== -1 || (msg.indexOf('Hydration') !== -1 && msg.indexOf('bis_skin') !== -1)) {
                    return;
                  }
                  origError.apply(console, arguments);
                };

                window.addEventListener('error', function(event) {
                  if (event && event.message && event.message.indexOf('bis_skin_checked') !== -1) {
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
