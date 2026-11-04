import { ReactElement } from "react";

import { Box, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { primarySoftBackground, primaryTextColor } from "../../../../theme";

export interface GroupTabItem {
  title: string;
  icon: ReactElement;
  // Qué hay en la pestaña, en una frase (se oculta en celular).
  description: string;
}

interface Props {
  groups: GroupTabItem[];
  value: number;
  onChange: (index: number) => void;
}

/**
 * Grupos de indicadores como tarjetas seleccionables: ícono, nombre y qué
 * contiene. Antes eran pestañas de texto sobre el fondo gris y quien no
 * conocía la pantalla no veía que había más grupos. Siguen siendo pestañas
 * (`Tabs`): flechas del teclado, `role="tab"` y `aria-controls`.
 */
export default function GroupTabs({ groups, value, onChange }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        component="p"
        sx={{ color: "text.secondary", fontWeight: 600, mb: 1 }}
      >
        Elige qué analizar
      </Typography>
      <Tabs
        value={value}
        onChange={(_, next: number) => onChange(next)}
        aria-label="Grupos de indicadores EPP"
        variant="fullWidth"
        slotProps={{ indicator: { sx: { display: "none" } } }}
        sx={{
          minHeight: 0,
          // Sin recortar la sombra del enfoque ni el borde.
          overflow: "visible",
          "& .MuiTabs-scroller": { overflow: "visible !important" },
          "& .MuiTabs-list": { gap: { xs: 1, sm: 1.5 } },
        }}
      >
        {groups.map((group, index) => {
          const descriptionId = `epp-group-tab-${index}-description`;

          return (
            <Tab
              key={group.title}
              id={`epp-group-tab-${index}`}
              aria-controls={`epp-group-panel-${index}`}
              // El nombre es el título; la frase, su descripción.
              aria-label={group.title}
              aria-describedby={descriptionId}
              label={
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    gap: { xs: 0.5, sm: 1.5 },
                    width: "100%",
                    textAlign: { xs: "center", sm: "left" },
                  }}
                >
                  <Box
                    className="group-tab-icon"
                    aria-hidden
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: { xs: 36, sm: 44 },
                      height: { xs: 36, sm: 44 },
                      flexShrink: 0,
                      borderRadius: "50%",
                      "& svg": { fontSize: { xs: 20, sm: 24 } },
                    }}
                  >
                    {group.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      className="group-tab-title"
                      component="span"
                      sx={{
                        display: "block",
                        fontWeight: 700,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        lineHeight: 1.3,
                      }}
                    >
                      {group.title}
                    </Typography>
                    <Typography
                      id={descriptionId}
                      component="span"
                      variant="body2"
                      sx={{
                        display: { xs: "none", sm: "block" },
                        color: "text.secondary",
                        lineHeight: 1.35,
                      }}
                    >
                      {group.description}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={(theme) => ({
                flex: 1,
                minWidth: 0,
                maxWidth: "none",
                minHeight: { xs: 76, sm: 80 },
                px: { xs: 1, sm: 2 },
                py: 1.5,
                alignItems: "stretch",
                textTransform: "none",
                opacity: 1,
                color: "text.primary",
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[1],
                transition: theme.transitions.create(
                  ["border-color", "background-color", "box-shadow"],
                  { duration: theme.transitions.duration.shorter },
                ),
                "& .group-tab-icon": {
                  color: primaryTextColor(theme),
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  boxShadow: theme.shadows[3],
                },
                // Elegida: borde de 2 px (sin mover el contenido), fondo
                // verde tenue e ícono relleno.
                "&.Mui-selected": {
                  color: "text.primary",
                  borderColor: theme.palette.primary.main,
                  boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}, ${theme.shadows[2]}`,
                  backgroundColor: primarySoftBackground(theme),
                  "& .group-tab-title": { color: primaryTextColor(theme) },
                  "& .group-tab-icon": {
                    color: theme.palette.primary.contrastText,
                    backgroundColor: theme.palette.primary.main,
                  },
                },
              })}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
