"use client";

import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar from "@shared/components/FilterBar";
import { RowActions, ViewAction } from "@shared/components/RowActions";
import TableDefault, {
  StyledTableRow,
  StyledTableCell,
} from "@shared/components/TableDefault";
import { HdsService } from "@services";
import { Hds } from "@interfaces";

export interface IFiltersHds {
  name?: string;
}

const columns = ["Nombre", "Visualizar archivo"];

const HdsPage = () => {
  const [data, setData] = useState<Hds[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<IFiltersHds>({
    name: "",
  });

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
    <>
      <PageHeader title="Hoja de datos de seguridad">
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar count={data.length}>
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
      </FilterBar>
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableDefault
          rows={data}
          columns={columns}
          ariaLabel="Hojas de datos de seguridad"
          paintRows={(row) => (
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
