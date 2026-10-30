"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { Fab } from "@mui/material";
import { Zoom } from "@mui/material";
import { useScrollTrigger } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import {
  BOTTOM_NAV_HEIGHT,
  isFormPath,
  useBottomNavVisible,
} from "./MobileBottomNav";

// Desplazamiento (px) a partir del cual vale la pena ofrecer volver arriba.
export const SCROLL_TOP_THRESHOLD = 400;

const SAFE_AREA_BOTTOM = "env(safe-area-inset-bottom, 0px)";

// "Volver arriba" en todo el sistema (antes solo en el dashboard y siempre
// visible). Aparece al bajar en el contenido (`main#contenido`, que es el que
// hace scroll, no la ventana). En formularios no: la barra fija de acciones
// ocupa esa esquina. En celular va por encima de la navegación inferior.
export default function ScrollTopButton() {
  const pathname = usePathname();
  const isBottomNavVisible = useBottomNavVisible();
  const [target, setTarget] = useState<HTMLElement | undefined>();

  useEffect(() => {
    setTarget(document.getElementById("contenido") ?? undefined);
  }, []);

  const scrolled = useScrollTrigger({
    target,
    disableHysteresis: true,
    threshold: SCROLL_TOP_THRESHOLD,
  });

  if (isFormPath(pathname)) return null;

  const handleClick = () => {
    target?.scrollTo({ top: 0, behavior: "smooth" });
    // El botón desaparece: el foco pasa al contenido y no se pierde.
    target?.focus({ preventScroll: true });
  };

  const margin = isBottomNavVisible ? BOTTOM_NAV_HEIGHT + 16 : 16;

  return (
    <Zoom in={!!target && scrolled}>
      <Fab
        color="primary"
        size="medium"
        aria-label="Volver arriba"
        onClick={handleClick}
        sx={{
          position: "fixed",
          right: { xs: 16, sm: 24 },
          // Por encima de los botones del sistema (viewport-fit=cover).
          bottom: {
            xs: `calc(${margin}px + ${SAFE_AREA_BOTTOM})`,
            sm: `calc(24px + ${SAFE_AREA_BOTTOM})`,
          },
          // Bajo los diálogos y menús, que lo cubren.
          zIndex: (theme) => theme.zIndex.speedDial,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
}
