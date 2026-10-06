// src/lib/query/provider.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { queryClient } from './client';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
  { ssr: false }
);

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Only mount devtools after the client has mounted. This keeps the ssr:false
  // dynamic import OUT of the server render tree, so it cannot bail the whole
  // page to client-side rendering (which would kill SSR for public pages).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && mounted && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
