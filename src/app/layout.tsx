import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../context/AuthProvider';
import { Toaster } from "@/components/ui/toaster";
import ClientNavbar from '@/components/ClientNavbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'True Feedback',
  description: 'Real feedback from real people.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={inter.className}>
          <ClientNavbar />
          {children}
          <Toaster />
        </body>
      </AuthProvider>
    </html>
  );
}
