import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ManufacturingPlantsService } from "@services";
import TableManufacturingPlants, {
  MANUFACTURING_PLANT_DEFAULT_SORT,
  MANUFACTURING_PLANT_SORT_OPTIONS,
} from "./_components/TableManufacturingPlants";
import FiltersManufacturingPlants, {
  DEFAULT_FILTERS_MANUFACTURING_PLANTS,
  type IFiltersManufacturingPlants,
} from "./_components/FiltersManufacturingPlants";

const ManufacturingPlantsPage = () => {
  const [filters, setFilters] = useState<IFiltersManufacturingPlants>(
    DEFAULT_FILTERS_MANUFACTURING_PLANTS,
  );

  const router = useRouter();

  const sort = useTableSort(
    "manufacturing-plants",
    MANUFACTURING_PLANT_SORT_OPTIONS,
    MANUFACTURING_PLANT_DEFAULT_SORT,
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "manufacturing-plants",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      ManufacturingPlantsService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Plantas">
        <Button
          data-dd-action-name="Crear planta"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/manufacturing-plants/form")}
        >
          Crear planta
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersManufacturingPlants
        sort={sort}
        filters={filters}
        setFilters={setFilters}
        count={count}
      />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableManufacturingPlants
          sorting={sort}
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default ManufacturingPlantsPage;
