import type { ReactNode } from "react";
import { Toaster } from "sonner";
import ThemeRegistry from "./ThemeRegistry";
import QueryProvider from "@shared/components/QueryProvider";
import DeploymentUpdates from "@shared/components/DeploymentUpdates";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeRegistry options={{ key: "mui" }}>
      <QueryProvider>
        <DeploymentUpdates />
        {children}
      </QueryProvider>
      <Toaster
        position="top-right"
        offset={{ top: 88 }}
        mobileOffset={{ top: 72 }}
        expand
        richColors
        closeButton
      />
    </ThemeRegistry>
  );
}
