"use client";

import { MouseEvent } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@mui/material";
import { Link as MuiLink } from "@mui/material";
import { Typography } from "@mui/material";

import { breadcrumbTrail } from "./menu";

interface PageBreadcrumbsProps {
  // Última miga: la página actual ("Editar proceso").
  current: string;
  // Navegación propia (p. ej. confirmar antes de descartar lo capturado).
  onNavigate?: (href: string) => void;
}

// Ruta corta de un formulario o detalle (B2): "Configuración › Procesos ›
// Editar proceso". Sale del menú, así que los nombres son los mismos. Solo en
// tablet y escritorio: en celular ocupa espacio y el menú ya ubica.
export default function PageBreadcrumbs({
  current,
  onNavigate,
}: PageBreadcrumbsProps) {
  const pathname = usePathname();
  const trail = breadcrumbTrail(pathname);
  if (!trail) return null;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(trail.list.url);
  };

  return (
    <Breadcrumbs
      aria-label="Ruta de navegación"
      separator="›"
      sx={{ display: { xs: "none", sm: "flex" }, mb: 1, fontSize: "0.875rem" }}
    >
      {trail.parents.map((parent) => (
        <Typography key={parent} variant="body2" color="text.secondary">
          {parent}
        </Typography>
      ))}
      <MuiLink
        component={Link}
        href={trail.list.url}
        onClick={handleClick}
        underline="hover"
        variant="body2"
        sx={{ color: "text.brand" }}
      >
        {trail.list.title}
      </MuiLink>
      <Typography variant="body2" color="text.primary" aria-current="page">
        {current}
      </Typography>
    </Breadcrumbs>
  );
}
