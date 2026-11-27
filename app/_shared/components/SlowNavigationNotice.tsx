import { useEffect, useState } from "react";

import { LinearProgress, Paper, Typography } from "@mui/material";
import { useNavigation } from "react-router-dom";

// Con señal débil, abrir una pantalla puede tardar (descargar su JS, verificar
// la sesión, reintentos de moduleRetry) y mientras tanto la pantalla anterior
// se queda quieta. Pasado este tiempo se avisa que sigue cargando.
export const SLOW_NAVIGATION_MS = 4_000;

/** Aviso fijo arriba mientras una navegación tarda más de SLOW_NAVIGATION_MS. */
export default function SlowNavigationNotice() {
  const navigation = useNavigation();
  const pendingKey = navigation.state === "idle" ? undefined : navigation.location?.key;
  // Navegación (por su key) que ya superó el tiempo; así el aviso no se
  // arrastra a la siguiente navegación.
  const [slowKey, setSlowKey] = useState<string>();

  useEffect(() => {
    if (!pendingKey) return;
    const timer = setTimeout(() => setSlowKey(pendingKey), SLOW_NAVIGATION_MS);
    return () => clearTimeout(timer);
  }, [pendingKey]);

  if (!pendingKey || slowKey !== pendingKey) return null;

  return (
    <Paper
      component="output"
      aria-live="polite"
      elevation={6}
      sx={(theme) => ({
        position: "fixed",
        zIndex: theme.zIndex.snackbar,
        top: "calc(16px + env(safe-area-inset-top, 0px))",
        left: { xs: 16, sm: "50%" },
        right: { xs: 16, sm: "auto" },
        transform: { sm: "translateX(-50%)" },
        maxWidth: { sm: 440 },
        overflow: "hidden",
      })}
    >
      <Typography variant="body2" sx={{ px: 2, py: 1.5 }}>
        La conexión está lenta. Seguimos abriendo la página…
      </Typography>
      <LinearProgress aria-label="Abriendo la página" />
    </Paper>
  );
}
