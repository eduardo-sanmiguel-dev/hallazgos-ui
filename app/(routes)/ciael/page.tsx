"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import DialogCreateCiael from "./components/DialogCreateCiael";
import TableCiaels from "./components/TableCiaels";
import FiltersCiaels, {
  DEFAULT_FILTERS_CIAELS,
  type IFiltersCiaels,
} from "./components/FiltersCiaels";
import { CiaelsService } from "@services";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

const CiaelPage = () => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<IFiltersCiaels>(
    DEFAULT_FILTERS_CIAELS,
  );
  const [isLoadingExcel, setIsLoadingExcel] = useState<boolean>(false);

  const {
    rows: ciaels,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "ciael",
    filters,
    fetcher: (filters, { page, limit }) =>
      CiaelsService.findAllPaginated({ ...filters, page, limit }),
  });

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
        <TableSkeleton />
      ) : (
        <TableCiaels data={ciaels} pagination={pagination} />
      )}
    </>
  );
};

export default CiaelPage;
