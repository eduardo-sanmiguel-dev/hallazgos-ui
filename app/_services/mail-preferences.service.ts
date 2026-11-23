import axiosWrapper from "./axiosWrapper";
import type { MailPreferences } from "@interfaces";

// Enlace de baja de los correos: público (sin sesión). El token del enlace
// identifica al usuario y solo permite ver o cambiar los avisos de la planta.
// POST también para consultar: así el token no queda en logs de acceso.
const api = axiosWrapper({
  baseURL: "/mail-preferences",
});

const lookup = async (unsubscribeToken: string) => {
  const { data } = await api.post<MailPreferences>("/lookup", { unsubscribeToken });
  return data;
};

const update = async (unsubscribeToken: string, plantNotifications: boolean) => {
  const { data } = await api.post<MailPreferences>("", {
    unsubscribeToken,
    plantNotifications,
  });
  return data;
};

export const MailPreferencesService = {
  lookup,
  update,
};
