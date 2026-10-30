"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { Box } from "@mui/material";

import { AuthService } from "@services";
import { notify, isValidEmail } from "@shared/utils";
import { constants } from "@constants";

interface Props {
  setForgotPassword: (value: boolean) => void;
}

const FormForgotPassword = ({ setForgotPassword }: Props) => {
  const forgotMutation = useMutation({
    mutationFn: AuthService.forgotPassword,
    onSuccess: ({ message }) => {
      notify(message, true);
      setForgotPassword(false);
    },
  });
  const isLoading = forgotMutation.isPending;
  const [email, setEmail] = useState(
    process.env.NODE_ENV === constants.environments.development
      ? "eduardo-266@hotmail.com"
      : "",
  );

  const login = async () => {
    const emailClear = email.trim();

    if (!emailClear) {
      notify("El correo electrónico es requerido");
      return;
    }

    if (!isValidEmail(emailClear)) {
      notify("El correo electrónico no es válido");
      return;
    }

    forgotMutation.mutate(email);
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
      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        onClick={login}
        loading={isLoading}
        loadingPosition="start"
        disabled={isLoading}
      >
        Enviar correo de recuperación
      </Button>
    </Box>
  );
};

export default FormForgotPassword;
