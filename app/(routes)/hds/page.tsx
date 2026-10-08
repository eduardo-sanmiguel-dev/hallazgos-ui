"use client";

import { ChangeEvent, MouseEvent, useEffect, useState } from "react";

import { Box } from "@mui/material";
import { IconButton } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { Typography } from "@mui/material";
import { Paper } from "@mui/material";
import { TableFooter } from "@mui/material";
import { TablePagination } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import { Toolbar } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ButtonGroup } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import VisibilityIcon from "@mui/icons-material/Visibility";

import TablePaginationActions from "@shared/components/TablePaginationActions";
import LoadingLinear from "@shared/components/LoadingLinear";
import { HdsService } from "@services";
import { Hds } from "@interfaces";
import {
  StyledTableRow,
  StyledTableCell,
} from "@shared/components/TableDefault";

const colSpan = 2;

function Row(props: { row: Hds }) {
  const { row } = props;

  return (
    <StyledTableRow sx={{ "& > *": { borderBottom: "unset" } }}>
      <StyledTableCell component="th" scope="row" align="center">
        {row.name}
      </StyledTableCell>
      <StyledTableCell align="center">
        <IconButton
          aria-label="expand row"
          size="small"
          onClick={() => HdsService.downloadFile(row.name)}
        >
          <VisibilityIcon />
        </IconButton>
      </StyledTableCell>
    </StyledTableRow>
  );
}

export interface IFiltersHds {
  name?: string;
}

const HdsPage = () => {
  const [data, setData] = useState<Hds[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<IFiltersHds>({
    name: "",
  });

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const handleChangePage = (
    _: MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    HdsService.findAll({
      name: filters.name,
    })
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <Grid container>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.common.black
                : theme.palette.common.white,
          }}
        >
          Hoja de datos de seguridad
        </Typography>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                color: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.common.black
                    : theme.palette.common.white,
              }}
            >
              <FilterListIcon
                sx={{
                  pt: 1,
                  color: (theme) =>
                    theme.palette.mode === "light"
                      ? theme.palette.common.black
                      : theme.palette.common.white,
                }}
              />{" "}
              Filtros ({data.length})
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Toolbar>
              <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 4,
                    }}
                  >
                    <Paper>
                      <TextField
                        label="Nombre"
                        fullWidth
                        variant="outlined"
                        value={filters.name}
                        autoComplete="off"
                        onChange={(e) => {
                          setFilters({
                            ...filters,
                            name: e.target.value,
                          });
                        }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <ButtonGroup
                variant="contained"
                aria-label="outlined primary button group"
              >
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => getData()}
                ></Button>
              </ButtonGroup>
            </Toolbar>
          </Grid>
        </Grid>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        {isLoading ? (
          <LoadingLinear />
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
              <TableHead>
                <StyledTableRow>
                  {["Nombre", "Visualizar archivo"].map((column) => (
                    <StyledTableCell key={column} align="center">
                      {column}
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? data.slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage,
                    )
                  : data
                ).map((row) => (
                  <Row key={row.name} row={row} />
                ))}
                {emptyRows > 0 && (
                  <StyledTableRow style={{ height: 53 * emptyRows }}>
                    <StyledTableCell colSpan={6} />
                  </StyledTableRow>
                )}
              </TableBody>
              <TableFooter>
                <StyledTableRow>
                  <TablePagination
                    rowsPerPageOptions={[
                      5,
                      10,
                      25,
                      { label: "Todos", value: -1 },
                    ]}
                    colSpan={colSpan}
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    slotProps={{
                      select: {
                        inputProps: {
                          "aria-label": "rows per page",
                        },
                        native: true,
                      },
                    }}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
                  />
                </StyledTableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </Grid>
    </Grid>
  );
};

export default HdsPage;
