"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@mui/material";
import { TextField } from "@mui/material";
import { Box } from "@mui/material";
import { IconButton } from "@mui/material";
import { OutlinedInput } from "@mui/material";
import { InputLabel } from "@mui/material";
import { InputAdornment } from "@mui/material";
import { FormControl } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link } from "@mui/material";
import { Grid } from "@mui/material";

import { AuthService } from "@services";
import { constants } from "@constants";
import { notify, isValidEmail } from "@shared/utils";
import { NEXT_PARAM, safeNextPath } from "@shared/utils/nextPath";

interface Props {
  setForgotPassword: (value: boolean) => void;
}

const FormLogin = ({ setForgotPassword }: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const [email, setEmail] = useState(
    process.env.NODE_ENV === constants.environments.development
      ? "eduardo-266@hotmail.com"
      : "",
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === constants.environments.development ? "12345" : "",
  );

  const router = useRouter();
  // Ruta pedida antes de iniciar sesión (enlace de un correo); si no, el
  // dashboard.
  const nextPath = safeNextPath(useSearchParams().get(NEXT_PARAM));

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: ({ message }) => {
      notify(message, true);
      router.push(nextPath ?? "/dashboard");
    },
  });
  // El spinner sigue mientras navega.
  const isLoading = loginMutation.isPending || loginMutation.isSuccess;

  const login = async () => {
    const emailClear = email.trim();
    const passwordClear = password.trim();

    if (!emailClear) {
      notify("El correo electrónico es requerido");
      return;
    }

    if (!passwordClear) {
      notify("La contraseña es requerida");
      return;
    }

    if (!isValidEmail(emailClear)) {
      notify("El correo electrónico no es válido");
      return;
    }

    loginMutation.mutate({ email, password });
  };

  // El margen negativo compensa el espacio transparente bajo el logo, que
  // crece con su ancho (más chico en celular).
  return (
    <Box sx={{ mt: { xs: -6, sm: -8 } }}>
      <TextField
        margin="normal"
        fullWidth
        label="Correo Electrónico"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FormControl sx={{ width: "100%" }} variant="outlined">
        <InputLabel htmlFor="outlined-adornment-password">
          Contraseña
        </InputLabel>
        <OutlinedInput
          id="outlined-adornment-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={
                  showPassword ? "hide the password" : "display the password"
                }
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                onMouseUp={handleMouseUpPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
          label="Password"
        />
      </FormControl>
      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        onClick={login}
        loading={isLoading}
        loadingPosition="start"
        disabled={isLoading}
      >
        Iniciar
      </Button>
      <Grid container>
        <Grid size="grow">
          <Link
            variant="body2"
            onClick={() => setForgotPassword(true)}
            sx={{ cursor: "pointer" }}
          >
            ¿Has olvidado tu contraseña?
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FormLogin;
