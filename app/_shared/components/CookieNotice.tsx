import { useState } from "react";

import { Button, Link, Paper, Stack, Typography } from "@mui/material";

import AppLink from "@shared/components/AppLink";
import { hasSeenCookieNotice, markCookieNoticeSeen } from "@shared/utils/cookieNotice";

// Solo informa: las cookies son la de sesión (necesaria) y la del monitoreo
// de observability.ts, que se mantiene para todos. Va por encima de la barra
// inferior del celular hasta que se cierra una vez.
export default function CookieNotice() {
  const [open, setOpen] = useState(() => !hasSeenCookieNotice());
  if (!open) return null;

  const close = () => {
    markCookieNoticeSeen();
    setOpen(false);
  };

  return (
    <Paper
      component="section"
      aria-label="Aviso de cookies"
      elevation={6}
      sx={(theme) => ({
        position: "fixed",
        zIndex: theme.zIndex.snackbar,
        left: { xs: 16, sm: 24 },
        right: { xs: 16, sm: "auto" },
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        maxWidth: { sm: 440 },
        p: 2,
      })}
    >
      <Stack spacing={1.5}>
        <Typography variant="body2">
          Usamos cookies necesarias para mantener tu sesión y para el monitoreo que nos ayuda a
          detectar y corregir errores. No usamos cookies de publicidad. Más información en la{" "}
          <Link component={AppLink} href="/privacy" onClick={close}>
            política de privacidad
          </Link>
          .
        </Typography>
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={close}
            data-dd-action-name="Aviso de cookies: entendido"
          >
            Entendido
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
