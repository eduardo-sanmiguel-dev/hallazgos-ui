import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "sonner";

import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar, { compactFilters, optionLabel } from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { Equipment } from "@interfaces";
import { stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useUserSessionStore } from "@store";
import { EquipmentsService } from "@services";

export interface IFiltersTopics {
  manufacturingPlantId?: number;
  name?: string;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Equipment>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "manufacturingPlantCard",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "subtitle",
    hideInTable: true,
  },
  {
    id: "deliveryFrequency",
    header: "Frecuencia de entrega (días)",
    cell: (row) => row.deliveryFrequency,
  },
  {
    id: "price",
    header: "Precio",
    cell: (row) => (row.costHistory.length ? `$ ${row.costHistory[0].price}` : ""),
  },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "hidden",
  },
  {
    id: "createdAt",
    header: "Fecha de creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
    card: "hidden",
  },
  {
    id: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy.name,
    card: "hidden",
  },
  {
    id: "updatedAt",
    header: "Fecha de actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
  {
    id: "updatedBy",
    header: "Actualizado por",
    cell: (row) => row.updatedBy?.name,
    card: "hidden",
  },
];

export default function EquipmentsPage() {
  const router = useRouter();

  const manufacturingPlants = useUserSessionStore((state) => state.manufacturingPlants);
  const [filters, setFilters] = useState<{
    name: string;
    manufacturingPlantId: string;
  }>({
    manufacturingPlantId: "",
    name: "",
  });

  const { confirm, confirmDialog } = useConfirmDialog();

  const {
    rows,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "equipments",
    filters,
    fetcher: (filters, { page, limit }) =>
      EquipmentsService.findAllPaginated({
        page,
        limit,
        manufacturingPlantId: filters.manufacturingPlantId,
        name: filters.name,
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => EquipmentsService.remove(id),
    onSuccess: () => {
      toast.success("Equipo eliminado correctamente");
      return getData();
    },
  });

  const confirmRemove = async (row: Equipment) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Está seguro de eliminar el equipo "${row.name}"?`,
      confirmLabel: "Confirmar",
      tone: "danger",
      action: () => removeMutation.mutateAsync(row.id),
    });
  };

  return (
    <>
      {confirmDialog}
      <PageHeader title="Equipo de protección personal">
        <Button
          data-dd-action-name="Crear equipo de EPP"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/equipments/form")}
        >
          Crear equipo
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar
        count={count}
        activeFilters={compactFilters(
          !!filters.manufacturingPlantId && {
            key: "manufacturingPlantId",
            label: "Planta",
            value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
            onRemove: () => setFilters({ ...filters, manufacturingPlantId: "" }),
          },
          !!filters.name && {
            key: "name",
            label: "Nombre",
            value: filters.name,
            onRemove: () => setFilters({ ...filters, name: "" }),
          },
        )}
        onClearAll={() => setFilters({ manufacturingPlantId: "", name: "" })}
      >
        <ClearFiltersButton
          visible={!!filters.name || !!filters.manufacturingPlantId}
          onClick={() => setFilters({ manufacturingPlantId: "", name: "" })}
        />
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectManufacturingPlantsOwn
            embedded
            label="Planta"
            isFilter={true}
            value={filters.manufacturingPlantId}
            onChange={(e) => {
              setFilters({
                ...filters,
                manufacturingPlantId: e.target.value,
              });
            }}
          />
        </Grid>
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
        <TableSkeleton />
      ) : (
        <CatalogTable
          catalog="equipments"
          onActivated={getData}
          rows={rows}
          columns={columns}
          getRowKey={(row) => row.id}
          pagination={pagination}
          ariaLabel="Equipos de protección personal"
          emptyTitle="Sin registros de equipos"
          emptyDescription="No hay equipos con los filtros actuales."
          actions={(row) => (
            <RowActions>
              <EditAction onClick={() => router.push("/equipments/form?id=" + row.id)} />
              <DeleteAction onClick={() => confirmRemove(row)} />
            </RowActions>
          )}
        />
      )}
    </>
  );
}
