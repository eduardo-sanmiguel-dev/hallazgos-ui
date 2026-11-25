import axiosWrapper from "./axiosWrapper";
import type { MailPreferences } from "@interfaces";

// Enlace de baja de los correos. Con token (correos anteriores): público, el
// token identifica al usuario y solo permite ver o cambiar los avisos de la
// planta; POST también para consultar, así el token no queda en logs de
// acceso. Sin token (correos actuales, un mismo correo va a varios): con la
// sesión iniciada, en /me.
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

const findMine = async () => {
  const { data } = await api.get<MailPreferences>("/me");
  return data;
};

const updateMine = async (plantNotifications: boolean) => {
  const { data } = await api.patch<MailPreferences>("/me", { plantNotifications });
  return data;
};

export const MailPreferencesService = {
  lookup,
  update,
  findMine,
  updateMine,
};
