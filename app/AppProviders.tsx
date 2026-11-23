import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import ThemeRegistry from "./ThemeRegistry";
import { toastColorsStyle } from "@shared/utils/toastColors";
import QueryProvider from "@shared/components/QueryProvider";
import DeploymentUpdates from "@shared/components/DeploymentUpdates";
import { notify } from "@shared/utils";
import { takeLogoutNotice } from "@shared/utils/logoutNotice";
// Roboto alojada con la app (sin Google Fonts). Solo los grosores que usa:
// 400 (texto), 500 (los medium de MUI) y 700 (negritas; lo que antes pedía
// 600 u 800 ya se veía en 700 porque esos archivos no se cargaban). Solo
// latín y latín extendido: el español y nombres con acentos poco comunes;
// cirílico, griego y vietnamita no se usan.
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-ext-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-ext-500.css";
import "@fontsource/roboto/latin-700.css";
import "@fontsource/roboto/latin-ext-700.css";

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
        // Textos de colores con contraste AA (ver toastColors).
        style={toastColorsStyle}
      />
      <PendingLogoutNotice />
    </ThemeRegistry>
  );
}
