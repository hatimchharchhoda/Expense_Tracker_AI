import { ThemeProvider } from "@/components/ThemeProvider";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Expense Tracker | Manage Your Finances",
  description:
    "Track your income, expenses, and savings with this comprehensive expense tracking application. Set budgets, visualize spending patterns, and take control of your financial future.",
  keywords: [
    "expense tracker",
    "budget management",
    "financial planning",
    "personal finance",
    "money management",
    "spending tracker",
  ],
  authors: [{ name: "Sujal Talreja", url: "https://sujaltalreja.vercel.app" }],
  creator: "Sujal Talreja",
  publisher: "Sujal Talreja",
  formatDetection: {
    email: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  themeColor: "#3b82f6", // Tailwind blue-500
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expense Tracker",
  },
  applicationName: "Expense Tracker",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://expense-tracker-sujaltlrj.vercel.app",
    title: "Expense Tracker | Manage Your Finances",
    description:
      "Track your income, expenses, and savings with this comprehensive expense tracking application.",
    siteName: "Expense Tracker",
    images: [
      {
        url: "https://expense-tracker-sujaltlrj.vercel.app/icon.png", // ✅ Absolute URL
        width: 1200,
        height: 630,
        alt: "Expense Tracker Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Expense Tracker | Manage Your Finances",
    description:
      "Take control of your financial future with our Expense Tracker",
    images: ["https://expense-tracker-sujaltlrj.vercel.app/icon.png"],
    creator: "@sujaltalreja",
    site: "@sujaltalreja",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: { url: "/icon.png" },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="theme-preference">
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
