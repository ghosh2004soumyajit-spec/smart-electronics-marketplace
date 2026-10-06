import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Self-hosted fonts (no third-party requests, no FOUT surprises)
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';

import './index.css';
import App from './App';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';

// React Query: cache catalog data, keep filter changes snappy
// (placeholderData keeps previous results visible while refetching).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <CompareProvider>
              <App />
            </CompareProvider>
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
