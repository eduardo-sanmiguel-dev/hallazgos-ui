"use client";

export const dynamic = "force-dynamic";

import {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { Collapse } from "@mui/material";
import { IconButton } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { Typography } from "@mui/material";
import { Paper } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { TableFooter } from "@mui/material";
import { TablePagination } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Toolbar } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ButtonGroup } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField } from "@mui/material";
import { Dialog } from "@mui/material";
import { ListItemText } from "@mui/material";
import { ListItemButton } from "@mui/material";
import { List } from "@mui/material";
import { Divider } from "@mui/material";
import { AppBar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDebouncedCallback } from "use-debounce";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import { Switch } from "@mui/material";
import { FormGroup } from "@mui/material";
import { Skeleton } from "@mui/material";
import { Stack } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";
import { CircularProgress } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import ClearIcon from "@mui/icons-material/Clear";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DialogActions } from "@mui/material";
import { DialogContent } from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import SearchIcon from "@mui/icons-material/Search";

import TablePaginationActions from "@shared/components/TablePaginationActions";
import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import { EmployeesService, TrainingGuidesService } from "@services";
import {
  Employee,
  ResponseTrainingGuide,
  TypesOfEvaluations,
} from "@interfaces";
import LoadingLinear from "@shared/components/LoadingLinear";
import { notify, stringToDateWithTime } from "@shared/utils";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import {
  StyledTableRow,
  StyledTableCell,
} from "@shared/components/TableDefault";
import { useSearchParams, useRouter } from "next/navigation";
import { useShallow } from "zustand/shallow";

const emailsEditors = ["ggarcia@hadamexico.com", "eduardo-266@hotmail.com"];

const colSpan = 11;

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.mode === "dark" ? "#003892" : "#001e3c",
    width: 32,
    height: 32,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        "#fff",
      )}" d="M15.898 4.045c-0.271-0.272-0.715-0.272-0.986 0l-4.71 4.711-4.71-4.711c-0.271-0.272-0.715-0.272-0.986 0s-0.272 0.715 0 0.986l4.711 4.71-4.711 4.711c-0.272 0.271-0.272 0.715 0 0.986s0.715 0.272 0.986 0l4.71-4.711 4.71 4.711c0.271 0.272 0.715 0.272 0.986 0s0.272-0.715 0-0.986l-4.711-4.711 4.711-4.71c0.272-0.271 0.272-0.715 0-0.986z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
    borderRadius: 20 / 2,
  },
}));

function Row(props: {
  row: Employee;
  setCurrentEmployee: (row: Employee) => void;
}) {
  const { row, setCurrentEmployee } = props;
  const [open, setOpen] = useState(false);

  const currentTrainingGuide = useMemo(() => {
    return row.trainingGuides.find((tg) => tg.position.id === row.position.id);
  }, [row]);

  return (
    <>
      <StyledTableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <StyledTableCell>
          {row.trainingGuides.length > 0 && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </StyledTableCell>
        <StyledTableCell component="th" scope="row">
          {row.id}
        </StyledTableCell>
        <StyledTableCell>{row.name}</StyledTableCell>
        <StyledTableCell>
          {row.manufacturingPlants.map((plant) => plant.name).join(", ")}
        </StyledTableCell>
        <StyledTableCell>{row.area?.name || "N/A"}</StyledTableCell>
        <StyledTableCell>{row.position?.name || "N/A"}</StyledTableCell>
        <StyledTableCell>
          {!currentTrainingGuide
            ? "0%"
            : currentTrainingGuide.percentageOfCompliance > 0
              ? `${currentTrainingGuide.percentageOfCompliance}%`
              : "0%"}
        </StyledTableCell>
        <StyledTableCell>
          {!currentTrainingGuide ? null : currentTrainingGuide.signatureEmployee ? (
            <DoneIcon style={{ fill: "green" }} />
          ) : (
            <ClearIcon color="error" />
          )}
        </StyledTableCell>
        <StyledTableCell>
          {!currentTrainingGuide ? null : currentTrainingGuide.signatureAreaManager ? (
            <DoneIcon style={{ fill: "green" }} />
          ) : (
            <ClearIcon color="error" />
          )}
        </StyledTableCell>
        <StyledTableCell>
          {!currentTrainingGuide ? null : currentTrainingGuide.signatureHumanResourceManager ? (
            <DoneIcon style={{ fill: "green" }} />
          ) : (
            <ClearIcon color="error" />
          )}
        </StyledTableCell>
        <StyledTableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setCurrentEmployee(row)}
          >
            <SearchIcon />
          </IconButton>
          {/* {row.trainingGuides.length === 0 && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setCurrentEmployee(row)}
            >
              <AddIcon />
            </IconButton>
          )} */}
        </StyledTableCell>
      </StyledTableRow>
      <StyledTableRow>
        <StyledTableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={colSpan}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Historico
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>ID</StyledTableCell>
                    <StyledTableCell>Fecha inicio</StyledTableCell>
                    <StyledTableCell>Puesto</StyledTableCell>
                    <StyledTableCell>% de cumplimiento</StyledTableCell>
                    <StyledTableCell>Descargar archivo</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {row.trainingGuides.map((historyRow, idx) => {
                    return (
                      <StyledTableRow key={`${row.id}-${historyRow.id}-${idx}`}>
                        <StyledTableCell component="th" scope="row">
                          {historyRow.id}
                        </StyledTableCell>
                        <StyledTableCell>
                          {stringToDateWithTime(historyRow.startDate)}
                        </StyledTableCell>
                        <StyledTableCell>
                          {historyRow.position.name}
                        </StyledTableCell>
                        <StyledTableCell>
                          {historyRow.percentageOfCompliance > 0
                            ? `${historyRow.percentageOfCompliance}%`
                            : "0%"}
                        </StyledTableCell>
                        <StyledTableCell>
                          <SimCardDownloadIcon
                            color="primary"
                            fontSize="large"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              TrainingGuidesService.downloadFile(historyRow.id)
                            }
                          />
                        </StyledTableCell>
                      </StyledTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </StyledTableCell>
      </StyledTableRow>
    </>
  );
}

function SignatureDialog({
  signatureUser,
  setOpen,
  currentId,
  handleClose: handleCloseParent,
}: {
  setOpen: () => void;
  signatureUser: {
    userId: number;
    type: string;
  };
  currentId: number;
  handleClose: () => void;
}) {
  const [signature, setSignature] = useState<string>("");
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setOpen();
  }, [setOpen]);

  const clearSignature = () => {
    if (!sigCanvas.current) return;
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    if (!sigCanvas.current) return;
    const dataURL = sigCanvas.current.toDataURL();
    setSignature(dataURL);
  };

  useEffect(() => {
    if (!sigCanvas.current) return;
    if (!sigCanvas.current?.isEmpty()) {
      const payload = { ...signatureUser, signature, id: currentId };
      setIsLoading(true);
      TrainingGuidesService.saveSignature(payload)
        .then(() => {
          notify("Firma guardada correctamente", true);
          handleCloseParent();
        })
        .finally(() => setIsLoading(false));
    }
  }, [signature, handleClose, signatureUser, currentId, handleCloseParent]);

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      style={{ zIndex: 1500 }}
      maxWidth="lg"
    >
      <DialogContent>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Firma electrónica
          </Typography>
          <Box
            sx={{
              border: "1px solid #ccc",
              borderRadius: 1,
              overflow: "hidden",
              width: "100%",
              height: 200,
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 200,
                style: { width: "100%", height: "100%" },
              }}
            />
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={clearSignature}
            style={{ marginRight: 16 }}
          >
            Limpiar
          </Button>
          <Button
            variant="contained"
            onClick={saveSignature}
            disabled={isLoading}
          >
            Guardar Firma
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function ScreenEdition({
  currentEmployee,
  setOpen,
}: {
  currentEmployee: Employee;
  setOpen: () => void;
}) {
  const [responseTrainingGuide, setResponseTrainingGuide] =
    useState<ResponseTrainingGuide>();
  const [evaluations, setEvaluations] = useState<
    {
      date: Dayjs | null;
      evaluation: string;
      observations: string;
      topicId: number;
    }[]
  >([]);
  const [evaluationsInitial, setEvaluationsInitial] = useState<
    {
      date: Dayjs | null;
      evaluation: string;
      observations: string;
      topicId: number;
    }[]
  >([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [signatureUser, setSignatureUser] = useState<{
    userId: number;
    type: string;
  }>();

  const { id: userSessionId, email } = useUserSessionStore();

  useEffect(() => {
    if (responseTrainingGuide) {
      let topics = [];
      const previousTopics = responseTrainingGuide?.previousTopics || [];

      if (responseTrainingGuide.trainingGuide) {
        topics = responseTrainingGuide.trainingGuide.evaluations;

        const data = topics.map((evaluation) => ({
          date: evaluation.evaluationDate
            ? dayjs(evaluation.evaluationDate.split("T")[0])
            : null,
          evaluation: evaluation.evaluationValue,
          observations: evaluation.observations,
          topicId: evaluation.topic.id,
        }));
        setEvaluations(data);

        setStartDate(
          dayjs(responseTrainingGuide.trainingGuide.startDate.split("T")[0]),
        );
      } else {
        topics = responseTrainingGuide?.configTg?.topics;

        let data = [];

        if (!previousTopics.length) {
          data = topics.map((topic) => ({
            date: null,
            evaluation: "",
            observations: "",
            topicId: topic.topic.id,
          }));
        } else {
          data = topics.map((topic) => {
            const previousTopic = previousTopics.find(
              (prevTopic) =>
                Number(prevTopic.topic.id) === Number(topic.topic.id),
            );
            if (previousTopic) {
              return {
                date: previousTopic.evaluationDate
                  ? dayjs(previousTopic.evaluationDate.split("T")[0])
                  : null,
                evaluation: previousTopic.evaluationValue,
                observations: previousTopic.observations,
                topicId: topic.topic.id,
              };
            } else {
              return {
                date: null,
                evaluation: "",
                observations: "",
                topicId: topic.topic.id,
              };
            }
          });
        }

        setEvaluations(data);
      }
    }
  }, [responseTrainingGuide]);

  useEffect(() => {
    if (!evaluationsInitial.length && evaluations.length) {
      setEvaluationsInitial(evaluations);
    }
  }, [evaluations, evaluationsInitial]);

  const handleClose = useCallback(() => {
    setOpen();
  }, [setOpen]);

  useEffect(() => {
    TrainingGuidesService.findCurrentData({
      positionId: currentEmployee.position.id,
      employeeId: currentEmployee.id,
      manufacturingPlantId: currentEmployee.manufacturingPlants[0].id,
    })
      .then(setResponseTrainingGuide)
      .catch(() => handleClose());
  }, [currentEmployee, handleClose]);

  const saveTrainingGuide = () => {
    if (!responseTrainingGuide?.configTg) return;

    if (!startDate) {
      notify("La fecha de inicio del entrenamiento es obligatoria", false);
      return;
    }

    const evaluationsPendingDate = evaluations.filter(
      (evalItem) => !evalItem.date && evalItem.evaluation !== "",
    );

    const evaluationsPendingValue = evaluations.filter(
      (evalItem) => evalItem.evaluation === "" && evalItem.date,
    );

    if (evaluationsPendingDate.length > 0) {
      notify(
        `Existen evaluaciones sin fecha asignada, referencia fila: ${
          evaluations.findIndex(
            (evalItem) => !evalItem.date && evalItem.evaluation !== "",
          ) + 1
        }`,
        false,
      );
      return;
    }

    if (evaluationsPendingValue.length > 0) {
      notify(
        `Existen evaluaciones sin valor asignado, referencia fila: ${
          evaluations.findIndex(
            (evalItem) => evalItem.evaluation === "" && evalItem.date,
          ) + 1
        }`,
        false,
      );
      return;
    }

    setIsLoading(true);

    const payload = {
      manufacturingPlantId: currentEmployee.manufacturingPlants[0].id,
      startDate,
      positionId: currentEmployee.position.id,
      employeeId: currentEmployee.id,
      evaluations,
      areaTgeId: responseTrainingGuide.configTg.areaManager.id,
      humanResourceTgeId:
        responseTrainingGuide.configTg.humanResourceManager.id,
    };

    if (!responseTrainingGuide.trainingGuide) {
      TrainingGuidesService.create(payload).then(() => {
        notify("Guía de entrenamiento creada correctamente", true);
        handleClose();
      });
    } else {
      TrainingGuidesService.update(
        responseTrainingGuide.trainingGuide.id,
        payload,
      ).then(() => {
        notify("Guía de entrenamiento actualizada correctamente", true);
        handleClose();
      });
    }
  };

  return (
    <>
      {signatureUser && responseTrainingGuide?.trainingGuide && (
        <SignatureDialog
          currentId={responseTrainingGuide.trainingGuide.id}
          signatureUser={signatureUser}
          setOpen={() => setSignatureUser(undefined)}
          handleClose={handleClose}
        />
      )}
      <Dialog
        fullScreen
        open={true}
        onClose={handleClose}
        slots={{ transition: Transition }}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Guía de entrenamiento
            </Typography>
            {isLoading ? (
              <Box sx={{ display: "flex" }}>
                <CircularProgress color="secondary" />
              </Box>
            ) : !emailsEditors.includes(email) ? null : (
              <Button color="inherit" onClick={saveTrainingGuide}>
                Guardar
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <div>
          <Grid container>
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6,
              }}
            >
              <List>
                <ListItemButton>
                  <ListItemText
                    primary={currentEmployee.code}
                    secondary="Código"
                  />
                </ListItemButton>
                <Divider />
                <ListItemButton>
                  <ListItemText
                    primary={currentEmployee.name}
                    secondary="Nombre"
                  />
                </ListItemButton>
                <Divider />
                <ListItemButton>
                  <ListItemText
                    primary={currentEmployee.position.name}
                    secondary="Cargo"
                  />
                </ListItemButton>
                <Divider />
              </List>
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6,
              }}
            >
              <List>
                <ListItemButton>
                  <ListItemText
                    primary={currentEmployee.area.name}
                    secondary="Área"
                  />
                </ListItemButton>
                <Divider />
                <ListItemButton>
                  <ListItemText
                    primary={
                      !responseTrainingGuide?.trainingGuide
                        ? "0%"
                        : responseTrainingGuide.trainingGuide
                              .percentageOfCompliance > 0
                          ? `${responseTrainingGuide.trainingGuide.percentageOfCompliance}%`
                          : "0%"
                    }
                    secondary="Porcentaje de cumplimiento"
                  />
                </ListItemButton>
                <Divider />
                <ListItemButton>
                  <p>Fecha de inicio del entrenamiento * </p>
                  <Paper style={{ marginLeft: 10 }}>
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es"
                      localeText={
                        esES.components.MuiLocalizationProvider.defaultProps
                          .localeText
                      }
                    >
                      <DatePicker
                        disabled={!emailsEditors.includes(email)}
                        format="DD/MM/YYYY"
                        maxDate={dayjs()}
                        value={startDate}
                        onChange={(newValue: Dayjs | null) =>
                          setStartDate(newValue)
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          } as any,
                        }}
                      />
                    </LocalizationProvider>
                  </Paper>
                </ListItemButton>
                <Divider />
              </List>
            </Grid>
            {evaluationsInitial.filter((evalItem) => evalItem.evaluation === "")
              .length === 0 && (
              <>
                <Grid
                  size={{
                    xs: 12,
                    sm: 4,
                    md: 4,
                  }}
                >
                  <List>
                    <ListItemButton
                      onClick={() => {
                        if (
                          responseTrainingGuide?.trainingGuide
                            ?.signatureEmployee ||
                          !emailsEditors.includes(email)
                        )
                          return;

                        const id = currentEmployee.id;

                        if (!id) return;

                        setSignatureUser({
                          userId: id,
                          type: "employee",
                        });
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {!responseTrainingGuide?.trainingGuide
                              ?.signatureEmployee ? (
                              <WatchLaterIcon color="warning" />
                            ) : (
                              <CheckCircleIcon style={{ fill: "green" }} />
                            )}
                            {currentEmployee.name}
                          </Box>
                        }
                        secondary="Firma colaborador"
                      />
                    </ListItemButton>
                    <Divider />
                  </List>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    sm: 4,
                    md: 4,
                  }}
                >
                  <List>
                    <ListItemButton
                      onClick={() => {
                        if (
                          responseTrainingGuide?.trainingGuide
                            ?.signatureAreaManager ||
                          userSessionId !==
                            responseTrainingGuide?.trainingGuide?.areaManager
                              ?.id
                        )
                          return;

                        const id =
                          responseTrainingGuide?.trainingGuide?.areaManager?.id;

                        if (!id) return;

                        setSignatureUser({
                          userId: id,
                          type: "areaManager",
                        });
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {!responseTrainingGuide?.trainingGuide
                              ?.signatureAreaManager ? (
                              <WatchLaterIcon color="warning" />
                            ) : (
                              <CheckCircleIcon style={{ fill: "green" }} />
                            )}
                            {
                              responseTrainingGuide?.trainingGuide?.areaManager
                                .name
                            }
                          </Box>
                        }
                        secondary="Firma jefe de área"
                      />
                    </ListItemButton>
                    <Divider />
                  </List>
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    sm: 4,
                    md: 4,
                  }}
                >
                  <List>
                    <ListItemButton
                      onClick={() => {
                        if (
                          responseTrainingGuide?.trainingGuide
                            ?.signatureHumanResourceManager ||
                          userSessionId !==
                            responseTrainingGuide?.trainingGuide
                              ?.humanResourceManager?.id
                        )
                          return;

                        const id =
                          responseTrainingGuide?.trainingGuide
                            ?.humanResourceManager?.id;

                        if (!id) return;

                        setSignatureUser({
                          userId: id,
                          type: "humanResourceManager",
                        });
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {!responseTrainingGuide?.trainingGuide
                              ?.signatureHumanResourceManager ? (
                              <WatchLaterIcon color="warning" />
                            ) : (
                              <CheckCircleIcon style={{ fill: "green" }} />
                            )}
                            {
                              responseTrainingGuide?.trainingGuide
                                ?.humanResourceManager.name
                            }
                          </Box>
                        }
                        secondary="Firma jefe de recursos humanos"
                      />
                    </ListItemButton>
                    <Divider />
                  </List>
                </Grid>
              </>
            )}
          </Grid>

          {!evaluations.length ? (
            <div style={{ padding: 20 }}>
              <Box sx={{ width: "100%" }}>
                <Skeleton />
                <Skeleton animation="wave" />
                <Skeleton animation={false} />
              </Box>
            </div>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Referencia</StyledTableCell>
                    <StyledTableCell
                      style={{
                        width: 350,
                      }}
                    >
                      Tema
                    </StyledTableCell>
                    <StyledTableCell
                      style={{
                        width: 150,
                      }}
                    >
                      Fecha
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      Duración (horas)
                    </StyledTableCell>
                    <StyledTableCell>Responsable(s)</StyledTableCell>
                    <StyledTableCell>Evaluación</StyledTableCell>
                    <StyledTableCell
                      style={{
                        width: 450,
                      }}
                    >
                      Observaciones
                    </StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {responseTrainingGuide?.configTg?.topics?.map((row, idx) => {
                    return (
                      <StyledTableRow
                        key={row.topic.name}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <StyledTableCell component="th" scope="row">
                          {idx + 1}
                        </StyledTableCell>
                        <StyledTableCell>{row.topic.name}</StyledTableCell>
                        <StyledTableCell>
                          <Paper>
                            <LocalizationProvider
                              dateAdapter={AdapterDayjs}
                              adapterLocale="es"
                              localeText={
                                esES.components.MuiLocalizationProvider
                                  .defaultProps.localeText
                              }
                            >
                              <DatePicker
                                disabled={!emailsEditors.includes(email)}
                                format="DD/MM/YYYY"
                                maxDate={dayjs()}
                                value={evaluations[idx].date}
                                onChange={(newValue: Dayjs | null) =>
                                  setEvaluations((prev) => {
                                    const updated = [...prev];
                                    updated[idx].date = newValue;
                                    if (
                                      !updated[idx].evaluation &&
                                      row.topic.typeOfEvaluation ===
                                        TypesOfEvaluations.BOOLEAN
                                    ) {
                                      updated[idx].evaluation = "false";
                                    }
                                    return updated;
                                  })
                                }
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                  } as any,
                                }}
                              />
                            </LocalizationProvider>
                          </Paper>
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          {row.duration}
                        </StyledTableCell>
                        <StyledTableCell>
                          {row.responsibles
                            .map((responsible) => responsible.name)
                            .join(" / ")}
                        </StyledTableCell>
                        <StyledTableCell>
                          {row.topic.typeOfEvaluation ===
                          TypesOfEvaluations.BOOLEAN ? (
                            <FormGroup>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                              >
                                <Typography>No</Typography>
                                <AntSwitch
                                  disabled={!emailsEditors.includes(email)}
                                  slotProps={{
                                    input: { "aria-label": "ant design" },
                                  }}
                                  checked={
                                    evaluations[idx].evaluation === "true"
                                  }
                                  onChange={(e) =>
                                    setEvaluations((prev) => {
                                      const updated = [...prev];
                                      updated[idx].evaluation = e.target.checked
                                        ? "true"
                                        : "false";
                                      return updated;
                                    })
                                  }
                                />
                                <Typography>Si</Typography>
                              </Stack>
                            </FormGroup>
                          ) : (
                            <Paper>
                              <FormControl fullWidth>
                                <Select
                                  disabled={!emailsEditors.includes(email)}
                                  value={evaluations[idx].evaluation || ""}
                                  onChange={(e: SelectChangeEvent<string>) =>
                                    setEvaluations((prev) => {
                                      const updated = [...prev];
                                      updated[idx].evaluation = e.target.value;
                                      return updated;
                                    })
                                  }
                                >
                                  <MenuItem value={1}>1</MenuItem>
                                  <MenuItem value={2}>2</MenuItem>
                                  <MenuItem value={3}>3</MenuItem>
                                  <MenuItem value={4}>4</MenuItem>
                                  <MenuItem value={5}>5</MenuItem>
                                </Select>
                              </FormControl>
                            </Paper>
                          )}
                        </StyledTableCell>
                        <StyledTableCell>
                          <Paper sx={{ p: 2 }}>
                            <TextField
                              disabled={!emailsEditors.includes(email)}
                              multiline
                              rows={3}
                              variant="standard"
                              fullWidth
                              value={evaluations[idx].observations || ""}
                              onChange={(e) =>
                                setEvaluations((prev) => {
                                  const updated = [...prev];
                                  updated[idx].observations = e.target.value;
                                  return updated;
                                })
                              }
                              label="Observaciones"
                            />
                          </Paper>
                        </StyledTableCell>
                      </StyledTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </Dialog>
    </>
  );
}

const TrainingGuidePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>();

  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeName = searchParams.get("employee");

  const [filters, setFilters] = useState<{
    name: string;
    manufacturingPlantId: string;
  }>({
    manufacturingPlantId: "",
    name: "",
  });

  const {
    manufacturingPlants,
    email,
    id: userSessionId,
  } = useUserSessionStore(useShallow((state) => state));

  const theme = useTheme();

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - employees.length) : 0;

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

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    EmployeesService.findAll({
      manufacturingPlantId: Number(filters.manufacturingPlantId || 0),
      name: filters.name,
      ...(!emailsEditors.includes(email) && { assignedUserId: userSessionId }),
    })
      .then(setEmployees)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  useEffect(() => {
    if (employeeName && employees.length) {
      setFilters((prev) => ({ ...prev, name: employeeName }));

      const employeeFound = employees.find(
        (employee) =>
          employee.name.toLowerCase() === employeeName.toLowerCase(),
      );

      if (!employeeFound) {
        notify(
          "No se encontró el colaborador, verifica que el nombre sea correcto",
          false,
        );
        return;
      }

      setCurrentEmployee(employeeFound);
    }
  }, [employeeName, employees]);

  return (
    <>
      {!!currentEmployee && (
        <ScreenEdition
          currentEmployee={currentEmployee}
          setOpen={() => {
            setCurrentEmployee(undefined);
            getData();
            if (employeeName) {
              const params = new URLSearchParams(searchParams);
              params.delete("employee");
              router.push(`?${params.toString()}`);
              setFilters((prev) => ({ ...prev, name: "" }));
            }
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
            Guías de entrenamiento
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
                <FilterListIcon sx={{ pt: 1 }} /> Filtros ({employees.length})
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
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => getData()}
                  ></Button>
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
                    {[
                      "",
                      "ID",
                      "Nombre",
                      "Planta",
                      "Área",
                      "Puesto",
                      "% de cumplimiento",
                      "Firma colaborador",
                      "Firma jefe de área",
                      "Firma jefe RH",
                      "Detalles",
                    ].map((column) => (
                      <StyledTableCell key={column}>{column}</StyledTableCell>
                    ))}
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {(rowsPerPage > 0
                    ? employees.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                    : employees
                  ).map((row) => (
                    <Row
                      key={row.name}
                      row={row}
                      setCurrentEmployee={setCurrentEmployee}
                    />
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
                        { label: "Todos", value: -1 },
                      ]}
                      colSpan={colSpan}
                      count={employees.length}
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
};

export default TrainingGuidePage;
