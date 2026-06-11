import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeScript } from "@/components/theme-script";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

const siteDescription =
  "Find verified private duty nurses and caregivers in the Philippines.";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HanapKalinga",
    template: "%s | HanapKalinga"
  },
  description: siteDescription,
  applicationName: "HanapKalinga",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "500x500" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" }
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "500x500" }],
    shortcut: ["/icon.png"]
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteUrl,
    siteName: "HanapKalinga",
    title: "HanapKalinga",
    description: siteDescription,
    images: [
      {
        url: "/icon.png",
        width: 500,
        height: 500,
        alt: "HanapKalinga logo"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "HanapKalinga",
    description: siteDescription,
    images: ["/icon.png"]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${plusJakarta.variable} min-h-screen bg-bg text-text-primary`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
