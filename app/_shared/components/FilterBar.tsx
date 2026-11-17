import { ReactNode, Ref, useId, useRef, useState } from "react";

import type { SxProps, Theme } from "@mui/material";

import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { ButtonBase } from "@mui/material";
import { Chip } from "@mui/material";
import { Collapse } from "@mui/material";
import { Divider } from "@mui/material";
import { Fade } from "@mui/material";
import { Grid } from "@mui/material";
import { MenuItem } from "@mui/material";
import { Paper } from "@mui/material";
import { TextField } from "@mui/material";
import { ToggleButton } from "@mui/material";
import { ToggleButtonGroup } from "@mui/material";
import { Typography } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SwapVertIcon from "@mui/icons-material/SwapVert";

import type { TableSortControl } from "@hooks/useTableSort";
import {
  directionLabel,
  findSortOption,
  naturalOrder,
  sortSummary,
  type SortOrder,
} from "@shared/utils";

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
  // Orden de la tabla (useTableSort): referencia siempre visible de por qué
  // está ordenada la respuesta y controles para cambiarlo dentro del panel
  // (en celular no hay encabezados que tocar).
  sort?: TableSortControl;
  sx?: SxProps<Theme>;
  // Campos de filtro, cada uno envuelto en un <Grid size={...}>.
  children: ReactNode;
}

const countLabel = (count: number) => `${count} ${count === 1 ? "registro" : "registros"}`;

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
export const compactFilters = (...filters: Array<ActiveFilter | false | null | undefined>) =>
  filters.filter((filter): filter is ActiveFilter => !!filter);

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
    options.filter((option) => idSet.has(String(option.id))).map((option) => option.name),
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
  sort,
  sx,
  children,
}: FilterBarProps) {
  const titleId = useId();
  const contentId = useId();
  const [expanded, setExpanded] = useState(false);
  const sortFieldRef = useRef<HTMLInputElement>(null);

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
          transition: (theme) => theme.transitions.create(["border-color", "box-shadow"]),
          ...(hasActive && {
            borderColor: "primary.main",
            boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`,
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
        <Typography variant="subtitle2" component="h2" sx={{ m: 0, flex: 1, minWidth: 0 }}>
          <ButtonBase
            data-dd-action-name={expanded ? "Ocultar filtros" : "Mostrar filtros"}
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
              sx={{ color: hasActive ? "text.brand" : "text.secondary" }}
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

      {sort && (
        <SortReference
          sort={sort}
          onEdit={() => {
            setExpanded(true);
            // Tras abrir el panel, el foco va al selector de columna.
            setTimeout(() => sortFieldRef.current?.focus(), 250);
          }}
        />
      )}

      {!expanded && hasActive && (
        <Fade in>
          <Box
            component="fieldset"
            aria-label="Filtros aplicados"
            sx={{
              border: 0,
              minWidth: 0,
              m: 0,
              p: 0,
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
                data-dd-action-name={`Quitar filtro: ${filter.label}`}
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
                deleteIcon={<CancelIcon titleAccess={`Quitar filtro ${filter.label}`} />}
                sx={{ maxWidth: "100%" }}
              />
            ))}
            {canClearAll && (
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={onClearAll}
                data-dd-action-name="Restablecer todos los filtros"
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
          {sort && <SortControls sort={sort} inputRef={sortFieldRef} />}
        </Box>
      </Collapse>
    </Paper>
  );
}

// Referencia del orden vigente, visible con el panel abierto o cerrado.
// <output> (estado vivo): un lector de pantalla anuncia el cambio de orden.
function SortReference({ sort, onEdit }: { sort: TableSortControl; onEdit: () => void }) {
  const summary = sortSummary(sort.sort, sort.options);
  if (!summary) return null;

  return (
    <Box
      component="output"
      aria-live="polite"
      aria-label="Orden de los resultados"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        px: { xs: 2, sm: 2.5 },
        pb: 1.5,
      }}
    >
      <SwapVertIcon fontSize="small" aria-hidden sx={{ color: "text.secondary" }} />
      <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
        Ordenado por
      </Typography>
      <Chip
        size="small"
        color={sort.isDefault ? "default" : "secondary"}
        variant={sort.isDefault ? "outlined" : "filled"}
        label={summary}
        title={"Ordenado por " + summary + ". Clic para cambiar el orden."}
        onClick={onEdit}
        data-dd-action-name="Cambiar orden"
        {...(!sort.isDefault && {
          onDelete: sort.reset,
          deleteIcon: <RestartAltIcon titleAccess="Restablecer orden predeterminado" />,
        })}
        sx={{ maxWidth: "100%", fontWeight: 600 }}
      />
      {sort.isDefault && (
        <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
          (predeterminado)
        </Typography>
      )}
    </Box>
  );
}

// Selector de columna y dirección dentro del panel de filtros. Las
// direcciones se nombran según el dato ("A → Z", "Más reciente primero").
function SortControls({
  sort,
  inputRef,
}: {
  sort: TableSortControl;
  inputRef: Ref<HTMLInputElement>;
}) {
  const option = findSortOption(sort.options, sort.sort.orderBy);
  if (!option) return null;
  // Primero la dirección natural del dato (A → Z, más reciente primero…).
  const directions: SortOrder[] =
    naturalOrder(option.kind) === "asc" ? ["asc", "desc"] : ["desc", "asc"];

  return (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0, mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography
        component="legend"
        variant="subtitle2"
        sx={{ mb: 1.5, p: 0, float: "left", width: "100%" }}
      >
        Orden de los resultados
      </Typography>
      <Grid container spacing={2} sx={{ alignItems: "center", clear: "both" }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper>
            <TextField
              select
              fullWidth
              label="Ordenar por"
              value={sort.sort.orderBy}
              inputRef={inputRef}
              onChange={(event) => {
                const next = findSortOption(sort.options, event.target.value);
                if (next) sort.setSort({ orderBy: next.key, order: naturalOrder(next.kind) });
              }}
            >
              {sort.options.map((item) => (
                <MenuItem key={item.key} value={item.key}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: "auto" }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            aria-label="Dirección del orden"
            value={sort.sort.order}
            onChange={(_, order: SortOrder | null) => {
              if (order) sort.setSort({ orderBy: option.key, order });
            }}
            sx={{ flexWrap: "wrap" }}
          >
            {directions.map((order) => (
              <ToggleButton
                key={order}
                value={order}
                data-dd-action-name={"Orden: " + directionLabel(option.kind, order)}
                sx={{ textTransform: "none", gap: 0.75, px: 1.5 }}
              >
                {order === "asc" ? (
                  <ArrowUpwardIcon fontSize="small" aria-hidden />
                ) : (
                  <ArrowDownwardIcon fontSize="small" aria-hidden />
                )}
                {directionLabel(option.kind, order)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Grid>
        {!sort.isDefault && (
          <Grid size={{ xs: 12, md: "auto" }}>
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={sort.reset}
              data-dd-action-name="Restablecer orden"
              sx={{ textTransform: "none" }}
            >
              Restablecer orden
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
