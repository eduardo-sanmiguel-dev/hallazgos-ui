import type { ReactNode } from "react";

import { Box } from "@mui/material";
import { TableSortLabel } from "@mui/material";
import { Tooltip } from "@mui/material";

import type { TableSortControl } from "@hooks/useTableSort";
import {
  directionLabel,
  findSortOption,
  headerSortHint,
  naturalOrder,
  type SortOption,
} from "@shared/utils";
import { StyledTableCell } from "./TableDefault";

const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

interface Props {
  label: ReactNode;
  option: SortOption;
  sorting: TableSortControl;
}

/**
 * Encabezado de columna que ordena en la API. La flecha se ve tenue en toda
 * columna ordenable (antes no había forma de saberlo sin pasar el cursor) y
 * marcada en la columna activa. El tooltip dice qué pasará al hacer clic.
 */
export default function SortableHeader({ label, option, sorting }: Props) {
  const active = sorting.sort.orderBy === option.key;
  const hint = headerSortHint(option, sorting.sort, sorting.defaultSort);

  return (
    <Tooltip title={hint} enterDelay={400} describeChild>
      <TableSortLabel
        active={active}
        direction={active ? sorting.sort.order : naturalOrder(option.kind)}
        onClick={() => sorting.toggleColumn(option.key)}
        data-dd-action-name={`Ordenar por ${option.label}`}
        sx={{
          color: "inherit",
          fontWeight: active ? 700 : "inherit",
          whiteSpace: "inherit",
          "&:hover, &:focus-visible": { color: "inherit" },
          "&.Mui-active": { color: "inherit" },
          "& .MuiTableSortLabel-icon": {
            color: "inherit !important",
            opacity: active ? 1 : 0.3,
          },
          "&:hover .MuiTableSortLabel-icon": { opacity: active ? 1 : 0.7 },
        }}
      >
        {label}
        {active && (
          <Box component="span" sx={visuallyHidden}>
            , ordenado: {directionLabel(option.kind, sorting.sort.order)}
          </Box>
        )}
      </TableSortLabel>
    </Tooltip>
  );
}

/**
 * Celda de encabezado para tablas armadas a mano: ordenable si `sortKey`
 * está entre las opciones de `sorting`; si no, solo el texto.
 */
export function SortHeaderCell({
  label,
  sortKey,
  sorting,
}: {
  label: ReactNode;
  sortKey?: string;
  sorting?: TableSortControl;
}) {
  const option = sorting && sortKey ? findSortOption(sorting.options, sortKey) : undefined;
  const active = !!option && sorting?.sort.orderBy === option.key;
  return (
    <StyledTableCell sortDirection={active ? sorting?.sort.order : false}>
      {option && sorting ? (
        <SortableHeader label={label} option={option} sorting={sorting} />
      ) : (
        label
      )}
    </StyledTableCell>
  );
}
