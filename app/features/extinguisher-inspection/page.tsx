import { useState } from "react";

import { useRouter } from "@shared/navigation";

import Button from "@mui/material/Button";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ExtinguisherInspectionsService } from "@services";
import ExtinguisherInspectionsTable, {
  EXTINGUISHER_INSPECTION_DEFAULT_SORT,
  EXTINGUISHER_INSPECTION_SORT_OPTIONS,
} from "./_components/ExtinguisherInspectionsTable";
import FiltersExtinguisherInspections, {
  DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS,
  IFiltersExtinguisherInspections,
} from "./_components/FiltersExtinguisherInspections";

const ExtinguisherInspectionPage = () => {
  const [filters, setFilters] = useState<IFiltersExtinguisherInspections>(
    DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS,
  );

  const router = useRouter();

  const sort = useTableSort(
    "extinguisher-inspection",
    EXTINGUISHER_INSPECTION_SORT_OPTIONS,
    EXTINGUISHER_INSPECTION_DEFAULT_SORT,
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "extinguisher-inspection",
    filters,
    sort: sort.sort,
    fetcher: (filters, params) =>
      ExtinguisherInspectionsService.findAllPaginated({ ...filters, ...params }),
  });

  return (
    <>
      <PageHeader title="Inspecciones de extintores">
        <Button
          data-dd-action-name="Crear inspección"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/extinguisher-inspection/form")}
        >
          Crear inspección
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersExtinguisherInspections
        filters={filters}
        setFilters={setFilters}
        count={count}
        sort={sort}
      />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <ExtinguisherInspectionsTable sorting={sort} rows={data} pagination={pagination} />
      )}
    </>
  );
};

export default ExtinguisherInspectionPage;
