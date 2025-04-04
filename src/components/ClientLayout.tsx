'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from '@/store/store';
import AuthProvider from '@/context/AuthProvider';
import ClientNavbar from '@/components/ClientNavbar';
import { Toaster } from '@/components/ui/toaster';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <ClientNavbar />
          {children}
          <Toaster />
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}