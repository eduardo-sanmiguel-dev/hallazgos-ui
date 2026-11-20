import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import ThemeRegistry from "./ThemeRegistry";
import QueryProvider from "@shared/components/QueryProvider";
import DeploymentUpdates from "@shared/components/DeploymentUpdates";
import { notify } from "@shared/utils";
import { takeLogoutNotice } from "@shared/utils/logoutNotice";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// "Sesión cerrada…": se sale recargando la app y el aviso se muestra al
// volver a montarla, en la pantalla a la que llegue. Va después del Toaster
// para que este ya esté escuchando.
function PendingLogoutNotice() {
  useEffect(() => {
    const notice = takeLogoutNotice();
    if (notice) notify(notice, true);
  }, []);
  return null;
}

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
      <PendingLogoutNotice />
    </ThemeRegistry>
  );
}
