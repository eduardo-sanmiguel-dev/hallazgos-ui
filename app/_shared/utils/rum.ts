import { constants } from "@constants";

interface RumEventLike {
  type: string;
  // Otros eventos traen `action` con otra forma (p. ej. solo el id).
  action?: { target?: { name?: string }; [key: string]: unknown };
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

/**
 * `beforeSend` del RUM: los trazos de una firma no son interacciones, se
 * descartan para que no marquen la sesión como "frustrada" (rage click).
 */
export const shouldSendRumEvent = (event: RumEventLike) =>
  !(
    event.type === "action" &&
    event.action?.target?.name === constants.rum.ignoredClickName
  );
