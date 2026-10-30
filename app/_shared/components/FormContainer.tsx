import { ReactNode } from "react";

import { Box } from "@mui/material";

// Ancho máximo de una pantalla de formulario, centrada (como Hallazgos,
// Gemba Walk e Inspección de extintores): en escritorio los campos no se
// estiran a toda la pantalla y el título queda alineado con las secciones.
export const FORM_MAX_WIDTH = 960;

export default function FormContainer({ children }: { children: ReactNode }) {
  return <Box sx={{ maxWidth: FORM_MAX_WIDTH, mx: "auto" }}>{children}</Box>;
}
