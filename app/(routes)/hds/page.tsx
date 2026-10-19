"use client";

import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";

import SelectDefault from "@components/SelectDefault";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { RowActions, ViewAction } from "@shared/components/RowActions";
import {
  StyledTableRow,
  StyledTableCell,
} from "@shared/components/TableDefault";
import TableDefaultServer from "@shared/components/TableDefaultServer";
import { HdsService } from "@services";
import { Hds } from "@interfaces";

export interface IFiltersHds {
  name?: string;
  // Orden alfabético por nombre: "asc" | "desc".
  order?: string;
}

const DEFAULT_FILTERS_HDS: IFiltersHds = {
  name: "",
  order: "",
};

const ORDER_OPTIONS = [
  { id: "asc", name: "A - Z" },
  { id: "desc", name: "Z - A" },
];

const columns = ["Nombre", "Visualizar archivo"];

const HdsPage = () => {
  const [data, setData] = useState<Hds[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<IFiltersHds>(DEFAULT_FILTERS_HDS);

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    HdsService.findAllPaginated({
      ...filters,
      page: page + 1,
      limit: rowsPerPage,
    })
      .then(({ data, count }) => {
        setData(data);
        setCount(count);
      })
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  return (
    <>
      <PageHeader title="Hoja de datos de seguridad">
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar count={count}>
        <ClearFiltersButton
          visible={!!filters.name || !!filters.order}
          onClick={() => setFilters(DEFAULT_FILTERS_HDS)}
        />
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
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
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={ORDER_OPTIONS}
            label="Orden"
            value={filters.order || ""}
            onChange={(e) => setFilters({ ...filters, order: e.target.value })}
            isFilter={true}
          />
        </Grid>
      </FilterBar>
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableDefaultServer
          rows={data}
          columns={columns}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={count}
          ariaLabel="Hojas de datos de seguridad"
          paintRows={(row: Hds) => (
            <StyledTableRow key={row.name}>
              <StyledTableCell component="th" scope="row">
                {row.name}
              </StyledTableCell>
              <StyledTableCell>
                <RowActions>
                  <ViewAction
                    label="Ver archivo"
                    onClick={() => HdsService.downloadFile(row.name)}
                  />
                </RowActions>
              </StyledTableCell>
            </StyledTableRow>
          )}
        />
      )}
    </>
  );
};

export default HdsPage;
