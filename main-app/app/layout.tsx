import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RosterPoint",
  description: "A collaborative hiring pipeline and applicant tracking system.",
};

import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsent } from "@/components/cookie-consent";
import { ServiceWorkerUnregister } from "@/components/service-worker";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ServiceWorkerUnregister />
        <TooltipProvider delay={150}>
          {children}
        </TooltipProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
