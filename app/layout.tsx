import type { Metadata } from "next";

import { Toaster } from "sonner";
import ThemeRegistry from "ThemeRegistry";
//import DatadogRumInit from "@components/DatadogRumInit";

export const metadata: Metadata = {
  title: "HADA",
  description: "Hada ComportArte",
};

export const dynamic = "force-dynamic";

import { ApolloWrapper } from "@shared/libs/apollo-wrapper";

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
        {/* <DatadogRumInit /> */}
        <ThemeRegistry options={{ key: "mui" }}>
          <ApolloWrapper>{children}</ApolloWrapper>
        </ThemeRegistry>
        <Toaster position="top-right" expand={true} richColors closeButton />
      </body>
    </html>
  );
}
