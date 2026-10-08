"use client";

import {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { Box } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button } from "@mui/material";
import { ButtonGroup } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import AddIcon from "@mui/icons-material/Add";
import { Tooltip } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "sonner";
import { Autocomplete } from "@mui/material";
import { TextField } from "@mui/material";
import { Checkbox } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useShallow } from "zustand/shallow";

import TablePaginationActions from "@shared/components/TablePaginationActions";
import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import LoadingLinear from "@shared/components/LoadingLinear";
import SelectDefault from "@components/SelectDefault";
import { stringToDateWithTime } from "@shared/utils";
import { useUserSessionStore } from "@store";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import {
  ConfigTgService,
  EmployeesService,
  TopicsService,
  UsersService,
} from "@services";
import {
  BasicData,
  ConfigTg,
  ManufacturingPlant,
  Topic,
  User,
} from "@interfaces";

export interface IFiltersConfigTg {
  manufacturingPlantId?: number;
  positionId?: number;
}

const colSpan = 11;

const ScreenForm = ({
  manufacturingPlants,
  positions,
  currentId,
  closeDialog,
}: {
  manufacturingPlants: ManufacturingPlant[];
  positions: BasicData[];
  currentId: number;
  closeDialog: () => void;
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>("");
  const [currentEmployees, setCurrentEmployees] = useState<string[]>([]);

  const theme = useTheme();

  const [form, setForm] = useState<{
    positionId: string;
    manufacturingPlantId: string;
    areaManagerId: string;
    humanResourceManagerId: string;
    topics: {
      id: number;
      topic: Topic;
      responsibles: User[];
    }[];
  }>({
    positionId: "",
    manufacturingPlantId: "",
    areaManagerId: "",
    humanResourceManagerId: "",
    topics: [],
  });

  // Drag and drop logic for topics
  const moveTopicRow = (fromIdx: number, toIdx: number) => {
    setForm((prev) => {
      const updated = [...prev.topics];
      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, removed);
      return { ...prev, topics: updated };
    });
  };

  // DnD row component
  const DraggableTopicRow = ({
    row,
    idx,
  }: {
    row: { id: number; topic: Topic; responsibles: User[] };
    idx: number;
  }) => {
    const ref = useRef<HTMLTableRowElement>(null);
    const [, drop] = useDrop<{ idx: number }>({
      accept: "topic-row",
      hover: (item) => {
        if (item.idx === idx) return;
        moveTopicRow(item.idx, idx);
        item.idx = idx;
      },
    });
    const [{ isDragging }, drag] = useDrag<
      { idx: number },
      void,
      { isDragging: boolean }
    >({
      type: "topic-row",
      item: { idx },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });
    drag(drop(ref));
    return (
      <StyledTableRow
        ref={ref}
        sx={{
          opacity: isDragging ? 1 : 1,
          cursor: "move",
          background: isDragging ? theme.palette.primary.light : undefined,
          boxShadow: isDragging ? "0 4px 16px 0 rgba(0,0,0,0.15)" : undefined,
          zIndex: isDragging ? 10 : undefined,
          transition: "background 0.2s, box-shadow 0.2s",
          "&:last-child td, &:last-child th": { border: 0 },
        }}
      >
        <StyledTableCell>
          <DragIndicatorIcon color="action" />
        </StyledTableCell>
        <StyledTableCell component="th" scope="row">
          {idx + 1}
        </StyledTableCell>
        <StyledTableCell>{row.topic.name}</StyledTableCell>
        <StyledTableCell>
          {row.responsibles.map((resp: User) => resp.name).join(", ")}
        </StyledTableCell>
        <StyledTableCell align="center">
          <Button
            onClick={() =>
              setForm({
                ...form,
                topics: form.topics.filter((t) => t.id !== row.id),
              })
            }
          >
            <DeleteIcon color="error" />
          </Button>
        </StyledTableCell>
      </StyledTableRow>
    );
  };

  const saveData = () => {
    if (!form.manufacturingPlantId) {
      toast.error("Debe seleccionar una planta");
      return;
    }

    if (!form.positionId) {
      toast.error("Debe seleccionar un puesto");
      return;
    }

    if (!form.areaManagerId) {
      toast.error("Debe seleccionar un jefe de área");
      return;
    }

    if (!form.humanResourceManagerId) {
      toast.error("Debe seleccionar un jefe de RRHH");
      return;
    }

    if (!form.topics.length) {
      toast.error("Debe agregar al menos un tema");
      return;
    }

    const payload = {
      manufacturingPlantId: Number(form.manufacturingPlantId),
      positionId: Number(form.positionId),
      areaManagerId: Number(form.areaManagerId),
      humanResourceManagerId: Number(form.humanResourceManagerId),
      topics: form.topics.map((t) => ({
        id: t.id,
        responsibleIds: t.responsibles.map((r) => r.id),
      })),
    };

    if (!currentId) {
      ConfigTgService.create(payload).then(() => {
        toast.success("Configuración creada correctamente");
        closeDialog();
      });
    } else {
      ConfigTgService.update(currentId, payload).then(() => {
        toast.success("Configuración actualizada correctamente");
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
    ConfigTgService.findOne(currentId).then((data) => {
      setForm((prev) => ({
        ...prev,
        manufacturingPlantId: String(data.manufacturingPlant.id),
      }));
      setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          manufacturingPlantId: String(data.manufacturingPlant.id),
          positionId: String(data.position.id),
          areaManagerId: String(data.areaManager.id),
          humanResourceManagerId: String(data.humanResourceManager.id),
          topics: data.topics.map((t) => ({
            id: t.topic.id,
            topic: t.topic,
            responsibles: t.responsibles,
          })),
        }));
      }, 1500);
    });
  }, [currentId]);

  useEffect(() => {
    if (currentId) {
      getData();
    }
  }, [getData, currentId]);

  const manufacturingPlantId = useMemo(() => {
    return Number(form.manufacturingPlantId || 0);
  }, [form]);

  useEffect(() => {
    if (manufacturingPlantId) {
      UsersService.findAll({
        manufacturingPlantId: `${manufacturingPlantId}`,
      }).then(setUsers);

      TopicsService.findAll({ manufacturingPlantId }).then(setTopics);

      setForm((prev) => ({
        ...prev,
        areaManagerId: "",
        humanResourceManagerId: "",
        topics: [],
      }));
    }
  }, [manufacturingPlantId]);

  return (
    <Dialog
      fullScreen
      open={true}
      onClose={() => handleClose(false)}
      slots={{ transition: Transition }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => handleClose(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {!currentId ? "Nuevo" : "Editar"}
          </Typography>
          <Button autoFocus color="inherit" onClick={() => handleClose(true)}>
            Guardar
          </Button>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2} sx={{ p: 3 }}>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            value={form.manufacturingPlantId}
            onChange={(e) => {
              setForm({
                ...form,
                manufacturingPlantId: e.target.value,
              });
            }}
          />
        </Grid>
        {!!manufacturingPlantId && (
          <>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <SelectDefault
                data={positions}
                label="Puesto"
                value={form.positionId}
                onChange={(e) => {
                  setForm({
                    ...form,
                    positionId: e.target.value,
                  });
                }}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <SelectDefault
                data={users}
                label="Jefe de área"
                value={form.areaManagerId}
                onChange={(e) => {
                  setForm({
                    ...form,
                    areaManagerId: e.target.value,
                  });
                }}
                validationEmpty={!users.length ? true : false}
                helperText={
                  !users.length
                    ? "No hay colaboradores disponibles para la planta seleccionada"
                    : ""
                }
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <SelectDefault
                data={users}
                label="Jefe de RRHH"
                value={form.humanResourceManagerId}
                onChange={(e) => {
                  setForm({
                    ...form,
                    humanResourceManagerId: e.target.value,
                  });
                }}
                validationEmpty={!users.length ? true : false}
                helperText={
                  !users.length
                    ? "No hay colaboradores disponibles para la planta seleccionada"
                    : ""
                }
              />
            </Grid>
            <Paper sx={{ p: 2, width: "100%", m: 3 }} elevation={3}>
              <Grid
                size={{
                  xs: 12,
                  sm: 12,
                  md: 12,
                }}
              >
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 6,
                    }}
                  >
                    <SelectDefault
                      data={topics
                        .map((topic) => ({
                          ...topic,
                          name:
                            topic.name.slice(0, 70) +
                            (topic.name.length > 70 ? "..." : ""),
                        }))
                        .filter(
                          (topic) =>
                            !form.topics.find((t) => t.id === topic.id),
                        )}
                      label="Temas"
                      value={topicId}
                      onChange={(e) => setTopicId(e.target.value)}
                      validationEmpty={!topics.length ? true : false}
                      helperText={
                        !topics.length
                          ? "No hay temas disponibles para la planta seleccionada"
                          : ""
                      }
                    />
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 6,
                    }}
                  >
                    {!!users.length ? (
                      <Paper>
                        <Autocomplete
                          multiple
                          options={users}
                          disableCloseOnSelect
                          getOptionLabel={(option) => option.name}
                          renderOption={(props, option, { selected }) => {
                            const { key, ...optionProps } = props;
                            return (
                              <li key={optionProps.id} {...optionProps}>
                                <Checkbox
                                  icon={
                                    <CheckBoxOutlineBlankIcon fontSize="small" />
                                  }
                                  checkedIcon={
                                    <CheckBoxIcon fontSize="small" />
                                  }
                                  style={{ marginRight: 8 }}
                                  checked={selected}
                                />
                                {option.name}
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Responsables" />
                          )}
                          value={users.filter((emp) =>
                            currentEmployees.includes(String(emp.id)),
                          )}
                          onChange={(_, newValue) => {
                            setCurrentEmployees(
                              newValue.map((emp) => String(emp.id)),
                            );
                          }}
                        />
                      </Paper>
                    ) : (
                      <p>
                        No hay colaboradores disponibles para la planta
                        seleccionada
                      </p>
                    )}
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 12,
                      md: 12,
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!topicId || !currentEmployees.length}
                      onClick={() => {
                        const topicExists = form.topics.find(
                          (t) => t.id === Number(topicId),
                        );
                        if (topicExists) {
                          toast.error("El tema ya ha sido agregado");
                          return;
                        }

                        setForm({
                          ...form,
                          topics: [
                            ...form.topics,
                            {
                              id: Number(topicId),
                              topic: topics.find(
                                (t) => t.id === Number(topicId),
                              )!,
                              responsibles: users.filter((emp) => {
                                return currentEmployees.includes(
                                  String(emp.id),
                                );
                              }),
                            },
                          ],
                        });
                        setTopicId("");
                        setCurrentEmployees([]);
                      }}
                    >
                      Agregar tema
                    </Button>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 12,
                      md: 12,
                    }}
                  >
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                          <StyledTableRow>
                            <StyledTableCell />
                            <StyledTableCell>Orden</StyledTableCell>
                            <StyledTableCell>Tema</StyledTableCell>
                            <StyledTableCell>Responsables</StyledTableCell>
                            <StyledTableCell align="center">
                              Acciones
                            </StyledTableCell>
                          </StyledTableRow>
                        </TableHead>
                        <DndProvider backend={HTML5Backend}>
                          <TableBody>
                            {form.topics.map((row, idx) => (
                              <DraggableTopicRow
                                key={row.id}
                                row={row}
                                idx={idx}
                              />
                            ))}
                          </TableBody>
                        </DndProvider>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Grid>
    </Dialog>
  );
};

export default function TopicTg() {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [rows, setRows] = useState<ConfigTg[]>([]);
  const [positions, setPositions] = useState<BasicData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentId, setCurrentId] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState<{
    manufacturingPlantId: string;
    positionId: string;
  }>({
    manufacturingPlantId: "",
    positionId: "",
  });

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ConfigTgService.findAll({
      manufacturingPlantId: Number(filters.manufacturingPlantId || 0),
      positionId: Number(filters.positionId || 0),
    })
      .then(setRows)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  useEffect(() => {
    EmployeesService.findPositions().then(setPositions);
  }, []);

  const { manufacturingPlants } = useUserSessionStore(
    useShallow((state) => state),
  );

  const theme = useTheme();

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

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

  return (
    <>
      {isOpen && (
        <ScreenForm
          manufacturingPlants={manufacturingPlants}
          positions={positions}
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
            sx={{
              color: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.common.black
                  : theme.palette.common.white,
            }}
          >
            Configuración - Guías de entrenamiento
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
                        md: 2,
                      }}
                    >
                      <SelectDefault
                        data={positions}
                        label="Puesto"
                        isFilter={true}
                        value={filters.positionId}
                        onChange={(e) => {
                          setFilters({
                            ...filters,
                            positionId: e.target.value,
                          });
                        }}
                      />
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
                    <StyledTableCell>Puesto</StyledTableCell>
                    <StyledTableCell>Planta</StyledTableCell>
                    <StyledTableCell>No. Temas</StyledTableCell>
                    <StyledTableCell>Jefe de área</StyledTableCell>
                    <StyledTableCell>Jefe RRHH</StyledTableCell>
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
                    <StyledTableRow key={row.id}>
                      <StyledTableCell component="th" scope="row">
                        {row.id}
                      </StyledTableCell>
                      <StyledTableCell>{row.position.name}</StyledTableCell>
                      <StyledTableCell>
                        {row.manufacturingPlant.name}
                      </StyledTableCell>
                      <StyledTableCell>{row.topics.length}</StyledTableCell>
                      <StyledTableCell>{row.areaManager.name}</StyledTableCell>
                      <StyledTableCell>
                        {row.humanResourceManager.name}
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
                                description: `¿Está seguro de eliminar?`,
                                action: {
                                  label: "Confirmar",
                                  onClick: () =>
                                    ConfigTgService.remove(row.id).then(() => {
                                      toast.success(
                                        "Configuración eliminada correctamente",
                                      );
                                      getData();
                                    }),
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
