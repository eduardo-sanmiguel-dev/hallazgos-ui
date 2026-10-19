"use client";

import { ReactNode, useEffect } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { getQueryClient } from "@shared/libs/queryClient";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // Los catálogos vivían en sessionStorage (store "categories"); ahora los
  // maneja la caché de React Query. Se limpia el valor viejo.
  useEffect(() => {
    try {
      sessionStorage.removeItem("categories");
    } catch {
      // Sin acceso a sessionStorage: no hay nada que limpiar.
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo se incluye en desarrollo (en producción es un no-op). */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
