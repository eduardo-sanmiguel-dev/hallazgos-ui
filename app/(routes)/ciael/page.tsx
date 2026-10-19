"use client";

import { useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";

import DialogCreateCiael from "./components/DialogCreateCiael";
import TableCiaels from "./components/TableCiaels";
import FiltersCiaels, {
  DEFAULT_FILTERS_CIAELS,
  type IFiltersCiaels,
} from "./components/FiltersCiaels";
import { Ciael } from "@interfaces";
import { CiaelsService } from "@services";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

const CiaelPage = () => {
  const [open, setOpen] = useState(false);
  const [ciaels, setCiaels] = useState<Ciael[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [filters, setFilters] = useState<IFiltersCiaels>(
    DEFAULT_FILTERS_CIAELS,
  );
  const [isLoadingExcel, setIsLoadingExcel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    CiaelsService.findAllPaginated({
      ...filters,
      page: page + 1,
      limit: rowsPerPage,
    })
      .then(({ data, count }) => {
        setCiaels(data);
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
      <DialogCreateCiael open={open} setOpen={setOpen} getData={getData} />
      <PageHeader title="CIAEL">
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
        >
          Crear registro
        </Button>
        <Button
          variant="outlined"
          startIcon={<SimCardDownloadIcon />}
          onClick={() => {
            setIsLoadingExcel(true);
            CiaelsService.downloadExcel().finally(() =>
              setIsLoadingExcel(false),
            );
          }}
          loading={isLoadingExcel}
        >
          Excel
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersCiaels filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableCiaels
          data={ciaels}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={count}
        />
      )}
    </>
  );
};

export default CiaelPage;
