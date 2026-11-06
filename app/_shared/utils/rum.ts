import { constants } from "@constants";
import { contextualActionName, rumModule } from "./rumActionNames";

interface RumEventLike {
  type: string;
  // Otros eventos traen `action` con otra forma (p. ej. solo el id).
  action?: { target?: { name?: string }; [key: string]: unknown };
  view?: { url?: string };
  context?: Record<string, unknown>;
}

interface NavigatorLike {
  userAgent: string;
  webdriver?: boolean;
  userAgentData?: { brands?: { brand: string }[] };
}

const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|lighthouse|headlesschrome|google-inspectiontool|facebookexternalhit/i;

/**
 * Rastreadores (Googlebot, Bingbot...), Lighthouse y navegadores
 * automatizados ejecutan el JS y aparecían como sesiones "rebotadas" sin
 * usuario; no se monitorean para que las métricas sean solo de personas.
 * Algunos bots disfrazan `userAgent` pero no las "brands" de Client Hints,
 * donde Chrome headless se sigue reportando como "HeadlessChrome".
 */
export const isBotNavigator = (nav: NavigatorLike) =>
  !!nav.webdriver ||
  BOT_USER_AGENT.test(nav.userAgent) ||
  !!nav.userAgentData?.brands?.some(({ brand }) => /headless/i.test(brand));

const LOCAL_HOSTNAME =
  /^(localhost|.*\.localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|::1|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2})$/i;

/**
 * Nada de una máquina local llega a OpenObserve: ni `next start` con
 * variables de producción en localhost, ni al abrir la app desde otro
 * equipo de la red (192.168.x.x, 10.x.x.x, 172.16-31.x.x).
 */
export const isLocalHostname = (hostname: string) => LOCAL_HOSTNAME.test(hostname);

/**
 * `beforeSend` del RUM: los trazos de una firma no son interacciones, se
 * descartan para que no marquen la sesión como "frustrada" (rage click).
 */
export const shouldSendRumEvent = (event: RumEventLike, context?: unknown) => {
  if (event.type !== "action") return true;
  const name = event.action?.target?.name;
  if (name === constants.rum.ignoredClickName) return false;
  if (event.action?.type === "custom") return true;
  // Keep meaningful dead/rage clicks on controls, not clicks on page whitespace.
  const target = (context as { events?: Event[] } | undefined)?.events?.[0]?.target;
  const element = typeof Element !== "undefined" && target instanceof Element ? target : undefined;
  const control = element?.closest(
    'button, a, input, textarea, select, label, summary, [role="button"], [role="link"], [role="tab"], [role="option"], [role="combobox"], [role="checkbox"], [role="switch"], [tabindex]:not([tabindex="-1"]), [data-dd-action-name], [data-rum-action], .highcharts-point, .fc-event, .fc-daygrid-day',
  );
  if (event.action?.type === "click" && element && !control) return false;
  // Clickable rows/maps must not override nested buttons: a row's "Eliminar"
  // is a different action from "Ver detalle".
  const actionName = control?.getAttribute("data-rum-action") ?? name;
  if (actionName && event.action?.target && event.view?.url) {
    const surface = element?.closest("[data-rum-scope]")?.getAttribute("data-rum-scope");
    event.action.target.name = contextualActionName(
      surface ? `${surface} · ${actionName}` : actionName,
      event.view.url,
    );
    event.context = {
      ...event.context,
      ui_module: rumModule(event.view.url),
      ...(surface && { ui_surface: surface }),
    };
  }
  return true;
};
