"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@mui/material";
import { TextField } from "@mui/material";
import { Box } from "@mui/material";

import { notify, isValidEmail } from "@shared/utils";
import { AuthService } from "@services";
import { constants } from "@constants";

const FormRestorePassword = () => {
  const [email, setEmail] = useState(
    process.env.NODE_ENV === constants.environments.development
      ? "eduardo-266@hotmail.com"
      : "",
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === constants.environments.development ? "123" : "",
  );
  const [passwordConfirm, setPasswordConfirm] = useState(
    process.env.NODE_ENV === constants.environments.development ? "123" : "",
  );

  const router = useRouter();
  // Token del enlace del correo (?token=...): el API lo exige.
  const token = useSearchParams().get("token") || "";

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async () => {
    const emailClear = email.trim();
    const passwordClear = password.trim();
    const passwordConfirmClear = passwordConfirm.trim();

    if (!emailClear) {
      notify("El correo electrónico es requerido");
      return;
    }

    if (!passwordClear) {
      notify("La contraseña es requerida");
      return;
    }

    if (passwordClear !== passwordConfirmClear) {
      notify("Las contraseñas no coinciden");
      return;
    }

    if (!isValidEmail(emailClear)) {
      notify("El correo electrónico no es válido");
      return;
    }

    setIsLoading(true);

    AuthService.loginRestorePassword({
      email,
      password,
      token,
    })
      .then(({ message }) => {
        notify(message, true);
        // El spinner sigue mientras navega al dashboard.
        router.push("/dashboard");
      })
      .catch(() => setIsLoading(false));
  };

  return (
    <Box sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        fullWidth
        label="Correo Electrónico"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        margin="normal"
        fullWidth
        label="Nueva contraseña"
        autoComplete="off"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        margin="normal"
        fullWidth
        label="Repetir contraseña"
        autoComplete="off"
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />
      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        onClick={login}
        loading={isLoading}
        loadingPosition="start"
        disabled={isLoading}
      >
        Restablecer contraseña y entrar
      </Button>
    </Box>
  );
};

export default FormRestorePassword;
