import React, { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useEcosystemStore } from '../store';
import { setAdminCallbacks, setAdminTokens } from '../api/apiClient';

// Initializing the React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Setup global auth callbacks so that expired tokens automatically
    // log the user out even if they just refreshed the page
    setAdminCallbacks(
      (newAccess, newRefresh) => {
        setAdminTokens(newAccess, newRefresh);
        useAuthStore.setState({ accessToken: newAccess, refreshToken: newRefresh });
      },
      () => {
        setAdminTokens(null, null);
        useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      }
    );

    // If authenticated, optionally prefetch data
    if (useAuthStore.getState().isAuthenticated) {
      useEcosystemStore.getState().fetchFarmers().catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'text-xs font-bold font-mono select-none rounded-none shadow-xl border border-[#142217] uppercase tracking-wider',
          style: {
            background: '#0B110D',
            color: '#ffffff',
            borderRadius: '0px',
            border: '1px solid #142217'
          },
          success: {
            iconTheme: {
              primary: '#00FF87',
              secondary: '#000000',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};
