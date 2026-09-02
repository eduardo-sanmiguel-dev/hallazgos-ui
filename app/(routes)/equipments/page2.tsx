"use client";

import { useCallback, useEffect, useState } from "react";

import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableFooter } from "@mui/material";
import { TablePagination } from "@mui/material";
import { TableHead } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";
import { Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FilterListIcon from "@mui/icons-material/FilterList";
import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { ButtonGroup } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import AddIcon from "@mui/icons-material/Add";
import { Tooltip } from "@mui/material";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "sonner";

import TablePaginationActions from "@shared/components/TablePaginationActions";
import { BootstrapDialog } from "@routes/hallazgos/_components/CloseEvidence";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import LoadingLinear from "@shared/components/LoadingLinear";
import { Equipment, ManufacturingPlant } from "@interfaces";
import SelectDefault from "@components/SelectDefault";
import { stringToDateWithTime } from "@shared/utils";
import { useUserSessionStore } from "@store";
import { EquipmentsService } from "@services";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";

export interface IFiltersTopics {
  manufacturingPlantId?: number;
  name?: string;
}

const colSpan = 10;

const ScreenForm = ({
  currentId,
  closeDialog,
  manufacturingPlants,
}: {
  currentId: number;
  closeDialog: () => void;
  manufacturingPlants: ManufacturingPlant[];
}) => {
  const [form, setForm] = useState<{
    name: string;
    deliveryFrequency: string;
    manufacturingPlantId: string;
    price: string;
  }>({
    name: "",
    deliveryFrequency: "",
    manufacturingPlantId: "",
    price: "",
  });

  const saveData = () => {
    const nameCleaned = form.name.trim();
    const deliveryFrequencyCleaned = Number(form.deliveryFrequency.trim() || 0);
    const priceCleaned = Number(form.price.trim() || 0);

    if (!nameCleaned) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!form.manufacturingPlantId) {
      toast.error("Debe seleccionar una planta de manufactura.");
      return;
    }

    const payload = {
      name: nameCleaned,
      deliveryFrequency:
        deliveryFrequencyCleaned > 0 ? deliveryFrequencyCleaned : null,
      manufacturingPlantId: Number(form.manufacturingPlantId),
      price: priceCleaned > 0 ? priceCleaned : null,
    };

    if (!currentId) {
      EquipmentsService.create(payload).then(() => {
        toast.success("Equipo creado correctamente");
        closeDialog();
      });
    } else {
      EquipmentsService.update(currentId, payload).then(() => {
        toast.success("Equipo actualizado correctamente");
        closeDialog();
      });
    }
  };

  const handleClose = (shouldSave: boolean) => {
    if (!shouldSave) {
      closeDialog();
      return;
    }

    saveData();
  };

  const getData = useCallback(() => {
    if (!currentId) return;

    EquipmentsService.findOne(currentId).then((data) => {
      setForm({
        name: data.name,
        deliveryFrequency: data?.deliveryFrequency
          ? String(data.deliveryFrequency)
          : "",
        manufacturingPlantId: String(data.manufacturingPlant.id),
        price: data?.costHistory.length
          ? String(data.costHistory[0].price)
          : "",
      });
    });
  }, [currentId]);

  useEffect(() => {
    if (currentId) {
      getData();
    }
  }, [getData, currentId]);

  useEffect(() => {
    if (!currentId && manufacturingPlants.length === 1) {
      setForm((prev) => ({
        ...prev,
        manufacturingPlantId: String(manufacturingPlants[0].id),
      }));
    }
  }, [manufacturingPlants, currentId]);

  return (
    <BootstrapDialog
      onClose={() => handleClose(false)}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth={true}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        {currentId ? "Editar" : "Nuevo"}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => handleClose(false)}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Paper>
              <SelectManufacturingPlants
                value={form.manufacturingPlantId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manufacturingPlantId: e.target.value,
                  })
                }
              />
            </Paper>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Paper>
              <TextField
                label="Nombre"
                variant="outlined"
                fullWidth
                autoComplete="off"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </Paper>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Paper>
              <TextField
                label="Frecuencia de entrega (dias)"
                variant="outlined"
                fullWidth
                autoComplete="off"
                type="number"
                slotProps={{ htmlInput: { min: 1, step: 0 } }}
                onKeyDown={(evt) => {
                  const forbidden = ["e", "E", "-", "+", "."];
                  if (forbidden.includes(evt.key)) evt.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = Number(val);
                  if (val === "" || (!Number.isNaN(num) && num > 0)) {
                    setForm({
                      ...form,
                      deliveryFrequency: e.target.value,
                    });
                  }
                }}
                value={form.deliveryFrequency}
              />
            </Paper>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Paper>
              <TextField
                label="Precio"
                variant="outlined"
                fullWidth
                autoComplete="off"
                type="number"
                slotProps={{ htmlInput: { min: 1, step: 0.01 } }}
                onKeyDown={(evt) => {
                  const forbidden = ["e", "E", "-", "+"];
                  if (forbidden.includes(evt.key)) evt.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = Number(val);

                  if (val === "" || (!Number.isNaN(num) && num > 0)) {
                    const rounded = Math.round(num * 100) / 100;
                    setForm({
                      ...form,
                      price: rounded.toString(),
                    });
                  }
                }}
                value={form.price}
              />
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)} variant="text" color="error">
          Cancelar
        </Button>
        <Button onClick={() => handleClose(true)} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
};

export default function EquipmentsPage() {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [rows, setRows] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentId, setCurrentId] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState<{
    name: string;
    manufacturingPlantId: string;
  }>({
    manufacturingPlantId: "",
    name: "",
  });

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    EquipmentsService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
      name: filters.name,
    })
      .then(setRows)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const theme = useTheme();

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (manufacturingPlants.length === 1) {
      setFilters((prev) => ({
        ...prev,
        manufacturingPlantId: String(manufacturingPlants[0].id),
      }));
    }
  }, [manufacturingPlants]);

  return (
    <>
      {isOpen && (
        <ScreenForm
          manufacturingPlants={manufacturingPlants}
          currentId={currentId}
          closeDialog={() => {
            setIsOpen(false);
            setCurrentId(0);
            getData();
          }}
        />
      )}
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
            color={
              theme.palette.mode === "light"
                ? theme.palette.common.black
                : theme.palette.common.white
            }
          >
            Equipo de protección personal
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
                color={
                  theme.palette.mode === "light"
                    ? theme.palette.common.black
                    : theme.palette.common.white
                }
              >
                <FilterListIcon sx={{ pt: 1 }} /> Filtros ({rows.length})
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
                        md: 2,
                      }}
                    >
                      <SelectDefault
                        data={manufacturingPlants}
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
                  <Tooltip title="Crear" placement="top">
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setIsOpen(true)}
                    />
                  </Tooltip>
                  <Tooltip title="Actualizar" placement="top">
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={() => getData()}
                    />
                  </Tooltip>
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
              <Table
                sx={{ minWidth: 500 }}
                aria-label="custom pagination table"
              >
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>ID</StyledTableCell>
                    <StyledTableCell style={{ width: 350 }}>
                      Nombre
                    </StyledTableCell>
                    <StyledTableCell>
                      Frecuencia de entrega (dias)
                    </StyledTableCell>
                    <StyledTableCell>Precio</StyledTableCell>
                    <StyledTableCell>Planta</StyledTableCell>
                    <StyledTableCell>Fecha de creación</StyledTableCell>
                    <StyledTableCell>Creado por</StyledTableCell>
                    <StyledTableCell>Fecha de actualización</StyledTableCell>
                    <StyledTableCell>Actualizado por</StyledTableCell>
                    <StyledTableCell>Acciones</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {(rowsPerPage > 0
                    ? rows.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                    : rows
                  ).map((row) => (
                    <StyledTableRow key={row.name}>
                      <StyledTableCell component="th" scope="row">
                        {row.id}
                      </StyledTableCell>
                      <StyledTableCell>{row.name}</StyledTableCell>
                      <StyledTableCell>{row.deliveryFrequency}</StyledTableCell>
                      <StyledTableCell>
                        {row.costHistory.length
                          ? `$ ${row.costHistory[0].price}`
                          : ""}
                      </StyledTableCell>
                      <StyledTableCell>
                        {row.manufacturingPlant.name}
                      </StyledTableCell>
                      <StyledTableCell>
                        {stringToDateWithTime(row.createdAt)}
                      </StyledTableCell>
                      <StyledTableCell>{row.createdBy.name}</StyledTableCell>
                      <StyledTableCell>
                        {stringToDateWithTime(row.updatedAt)}
                      </StyledTableCell>
                      <StyledTableCell>{row.updatedBy?.name}</StyledTableCell>
                      <StyledTableCell>
                        <Tooltip title="Editar" placement="top">
                          <Button
                            startIcon={<EditIcon color="inherit" />}
                            onClick={() => {
                              setIsOpen(true);
                              setCurrentId(row.id);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Eliminar" placement="top">
                          <Button
                            startIcon={<DeleteIcon color="error" />}
                            onClick={() =>
                              toast("¡ Confirmar eliminación !", {
                                position: "top-center",
                                description: `¿Está seguro de eliminar el equipo "${row.name}"?`,
                                action: {
                                  label: "Confirmar",
                                  onClick: () =>
                                    EquipmentsService.remove(row.id).then(
                                      () => {
                                        toast.success(
                                          "Equipo eliminado correctamente",
                                        );
                                        getData();
                                      },
                                    ),
                                },
                              })
                            }
                          />
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                  {emptyRows > 0 && (
                    <StyledTableRow style={{ height: 53 * emptyRows }}>
                      <StyledTableCell colSpan={colSpan} />
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
                        { label: "All", value: -1 },
                      ]}
                      colSpan={colSpan}
                      count={rows.length}
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
    </>
  );
}
