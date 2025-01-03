import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import ClientNavbar from '@/components/ClientNavbar';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Real feedback from real people.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
          <AuthProvider>
            <ClientNavbar />
            {children}
            <Toaster />
          </AuthProvider>
    
      </body>
    </html>
  );
}
