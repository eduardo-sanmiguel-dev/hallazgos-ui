import { constants } from "@constants";

interface RumEventLike {
  type: string;
  // Otros eventos traen `action` con otra forma (p. ej. solo el id).
  action?: { target?: { name?: string }; [key: string]: unknown };
}

/**
 * `beforeSend` del RUM: los trazos de una firma no son interacciones, se
 * descartan para que no marquen la sesión como "frustrada" (rage click).
 */
export const shouldSendRumEvent = (event: RumEventLike) =>
  !(
    event.type === "action" &&
    event.action?.target?.name === constants.rum.ignoredClickName
  );
