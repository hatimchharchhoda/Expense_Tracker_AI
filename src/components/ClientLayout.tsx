'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from '@/store/store';
import AuthProvider from '@/context/AuthProvider';
import ClientNavbar from '@/components/ClientNavbar';
import { Toaster } from '@/components/ui/toaster';

// Simple loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 animate-spin"></div>
  </div>
);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Provider store={store}>
      {isClient ? (
        <PersistGate loading={<Loading />} persistor={persistor}>
          <AuthProvider>
            <ClientNavbar />
            <div className="min-h-[calc(100vh-64px)]">{children}</div>
            <Toaster />
          </AuthProvider>
        </PersistGate>
      ) : (
        <Loading />
      )}
    </Provider>
  );
}