import { useState } from "react";
import { Link } from "@mui/material";
import { Typography } from "@mui/material";

import AppLink from "@shared/components/AppLink";

export default function Copyright(props: any) {
  const [year] = useState(() => new Date().getFullYear());
  return (
    <Typography
      variant="body2"
      align="center"
      {...props}
      sx={{
        color: (theme) =>
          theme.palette.mode === "light" ? theme.palette.common.black : theme.palette.common.white,
        mt: 2,
      }}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://grupohada.com" target="_blank">
        Hada international
      </Link>{" "}
      {year}
      {". · "}
      {/* Públicas: se pueden abrir desde el login, antes de iniciar sesión. */}
      <Link
        color="inherit"
        component={AppLink}
        href="/privacy"
        data-dd-action-name="Ver política de privacidad"
      >
        Política de privacidad
      </Link>
      {" · "}
      <Link
        color="inherit"
        component={AppLink}
        href="/terms"
        data-dd-action-name="Ver términos y condiciones"
      >
        Términos y condiciones
      </Link>
    </Typography>
  );
}
