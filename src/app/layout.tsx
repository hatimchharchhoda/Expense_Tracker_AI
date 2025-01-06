'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import ClientNavbar from '@/components/ClientNavbar';
import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; // Import PersistGate
import store ,{ persistor } from '@/store/store'; // Import both store and persistor

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider store={store}>
          {/* PersistGate ensures state is rehydrated before rendering */}
          <PersistGate loading={null} persistor={persistor}>
            <AuthProvider>
              <ClientNavbar />
              {children}
              <Toaster />
            </AuthProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
