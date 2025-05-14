import { ThemeProvider } from "@/components/ThemeProvider";
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Tracker | Manage Your Finances',
  description: 'Track your income, expenses, and savings with this comprehensive expense tracking application. Set budgets, visualize spending patterns, and take control of your financial future.',
  keywords: ['expense tracker', 'budget management', 'financial planning', 'personal finance', 'money management', 'spending tracker'],
  authors: [{ name: 'Your Name', url: 'https://yourwebsite.com' }],
  creator: 'Your Name/Company',
  publisher: 'Your Name/Company',
  formatDetection: {
    email: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  themeColor: '#3b82f6', // Blue color that matches your app's primary color
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Expense Tracker',
  },
  applicationName: 'Expense Tracker',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://expense-tracker-sujaltlrj.vercel.app',
    title: 'Expense Tracker | Manage Your Finances',
    description: 'Track your income, expenses, and savings with this comprehensive expense tracking application.',
    siteName: 'Expense Tracker',
    images: [
      {
        url: '/icon.png', // Use a verified existing image
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker | Manage Your Finances',
    description: 'Take control of your financial future with our Expense Tracker',
    images: ['/icon.png'], // Use same verified image for Twitter
    creator: '@yourhandle',
    site: '@yourcompany',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' }
    ],
    apple: { url: '/icon.png' }
  },
  viewport: {
    width: 'device-width',
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
      <head>
        {/* No need for manual favicon links since we're using the icons metadata */}
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="theme-preference">
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}