import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import { getRequestLocaleState } from "@/lib/request-locale";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Code Relay",
  description: "Tournoi de programmation en relais"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, source } = await getRequestLocaleState();

  return (
    <html lang={locale}>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} mb-24`}>
        <LocaleProvider initialLocale={locale} initialSource={source}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
