import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import DialogCreateCiael from "./components/DialogCreateCiael";
import TableCiaels, { CIAEL_DEFAULT_SORT, CIAEL_SORT_OPTIONS } from "./components/TableCiaels";
import FiltersCiaels, {
  DEFAULT_FILTERS_CIAELS,
  type IFiltersCiaels,
} from "./components/FiltersCiaels";
import { CiaelsService } from "@services";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";

const CiaelPage = () => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<IFiltersCiaels>(DEFAULT_FILTERS_CIAELS);
  const downloadExcel = useMutation({
    mutationFn: () => CiaelsService.downloadExcel(),
  });

  const sort = useTableSort("ciael", CIAEL_SORT_OPTIONS, CIAEL_DEFAULT_SORT);

  const {
    rows: ciaels,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "ciael",
    filters,
    sort: sort.sort,
    fetcher: (filters, params) => CiaelsService.findAllPaginated({ ...filters, ...params }),
  });

  return (
    <>
      <DialogCreateCiael open={open} setOpen={setOpen} getData={getData} />
      <PageHeader title="CIAEL">
        <Button
          data-dd-action-name="Crear reporte CIAEL"
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
        >
          Crear reporte
        </Button>
        <Button
          variant="outlined"
          startIcon={<SimCardDownloadIcon />}
          onClick={() => downloadExcel.mutate()}
          loading={downloadExcel.isPending}
        >
          Excel
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersCiaels filters={filters} setFilters={setFilters} count={count} sort={sort} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableCiaels sorting={sort} data={ciaels} pagination={pagination} />
      )}
    </>
  );
};

export default CiaelPage;
