"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { DialogActions } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogContentText } from "@mui/material";
import { DialogTitle } from "@mui/material";

import { AuthService, SESSION_ENDED_EVENT } from "@services";
import { useUserSessionStore } from "@store";
import { listUserDrafts } from "@shared/drafts/draftStore";

// Sesión terminada (token vencido, cookie borrada o usuario desactivado):
// antes se mandaba al login sin decir nada y se perdía lo capturado. Ahora se
// avisa primero y, en los formularios con borrador local (hallazgos: crear,
// iniciar y cerrar), se indica que lo capturado quedó guardado. No se cierra
// con Escape ni tocando fuera: la única salida es iniciar sesión.
export default function SessionEndedDialog() {
  const [open, setOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [hasDrafts, setHasDrafts] = useState(false);
  const userId = useUserSessionStore((state) => state.id);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const show = () => {
      setOpen(true);
      // Los borradores se conservan al vencer la sesión (no al cerrarla a
      // propósito): se avisa que lo capturado no se perdió.
      if (userId) {
        listUserDrafts(userId).then((drafts) =>
          setHasDrafts(drafts.length > 0),
        );
      }
    };
    window.addEventListener(SESSION_ENDED_EVENT, show);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, show);
  }, [userId]);

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
          {hasDrafts
            ? "Lo que capturaste quedó guardado como borrador en este dispositivo: podrás recuperarlo al volver a iniciar sesión."
            : "Lo que capturaste en esta pantalla no se guardó."}
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
