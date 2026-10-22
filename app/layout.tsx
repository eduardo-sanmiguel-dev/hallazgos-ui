import type { Metadata } from "next";

import { Toaster } from "sonner";
import ThemeRegistry from "ThemeRegistry";

export const metadata: Metadata = {
  title: "HADA",
  description: "Hada ComportArte",
  // App interna con login: no debe aparecer en buscadores. Sin robots.txt
  // que bloquee, para que Google pueda leer este noindex y desindexarla.
  robots: { index: false, follow: false },
  // Ícono al agregar la app a la pantalla de inicio del iPhone (iOS no usa
  // los del manifest).
  icons: { apple: "/icon-apple-180x180.png" },
};

export const dynamic = "force-dynamic";

import { ApolloWrapper } from "@shared/libs/apollo-wrapper";
import QueryProvider from "@shared/components/QueryProvider";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Cada layout o página define su propio <main>. */}
        <ThemeRegistry options={{ key: "mui" }}>
          <QueryProvider>
            <ApolloWrapper>{children}</ApolloWrapper>
          </QueryProvider>
        </ThemeRegistry>
        {/* Debajo de la barra superior (64px; 56px en móvil): encima tapaban
            el menú de usuario y el botón Guardar de los diálogos de pantalla
            completa. */}
        <Toaster
          position="top-right"
          offset={{ top: 88 }}
          mobileOffset={{ top: 72 }}
          expand={true}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
