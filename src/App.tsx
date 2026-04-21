import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { createAppRouter } from './router';

export default function App() {
  // QueryClient + Router instantiated once per app mount. The router
  // lives in component state so StrictMode's double-invoke during
  // dev doesn't rebuild it between effects.
  const [{ queryClient, router }] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    const router = createAppRouter(queryClient);
    return { queryClient, router };
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
