"use client";

import { useEffect, useId, useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { DialogActions } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogContentText } from "@mui/material";
import { DialogTitle } from "@mui/material";

import { AuthService, SESSION_ENDED_EVENT } from "@services";
import { useUserSessionStore } from "@store";
import { allowUnload } from "@hooks/useBeforeUnload";
import {
  isDraftStorageAvailable,
  listUserDrafts,
} from "@shared/drafts/draftStore";

const DRAFTS_UNAVAILABLE_SESSION =
  "Este navegador no permite guardar borradores (por ejemplo, en modo privado): lo que capturaste en esta pantalla se perderá.";

// Sesión terminada (token vencido, cookie borrada o usuario desactivado):
// antes se mandaba al login sin decir nada y se perdía lo capturado. Ahora se
// avisa primero y, en los formularios con borrador local (hallazgos: crear,
// iniciar y cerrar; recorrido de Gemba Walk), se indica que lo capturado
// quedó guardado, o que se perderá si el navegador no guarda borradores. No se cierra
// con Escape ni tocando fuera: la única salida es iniciar sesión.
export default function SessionEndedDialog() {
  const [open, setOpen] = useState(false);
  // Primero se borra la cookie: con un usuario desactivado el token sigue
  // siendo válido y "/" lo mandaría de vuelta al dashboard. Falle o no, sale.
  const logoutMutation = useMutation({
    mutationFn: AuthService.logout,
    onSettled: () => window.location.replace("/"),
  });
  // Ya va de salida (también si falló: está navegando).
  const isLeaving = !logoutMutation.isIdle;
  const [drafts, setDrafts] = useState<"saved" | "none" | "unavailable">(
    "none",
  );
  const userId = useUserSessionStore((state) => state.id);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const show = () => {
      setOpen(true);
      // Los borradores se conservan al vencer la sesión (no al cerrarla a
      // propósito): se avisa que lo capturado no se perdió. Sin almacén de
      // borradores (modo privado), que se perderá.
      isDraftStorageAvailable().then(async (available) => {
        if (!available) return setDrafts("unavailable");
        if (!userId) return;
        const saved = await listUserDrafts(userId);
        setDrafts(saved.length > 0 ? "saved" : "none");
      });
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
          {
            {
              saved:
                "Lo que capturaste quedó guardado como borrador en este dispositivo: podrás recuperarlo al volver a iniciar sesión.",
              none: "Lo que capturaste en esta pantalla no se guardó.",
              unavailable: DRAFTS_UNAVAILABLE_SESSION,
            }[drafts]
          }
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          autoFocus
          disabled={isLeaving}
          onClick={() => {
            // Este diálogo ya dijo qué pasa con lo capturado: el aviso nativo
            // de "salir de la página" sobraría.
            allowUnload();
            logoutMutation.mutate();
          }}
        >
          Iniciar sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}
