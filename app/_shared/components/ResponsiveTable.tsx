import { Key, ReactNode } from "react";

import { Box } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Paper } from "@mui/material";
import { Stack } from "@mui/material";
import { TablePagination } from "@mui/material";
import { Typography } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/material/styles";

import { constants } from "@constants";
import { StyledTableCell, StyledTableRow } from "./TableDefault";
import TableDefaultServer, {
  TableBodyState,
  type ServerPagination,
} from "./TableDefaultServer";
import TablePaginationActions from "./TablePaginationActions";

export interface ResponsiveColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  // Papel en la tarjeta de celular: "title" (renglón principal, en negritas),
  // "subtitle" (debajo del título), "field" (etiqueta: valor; por omisión) u
  // "hidden" (solo en la tabla).
  card?: "title" | "subtitle" | "field" | "hidden";
  // Solo en la tarjeta (p. ej. un título que resume varias columnas).
  hideInTable?: boolean;
  // Primera columna como encabezado de fila (`<th scope="row">`).
  rowHeader?: boolean;
  cellSx?: SxProps<Theme>;
}

interface ResponsiveTableProps<T> {
  rows: T[];
  columns: ResponsiveColumn<T>[];
  getRowKey: (row: T) => Key;
  // Acciones de la fila: última columna en la tabla y pie de la tarjeta.
  actions?: (row: T) => ReactNode;
  pagination: ServerPagination;
  ariaLabel?: string;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
}

const ACTIONS_HEADER = "Acciones";

// Tabla en tablet y escritorio; tarjetas en celular (< 600 px), donde una
// tabla ancha obliga a desplazarse de lado para ver datos y acciones.
export default function ResponsiveTable<T>({
  rows,
  columns,
  getRowKey,
  actions,
  pagination,
  ariaLabel = "Tabla de registros",
  emptyTitle,
  emptyDescription,
}: ResponsiveTableProps<T>) {
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  if (!isPhone) {
    const tableColumns = columns.filter((column) => !column.hideInTable);
    return (
      <TableDefaultServer
        rows={rows}
        columns={[
          ...tableColumns.map((column) => column.header),
          ...(actions ? [ACTIONS_HEADER] : []),
        ]}
        {...pagination}
        ariaLabel={ariaLabel}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        paintRows={(row: T) => (
          <StyledTableRow key={getRowKey(row)}>
            {tableColumns.map((column) => (
              <StyledTableCell
                key={column.id}
                {...(column.rowHeader && { component: "th", scope: "row" })}
                sx={column.cellSx}
              >
                {column.cell(row)}
              </StyledTableCell>
            ))}
            {actions && <StyledTableCell>{actions(row)}</StyledTableCell>}
          </StyledTableRow>
        )}
      />
    );
  }

  return (
    <CardList
      rows={rows}
      columns={columns}
      getRowKey={getRowKey}
      actions={actions}
      pagination={pagination}
      ariaLabel={ariaLabel}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}

function CardList<T>({
  rows,
  columns,
  getRowKey,
  actions,
  pagination,
  ariaLabel,
  emptyTitle,
  emptyDescription,
}: ResponsiveTableProps<T>) {
  const {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    rowsPerPageOptions,
    count,
    isFetching = false,
    isError,
    onRetry,
  } = pagination;

  const titleColumns = columns.filter((column) => column.card === "title");
  const subtitleColumns = columns.filter(
    (column) => column.card === "subtitle",
  );
  const fieldColumns = columns.filter(
    (column) => !column.card || column.card === "field",
  );

  return (
    <Box aria-busy={isFetching}>
      <Box sx={{ height: 4 }}>
        {isFetching && <LinearProgress aria-label="Actualizando" />}
      </Box>
      {rows.length === 0 && !isFetching ? (
        <Paper variant="outlined">
          <TableBodyState
            isError={isError}
            onRetry={onRetry}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        </Paper>
      ) : (
        <Stack
          component="ul"
          aria-label={ariaLabel}
          spacing={1.5}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {rows.map((row) => (
            <Paper
              key={getRowKey(row)}
              component="li"
              variant="outlined"
              sx={{ p: 2 }}
            >
              {titleColumns.map((column) => (
                <Typography
                  key={column.id}
                  component="p"
                  sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
                >
                  {column.cell(row)}
                </Typography>
              ))}
              {subtitleColumns.map((column) => (
                <Typography
                  key={column.id}
                  variant="body2"
                  component="p"
                  sx={{ color: "text.secondary", overflowWrap: "anywhere" }}
                >
                  {column.cell(row)}
                </Typography>
              ))}
              {fieldColumns.length > 0 && (
                <Box
                  component="dl"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(96px, auto) 1fr",
                    columnGap: 1.5,
                    rowGap: 0.75,
                    mt: 1.5,
                    mb: 0,
                    "& dt": { color: "text.secondary", typography: "body2" },
                    "& dd": {
                      m: 0,
                      typography: "body2",
                      overflowWrap: "anywhere",
                    },
                  }}
                >
                  {fieldColumns.map((column) => (
                    <Box key={column.id} sx={{ display: "contents" }}>
                      <dt>{column.header}</dt>
                      <dd>{column.cell(row)}</dd>
                    </Box>
                  ))}
                </Box>
              )}
              {actions && <Box sx={{ mt: 1.5 }}>{actions(row)}</Box>}
            </Paper>
          ))}
        </Stack>
      )}
      <TablePagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={
          rowsPerPageOptions ?? constants.pagination.rowsPerPageOptions
        }
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        ActionsComponent={TablePaginationActions}
      />
    </Box>
  );
}
