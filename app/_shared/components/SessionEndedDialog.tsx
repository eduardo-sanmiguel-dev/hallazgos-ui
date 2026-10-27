"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { DialogActions } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogContentText } from "@mui/material";
import { DialogTitle } from "@mui/material";

import { AuthService, SESSION_ENDED_EVENT } from "@services";

// Sesión terminada (token vencido, cookie borrada o usuario desactivado):
// antes se mandaba al login sin decir nada y se perdía lo capturado. Ahora se
// avisa primero; el rescate de lo capturado llega con el borrador local
// (Fase 4). No se cierra con Escape ni tocando fuera: la única salida es
// iniciar sesión.
export default function SessionEndedDialog() {
  const [open, setOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(SESSION_ENDED_EVENT, show);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, show);
  }, []);

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>Tu sesión terminó</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>
          Tu sesión terminó. Inicia sesión de nuevo.
        </DialogContentText>
        <DialogContentText sx={{ mt: 1.5 }}>
          Lo que capturaste en esta pantalla no se guardó.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          autoFocus
          disabled={isLeaving}
          onClick={() => {
            setIsLeaving(true);
            // Primero se borra la cookie: con un usuario desactivado el token
            // sigue siendo válido y "/" lo mandaría de vuelta al dashboard.
            AuthService.logout()
              .catch(() => undefined)
              .finally(() => window.location.replace("/"));
          }}
        >
          Iniciar sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}
