import { ReactNode, useId, useState } from "react";

import type { SxProps, Theme } from "@mui/material";

import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { ButtonBase } from "@mui/material";
import { Chip } from "@mui/material";
import { Collapse } from "@mui/material";
import { Fade } from "@mui/material";
import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";

// Filtro aplicado, para el resumen visible con el panel cerrado.
export interface ActiveFilter {
  key: string;
  // Nombre del campo, p. ej. "Planta".
  label: string;
  // Valor legible, p. ej. "Planta Norte".
  value: string;
  // Quita solo este filtro; sin él, el chip no se puede eliminar
  // (p. ej. un campo obligatorio).
  onRemove?: () => void;
}

interface FilterBarProps {
  // Número de registros que cumplen los filtros.
  count?: number;
  // Filtros aplicados; se resumen como chips cuando el panel está cerrado.
  activeFilters?: ActiveFilter[];
  // Restablece todos los filtros desde el resumen.
  onClearAll?: () => void;
  // Acciones siempre visibles a la derecha del encabezado.
  actions?: ReactNode;
  sx?: SxProps<Theme>;
  // Campos de filtro, cada uno envuelto en un <Grid size={...}>.
  children: ReactNode;
}

const countLabel = (count: number) =>
  `${count} ${count === 1 ? "registro" : "registros"}`;

const activeLabel = (count: number) =>
  `${count} ${count === 1 ? "filtro activo" : "filtros activos"}`;

const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

// Lista de filtros activos sin los vacíos: `compactFilters(!!x && {...})`.
export const compactFilters = (
  ...filters: Array<ActiveFilter | false | null | undefined>
) => filters.filter((filter): filter is ActiveFilter => !!filter);

// "A, B +3": evita chips demasiado largos con selecciones múltiples.
// Sin nombres (catálogo aún cargando) muestra "…".
export const joinNames = (names: string[]) => {
  if (!names.length) return "…";
  return names.length <= 2
    ? names.join(", ")
    : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
};

// Nombres de las opciones elegidas (por id), listos para el chip.
export const optionLabel = (
  ids: string | string[],
  options: ReadonlyArray<{ id: number | string; name: string }>,
) => {
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  return joinNames(
    options
      .filter((option) => idSet.has(String(option.id)))
      .map((option) => option.name),
  );
};

// YYYY-MM-DD → DD/MM/YYYY.
export const formatDateDMY = (value: string) => {
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
};

// Contenedor de filtros de un listado. Inicia cerrado; con el panel cerrado
// los filtros aplicados se resumen como chips para no perder el contexto.
export default function FilterBar({
  count,
  activeFilters = [],
  onClearAll,
  actions,
  sx,
  children,
}: FilterBarProps) {
  const titleId = useId();
  const contentId = useId();
  const [expanded, setExpanded] = useState(false);

  const activeCount = activeFilters.length;
  const hasActive = activeCount > 0;
  const canClearAll = !!onClearAll && activeFilters.some((f) => f.onRemove);

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={[
        {
          mb: 2,
          overflow: "hidden",
          transition: (theme) =>
            theme.transitions.create(["border-color", "box-shadow"]),
          ...(hasActive && {
            borderColor: "primary.main",
            boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`,
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
        <Typography
          variant="subtitle2"
          component="h2"
          sx={{ m: 0, flex: 1, minWidth: 0 }}
        >
          <ButtonBase
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((prev) => !prev)}
            sx={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 1,
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              font: "inherit",
              color: "text.primary",
              textAlign: "left",
              "&:hover": { bgcolor: "action.hover" },
              "&.Mui-focusVisible": { bgcolor: "action.focus" },
            }}
          >
            <FilterListIcon
              fontSize="small"
              aria-hidden
              sx={{ color: hasActive ? "primary.main" : "text.secondary" }}
            />
            <span id={titleId}>Filtros</span>
            {hasActive && (
              <Box
                component="span"
                sx={{
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  borderRadius: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                <span aria-hidden>{activeCount}</span>
                <Box component="span" sx={visuallyHidden}>
                  {activeLabel(activeCount)}
                </Box>
              </Box>
            )}
            {!expanded && !hasActive && (
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: { xs: "none", sm: "inline" },
                }}
              >
                · Sin filtros aplicados
              </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            {count !== undefined && (
              <Chip component="span" size="small" label={countLabel(count)} />
            )}
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "text.secondary",
                display: { xs: "none", sm: "inline" },
              }}
            >
              {expanded ? "Ocultar" : "Mostrar"}
            </Typography>
            <ExpandMoreIcon
              aria-hidden
              sx={{
                color: "text.secondary",
                transform: expanded ? "rotate(180deg)" : "none",
                transition: (theme) => theme.transitions.create("transform"),
              }}
            />
          </ButtonBase>
        </Typography>
        {actions}
      </Box>

      {!expanded && hasActive && (
        <Fade in>
          <Box
            role="group"
            aria-label="Filtros aplicados"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              px: { xs: 2, sm: 2.5 },
              pb: 1.5,
            }}
          >
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                size="small"
                color="primary"
                variant="outlined"
                title={`${filter.label}: ${filter.value}`}
                label={
                  <>
                    <Box component="span" sx={{ fontWeight: 400 }}>
                      {filter.label}:
                    </Box>{" "}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {filter.value}
                    </Box>
                  </>
                }
                onDelete={filter.onRemove}
                deleteIcon={
                  <CancelIcon titleAccess={`Quitar filtro ${filter.label}`} />
                }
                sx={{ maxWidth: "100%" }}
              />
            ))}
            {canClearAll && (
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={onClearAll}
                sx={{ textTransform: "none" }}
              >
                Limpiar todo
              </Button>
            )}
          </Box>
        </Fade>
      )}

      <Collapse in={expanded} id={contentId}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: { xs: 2, sm: 2.5 }, pt: 1 }}>
          <Grid container spacing={2}>
            {children}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
