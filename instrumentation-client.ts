// Real User Monitoring de OpenObserve: sesiones, errores del navegador, Web
// Vitals, llamadas a la API y grabación de sesiones. Next carga este archivo
// en el navegador antes de que la app sea interactiva. Solo se activa en
// producción con NEXT_PUBLIC_OPENOBSERVE_* definidas.
import { openobserveLogs } from "@openobserve/browser-logs";
import { openobserveRum } from "@openobserve/browser-rum";

import { useUserSessionStore } from "@store";

const site = process.env.NEXT_PUBLIC_OPENOBSERVE_SITE;
const clientToken = process.env.NEXT_PUBLIC_OPENOBSERVE_CLIENT_TOKEN;
const organizationIdentifier =
  process.env.NEXT_PUBLIC_OPENOBSERVE_ORG || "default";
const apiOrigin = process.env.NEXT_PUBLIC_URL_API_RAW;

const common = {
  clientToken: clientToken ?? "",
  site,
  organizationIdentifier,
  service: "ui-comportarte",
  env: "production",
  apiVersion: "v1",
  insecureHTTP: false,
};

// Rastreadores (Googlebot, Bingbot...), Lighthouse y navegadores
// automatizados ejecutan el JS y aparecían como sesiones "rebotadas" sin
// usuario; no se monitorean para que las métricas sean solo de personas.
const isBot =
  typeof navigator !== "undefined" &&
  (navigator.webdriver ||
    /bot|crawl|spider|slurp|lighthouse|headlesschrome|google-inspectiontool|facebookexternalhit/i.test(
      navigator.userAgent,
    ));

if (process.env.NODE_ENV === "production" && site && clientToken && !isBot) {
  // Un fallo del monitoreo nunca debe impedir que la app cargue.
  try {
    openobserveRum.init({
      ...common,
      applicationId: "comportarte-ui",
      sessionSampleRate: 100,
      // Graba todas las sesiones, sin enmascarar textos ni campos.
      sessionReplaySampleRate: 100,
      defaultPrivacyLevel: "allow",
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      // Enlaza cada llamada a la API con su traza del servidor.
      ...(apiOrigin && {
        allowedTracingUrls: [
          {
            match: (url: string) => url.startsWith(apiOrigin),
            propagatorTypes: ["tracecontext"],
          },
        ],
        traceSampleRate: 100,
      }),
    });

    openobserveRum.startSessionReplayRecording();

    openobserveLogs.init({ ...common, forwardErrorsToLogs: true });

    // Cada sesión queda asociada al usuario que inició sesión.
    const identify = ({
      id,
      name,
      email,
    }: {
      id: number;
      name: string;
      email: string;
    }) => {
      if (id) openobserveRum.setUser({ id: String(id), name, email });
      else openobserveRum.clearUser();
    };
    identify(useUserSessionStore.getState());
    useUserSessionStore.subscribe((state, previous) => {
      if (state.id !== previous.id) identify(state);
    });
  } catch (error) {
    console.error("No se pudo iniciar el monitoreo de OpenObserve", error);
  }
}
