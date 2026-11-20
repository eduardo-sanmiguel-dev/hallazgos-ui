import axiosWrapper from "./axiosWrapper";
import { getQueryClient } from "@shared/libs/queryClient";
import { useUserSessionStore } from "@store";

function clearSession() {
  getQueryClient().clear();
  useUserSessionStore.getState().resetSession();
}

interface PayloadLogin {
  email: string;
  password: string;
}

// El API exige el token del enlace del correo de recuperación.
interface PayloadRestorePassword extends PayloadLogin {
  token: string;
}

const api = axiosWrapper({
  baseURL: "/auth",
});

const login = async (payload: PayloadLogin) => {
  const { data } = await api.post<{ message: string }>("/login", payload);
  clearSession();
  return data;
};

const loginRestorePassword = async (payload: PayloadRestorePassword) => {
  const { data } = await api.post<{ message: string }>("/login-restore-password", payload);
  clearSession();
  return data;
};

const forgotPassword = async (email: string) => {
  const { data } = await api.post<{ message: string }>("/forgot-password", {
    email,
  });
  return data;
};

// Quien cierra sesión recarga la app (HeaderUserMenu, SessionEndedDialog):
// vaciar aquí la caché con la pantalla montada la hacía pedir otra vez sus
// datos, ya sin sesión.
const logout = async () => {
  const { data } = await api.post<{ message: string }>("/logout");
  return data;
};

// Cierra la sesión en todos los dispositivos del usuario (este incluido): el
// API invalida todos sus tokens.
const logoutAll = async () => {
  const { data } = await api.post<{ message: string }>("/logout-all");
  return data;
};

export const AuthService = {
  login,
  logout,
  logoutAll,
  forgotPassword,
  loginRestorePassword,
};
