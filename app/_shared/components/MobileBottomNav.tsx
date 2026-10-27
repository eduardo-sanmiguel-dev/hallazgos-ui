"use client";

import { ReactNode, useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Box } from "@mui/material";
import { ButtonBase } from "@mui/material";
import { Fab } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import EngineeringIcon from "@mui/icons-material/Engineering";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";

import { useUserSessionStore } from "@store";
import { useGembaWalkAccess } from "@hooks/useGembaWalkAccess";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import { canAccessPath, type RouteAccessContext } from "./menu";

// Alto de la barra (sin la zona segura de abajo). El botón central sobresale.
export const BOTTOM_NAV_HEIGHT = 64;

const SAFE_AREA_BOTTOM = "env(safe-area-inset-bottom, 0px)";

const NEW_EVIDENCE_PATH = "/hallazgos/form";

interface NavDestination {
  url: string;
  label: string;
  icon: ReactNode;
}

// Accesos posibles en orden de prioridad: se toman los primeros 3 que el
// usuario puede abrir (misma regla que el menú, `canAccessPath`). Junto con
// "Nuevo hallazgo" quedan como máximo 4.
const DESTINATIONS_BY_PRIORITY: NavDestination[] = [
  { url: "/hallazgos", label: "Hallazgos", icon: <ContentPasteSearchIcon /> },
  { url: "/gemba-walk", label: "Gemba Walk", icon: <DirectionsWalkIcon /> },
  { url: "/epp", label: "EPP", icon: <EngineeringIcon /> },
  {
    url: "/extinguisher-inspection",
    label: "Extintores",
    icon: <FireExtinguisherIcon />,
  },
  { url: "/dashboard", label: "Dashboard", icon: <SpaceDashboardIcon /> },
];

// Orden en pantalla, de izquierda a derecha.
const DISPLAY_ORDER = [
  "/dashboard",
  "/hallazgos",
  "/gemba-walk",
  "/epp",
  "/extinguisher-inspection",
];

const MAX_DESTINATIONS = 3;

export const bottomNavDestinations = (ctx: RouteAccessContext) =>
  DESTINATIONS_BY_PRIORITY.filter((item) => canAccessPath(item.url, ctx))
    .slice(0, MAX_DESTINATIONS)
    .sort((a, b) => DISPLAY_ORDER.indexOf(a.url) - DISPLAY_ORDER.indexOf(b.url));

// Formularios: la barra estorba (y el botón "Nuevo" no aplica).
const isFormPath = (pathname: string) => /\/form(\/|$)/.test(pathname);

const NON_TEXT_INPUTS = new Set([
  "checkbox",
  "radio",
  "file",
  "button",
  "submit",
  "reset",
  "range",
  "color",
  "image",
]);

const opensKeyboard = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable || element instanceof HTMLTextAreaElement) {
    return true;
  }
  return (
    element instanceof HTMLInputElement &&
    !NON_TEXT_INPUTS.has(element.type) &&
    !element.readOnly
  );
};

// Con el teclado abierto la barra se oculta: tapa el campo y deja poco
// espacio. Se detecta por el foco en un campo de texto (abre el teclado en
// celular) o porque el área visible se encogió.
function useKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;

    const update = () => {
      const shrunk = viewport
        ? window.innerHeight - viewport.height > 150
        : false;
      setIsOpen(opensKeyboard(document.activeElement) || shrunk);
    };

    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    viewport?.addEventListener("resize", update);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      viewport?.removeEventListener("resize", update);
    };
  }, []);

  return isOpen;
}

function NavItem({
  destination,
  selected,
}: {
  destination: NavDestination;
  selected: boolean;
}) {
  return (
    <ButtonBase
      component={Link}
      href={destination.url}
      aria-current={selected ? "page" : undefined}
      sx={(theme) => ({
        flex: 1,
        minWidth: 0,
        minHeight: 48,
        height: "100%",
        flexDirection: "column",
        gap: 0.25,
        borderRadius: `${theme.tokens.radius.md}px`,
        color: selected
          ? theme.palette.text.brand
          : theme.palette.text.secondary,
        "& .MuiSvgIcon-root": { fontSize: 24 },
      })}
    >
      {destination.icon}
      <Typography
        component="span"
        sx={{
          fontSize: "0.75rem",
          fontWeight: selected ? 700 : 500,
          lineHeight: 1.2,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {destination.label}
      </Typography>
    </ButtonBase>
  );
}

// Navegación inferior en celular (A8): accesos de campo según el rol y
// "Nuevo hallazgo" al centro como acción principal. Se oculta en
// formularios y con el teclado abierto; los diálogos (también a pantalla
// completa) quedan por encima y la cubren.
export default function MobileBottomNav() {
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const pathname = usePathname();
  const isKeyboardOpen = useKeyboardOpen();
  const isGembaWalkObserver = useGembaWalkAccess();

  const userId = useUserSessionStore((state) => state.id);
  const role = useUserSessionStore((state) => state.role);
  const email = useUserSessionStore((state) => state.email);

  const ctx: RouteAccessContext = {
    isAdmin: role === ROLE_ADMINISTRADOR,
    email,
    isGembaWalkObserver,
  };

  const canCreate = canAccessPath(NEW_EVIDENCE_PATH, ctx);
  const destinations = bottomNavDestinations(ctx);

  // Sin "Nuevo hallazgo" (p. ej. el usuario solo-HDS) no hay barra.
  const isVisible = isPhone && !!userId && canCreate && !isFormPath(pathname);

  if (!isVisible) return null;

  const half = Math.ceil(destinations.length / 2);
  const left = destinations.slice(0, half);
  const right = destinations.slice(half);
  const isSelected = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`);

  return (
    <>
      {/* Reserva el espacio de la barra al final del contenido. */}
      <Box
        aria-hidden
        sx={{
          height: `calc(${BOTTOM_NAV_HEIGHT + 16}px + ${SAFE_AREA_BOTTOM})`,
        }}
      />
      <Paper
        component="nav"
        aria-label="Accesos rápidos"
        elevation={0}
        square
        sx={(theme) => ({
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: `1px solid ${theme.palette.divider}`,
          pb: SAFE_AREA_BOTTOM,
          // Con el teclado abierto se esconde sin desmontar (sin saltos).
          ...(isKeyboardOpen && { display: "none" }),
        })}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 88px 1fr",
            alignItems: "center",
            height: BOTTOM_NAV_HEIGHT,
            px: 1,
          }}
        >
          <Box sx={{ display: "flex", height: "100%", py: 0.5 }}>
            {left.map((destination) => (
              <NavItem
                key={destination.url}
                destination={destination}
                selected={isSelected(destination.url)}
              />
            ))}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              alignSelf: "end",
              pb: 0.75,
            }}
          >
            <Fab
              component={Link}
              href={NEW_EVIDENCE_PATH}
              color="primary"
              aria-label="Nuevo hallazgo"
              sx={(theme) => ({
                // Sobresale de la barra: se reconoce como la acción principal.
                mt: -3.5,
                width: 60,
                height: 60,
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.45)}`,
                border: `4px solid ${theme.palette.background.paper}`,
              })}
            >
              <AddIcon sx={{ fontSize: 30 }} />
            </Fab>
            <Typography
              component="span"
              aria-hidden
              sx={{
                mt: 0.25,
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "text.brand",
                lineHeight: 1.2,
              }}
            >
              Nuevo
            </Typography>
          </Box>
          <Box sx={{ display: "flex", height: "100%", py: 0.5 }}>
            {right.map((destination) => (
              <NavItem
                key={destination.url}
                destination={destination}
                selected={isSelected(destination.url)}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </>
  );
}
