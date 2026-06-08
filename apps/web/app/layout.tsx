import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import SiteFooter from "@/components/site-footer";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "HanapKalinga",
  description: "Find verified private duty nurses and caregivers in the Philippines."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${manrope.variable} bg-slate-50 text-slate-900`}>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
