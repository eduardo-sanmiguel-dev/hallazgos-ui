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

const logout = async () => {
  const { data } = await api.post<{ message: string }>("/logout");
  clearSession();
  return data;
};

export const AuthService = {
  login,
  logout,
  forgotPassword,
  loginRestorePassword,
};
