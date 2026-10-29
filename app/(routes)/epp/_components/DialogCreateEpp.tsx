import { ReactNode, useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { AppBar } from "@mui/material";
import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { Grid } from "@mui/material";
import { IconButton } from "@mui/material";
import { Paper } from "@mui/material";
import { Stack } from "@mui/material";
import { TextField } from "@mui/material";
import { Toolbar } from "@mui/material";
import { Tooltip } from "@mui/material";
import { Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DrawIcon from "@mui/icons-material/DrawOutlined";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafetyOutlined";

import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import { EmployeeOption, Equipment, PayloadCreateEpp } from "@interfaces";
import { EmployeesService } from "_services/employees.service";
import SelectDefault from "@components/SelectDefault";
import { EppService, EquipmentsService } from "@services";
import DialogSignatureEpp from "./DialogSignatureEpp";
import { useUserSessionStore } from "@store";
import { notify } from "@shared/utils";
import StatusChip from "@shared/components/StatusChip";
import DetailSection from "@shared/components/DetailSection";
import FormActions from "@shared/components/FormActions";

const formInitial = {
  employee: "",
  equipment: "",
  observations: "",
};
interface Props {
  open: boolean;
  // Si devuelve una promesa, el botón Guardar muestra el spinner hasta que
  // termine y el formulario solo se limpia cuando se guardó correctamente.
  create: (form: PayloadCreateEpp) => Promise<unknown> | void;
}

export default function DialogCreateEpp({ open, create }: Props) {
  const [signature, setSignature] = useState<string>("");
  const [equipmentsNew, setEquipmentsNew] = useState<
    {
      id: number;
      name: string;
      quantity: number;
      observations: string;
      notCanDeliver?: boolean;
    }[]
  >([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [form, setForm] = useState<{
    employee: string;
    equipment: string;
    observations: string;
  }>(formInitial);
  const [openSignature, setOpenSignature] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  useEffect(() => {
    if (manufacturingPlants.length === 1) {
      setManufacturingPlantId(manufacturingPlants[0].id.toString());
    }
  }, [manufacturingPlants]);

  useEffect(() => {
    if (!manufacturingPlantId) return;

    setForm(formInitial);
    setEquipments([]);
    setEmployees([]);
    setEquipmentsNew([]);
    setSignature("");

    // Si falla, el interceptor ya mostró el aviso; la lista queda vacía.
    EquipmentsService.findAll({ manufacturingPlantId })
      .then(setEquipments)
      .catch(() => undefined);

    EmployeesService.findAll({
      manufacturingPlantId: Number(manufacturingPlantId),
    })
      .then((data) => {
        setEmployees(
          data.map((employee) => ({
            ...employee,
            name: `${employee.code} - ${employee.name}`,
          })),
        );
      })
      .catch(() => undefined);
  }, [manufacturingPlantId]);

  const isDisabledSave = useMemo(() => {
    const employeeId = Number(form.employee || 0);
    return !!employeeId && !!equipmentsNew.length && !!signature;
  }, [form, equipmentsNew, signature]);

  const resetForm = () => {
    setSignature("");
    setEquipmentsNew([]);
    setForm({
      employee: "",
      equipment: "",
      observations: "",
    });
  };

  const handleClose = (save: boolean) => {
    if (isSaving) return;

    if (!(save && isDisabledSave)) {
      create({} as PayloadCreateEpp);
      resetForm();
      return;
    }

    setIsSaving(true);
    Promise.resolve(
      create({
        employeeId: Number(form.employee || 0),
        equipments: equipmentsNew.map(({ id, observations, quantity }) => ({
          id,
          observations,
          quantity,
        })),
        signature,
      }),
    )
      .then(resetForm)
      // El error ya lo notifica el servicio; se conservan los datos capturados.
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const handleAddEquipment = async () => {
    const { equipment, observations, employee } = form;

    if (!employee) return notify("Selecciona un colaborador");

    if (equipment) {
      const currentEquipment = equipments.find(
        (eq) => eq.id === Number(equipment),
      );

      if (currentEquipment) {
        const deliveryFrequency = currentEquipment?.deliveryFrequency || 0;

        let notCanDeliver = false;

        if (deliveryFrequency) {
          setIsAdding(true);
          try {
            const { canDeliver, message } =
              await EppService.validateDeliveryFrequency({
                equipmentId: Number(equipment),
                employeeId: Number(employee),
              });

            if (!canDeliver) {
              notify(message);
              notCanDeliver = true;
            }
          } catch {
            // El error ya lo notifica el servicio; el equipo no se agrega.
            return;
          } finally {
            setIsAdding(false);
          }
        }

        setEquipmentsNew([
          ...equipmentsNew,
          {
            id: currentEquipment.id,
            quantity: 1,
            name: currentEquipment.name,
            observations: observations.trim() || "",
            notCanDeliver,
          },
        ]);
        setForm({ ...form, equipment: "", observations: "" });
      }
    }
  };

  const removeEquipment = (id: number) =>
    setEquipmentsNew(equipmentsNew.filter((eq) => eq.id !== id));

  // Lo que falta para poder guardar, en el orden en que se captura.
  const missing = [
    !form.employee && "colaborador",
    !equipmentsNew.length && "equipos",
    !signature && "firma",
  ].filter(Boolean) as string[];
  const employeeName =
    employees.find(({ id }) => String(id) === form.employee)?.name ?? "";
  const equipmentsLabel = `${equipmentsNew.length} ${equipmentsNew.length === 1 ? "equipo" : "equipos"}`;

  // Como los formularios de extintores y Gemba Walk: secciones en el orden
  // de la entrega (a quién, qué, firma) y una barra fija con el resumen y las
  // acciones. Antes, los campos aparecían sueltos en una cuadrícula y
  // "Guardar" quedaba arriba, deshabilitado sin decir qué faltaba.
  return (
    <>
      <DialogSignatureEpp
        open={openSignature}
        setOpen={setOpenSignature}
        setSignature={setSignature}
      />
      <Dialog
        fullScreen
        open={open}
        onClose={() => handleClose(false)}
        slots={{ transition: Transition }}
        slotProps={{ paper: { sx: { backgroundColor: "background.default" } } }}
      >
        <AppBar sx={{ position: "sticky", top: 0 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => handleClose(false)}
              disabled={isSaving}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="h2">
              Registro de EPP
            </Typography>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            width: "100%",
            maxWidth: 960,
            mx: "auto",
            p: { xs: 2, sm: 3 },
            flex: 1,
          }}
        >
          <Stack spacing={3}>
            <DetailSection
              title="Colaborador"
              description="A quién se le entregan los equipos."
            >
              {/* Los selectores ya no se marcan en rojo al estar vacíos (el
                  de equipo volvía a rojo tras cada "Agregar"): la barra al
                  pie dice qué falta. */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <SelectDefault
                    data={manufacturingPlants}
                    label="Planta"
                    value={manufacturingPlantId}
                    onChange={(e) => setManufacturingPlantId(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {manufacturingPlantId ? (
                    <SelectDefault
                      data={employees}
                      label="Colaborador"
                      value={form.employee}
                      onChange={(e) =>
                        setForm({ ...form, employee: e.target.value })
                      }
                    />
                  ) : (
                    <StepHint>
                      Elige la planta para ver sus colaboradores.
                    </StepHint>
                  )}
                </Grid>
              </Grid>
            </DetailSection>

            <DetailSection
              title="Equipos a entregar"
              description="Elige un equipo y toca Agregar; se revisa su frecuencia de entrega."
              action={
                equipmentsNew.length > 0 && (
                  <StatusChip
                    size="small"
                    tone="success"
                    variant="outlined"
                    label={equipmentsLabel}
                  />
                )
              }
            >
              {!form.employee ? (
                <StepHint>Elige primero al colaborador.</StepHint>
              ) : (
                <Stack spacing={2}>
                  <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <SelectDefault
                        data={equipments.filter(
                          (eq) =>
                            !equipmentsNew.some((newEq) => newEq.id === eq.id),
                        )}
                        label="Equipo"
                        value={form.equipment}
                        onChange={(e) =>
                          setForm({ ...form, equipment: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField
                        label="Observaciones"
                        placeholder="Opcional: talla, motivo del cambio…"
                        fullWidth
                        multiline
                        maxRows={4}
                        autoComplete="off"
                        value={form.observations}
                        onChange={(e) =>
                          setForm({ ...form, observations: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        fullWidth
                        onClick={() => handleAddEquipment()}
                        loading={isAdding}
                        loadingPosition="start"
                        disabled={isAdding}
                        sx={{ minHeight: 56 }}
                      >
                        Agregar
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Una lista en todos los tamaños: la tabla de 650 px
                      obligaba a desplazarse de lado en celular. */}
                  {equipmentsNew.length === 0 ? (
                    <DashedArea>
                      <HealthAndSafetyIcon
                        aria-hidden
                        sx={{ fontSize: 36, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        Aún no hay equipos en esta entrega.
                      </Typography>
                    </DashedArea>
                  ) : (
                    <Box
                      component="ul"
                      aria-label="Equipos a entregar"
                      sx={{
                        listStyle: "none",
                        m: 0,
                        p: 0,
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: {
                          xs: "minmax(0, 1fr)",
                          md: "repeat(2, minmax(0, 1fr))",
                        },
                      }}
                    >
                      {equipmentsNew.map((equipment) => (
                        <Paper
                          key={equipment.id}
                          component="li"
                          variant="outlined"
                          sx={(theme) => ({
                            p: 1.5,
                            display: "flex",
                            gap: 1.5,
                            alignItems: "center",
                            borderRadius: 2,
                            // Fuera de la frecuencia: franja de aviso.
                            borderLeft: `4px solid ${
                              equipment.notCanDeliver
                                ? theme.palette.warning.main
                                : theme.palette.success.main
                            }`,
                          })}
                        >
                          <Box
                            aria-hidden
                            sx={(theme) => ({
                              display: "grid",
                              placeItems: "center",
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              flexShrink: 0,
                              color: "primary.main",
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.12,
                              ),
                            })}
                          >
                            <HealthAndSafetyIcon fontSize="small" />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
                            >
                              {equipment.name}
                            </Typography>
                            {equipment.observations && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {equipment.observations}
                              </Typography>
                            )}
                            {equipment.notCanDeliver && (
                              <StatusChip
                                label="Fuera de la frecuencia de entrega"
                                tone="warning"
                                size="small"
                                // En celular, en dos líneas en vez de cortarse.
                                sx={{
                                  mt: 0.5,
                                  height: "auto",
                                  maxWidth: "100%",
                                  "& .MuiChip-label": {
                                    whiteSpace: "normal",
                                    py: 0.25,
                                  },
                                }}
                              />
                            )}
                          </Box>
                          <Tooltip title="Quitar">
                            <IconButton
                              color="error"
                              aria-label={`Quitar ${equipment.name}`}
                              onClick={() => removeEquipment(equipment.id)}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Stack>
              )}
            </DetailSection>

            <DetailSection
              title="Firma"
              description="El colaborador firma de recibido."
              action={
                signature && (
                  <StatusChip size="small" tone="success" label="Firmado" />
                )
              }
            >
              {!form.employee ? (
                <StepHint>Elige primero al colaborador.</StepHint>
              ) : signature ? (
                // Como una firma en papel: a todo el ancho, la firma centrada
                // sobre la línea y el nombre debajo; "Volver a firmar" al pie
                // (antes, la imagen a la izquierda y el botón suelto).
                <Paper
                  variant="outlined"
                  sx={{ borderRadius: 2, overflow: "hidden" }}
                >
                  {/* Fondo blanco también en oscuro, como se guarda. */}
                  <Box
                    sx={{
                      backgroundColor: "#fff",
                      color: "rgba(0, 0, 0, 0.6)",
                      px: { xs: 2, sm: 4 },
                      pt: 2,
                      pb: 1.5,
                      textAlign: "center",
                    }}
                  >
                    <Image
                      src={signature}
                      alt="Firma del colaborador"
                      width={350}
                      height={150}
                      style={{
                        display: "block",
                        margin: "0 auto",
                        width: "auto",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: 140,
                        background: "#fff",
                      }}
                    />
                    <Box
                      aria-hidden
                      sx={{
                        maxWidth: 420,
                        mx: "auto",
                        mt: 0.5,
                        borderTop: "1px solid rgba(0, 0, 0, 0.42)",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75, fontWeight: 600, color: "#212121" }}
                    >
                      {employeeName}
                    </Typography>
                    <Typography variant="caption">Firma de recibido</Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      px: 1.5,
                      py: 1,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<DrawIcon />}
                      onClick={() => setOpenSignature(true)}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      Volver a firmar
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <DashedArea>
                  <DrawIcon
                    aria-hidden
                    sx={{ fontSize: 36, color: "text.secondary" }}
                  />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Pide al colaborador que firme al terminar de agregar los
                    equipos.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<DrawIcon />}
                    onClick={() => setOpenSignature(true)}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Firmar
                  </Button>
                </DashedArea>
              )}
            </DetailSection>
          </Stack>
        </Box>

        {/* Al pie y siempre a la vista: resumen, lo que falta y acciones. */}
        <Paper
          elevation={3}
          square
          sx={(theme) => ({
            position: "sticky",
            bottom: 0,
            zIndex: 2,
            borderTop: `2px solid ${theme.palette.primary.main}`,
          })}
        >
          <Box
            sx={{
              maxWidth: 960,
              mx: "auto",
              p: 1.5,
              pb: "calc(12px + env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
              gap: 1.5,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              aria-live="polite"
              sx={{ flex: 1, alignItems: "center", flexWrap: "wrap" }}
            >
              <StatusChip
                size="small"
                tone={equipmentsNew.length ? "success" : "default"}
                label={equipmentsLabel}
              />
              <StatusChip
                size="small"
                tone={signature ? "success" : "default"}
                label={signature ? "Firmado" : "Sin firma"}
              />
              {missing.length > 0 && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Falta: {formatList(missing)}
                </Typography>
              )}
            </Stack>
            <FormActions
              onCancel={() => handleClose(false)}
              onSave={() => handleClose(true)}
              isSaving={isSaving}
              isSaveDisabled={!isDisabledSave}
              inline
            />
          </Box>
        </Paper>
      </Dialog>
    </>
  );
}

/** "a", "a y b", "a, b y c". */
const formatList = (items: string[]) =>
  items.length > 1
    ? `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`
    : items[0];

/** Indica el paso anterior que falta (en lugar de esconder la sección). */
function StepHint({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="body2"
      sx={{
        color: "text.secondary",
        py: { sm: 2 },
        fontStyle: "italic",
      }}
    >
      {children}
    </Typography>
  );
}

/** Área punteada para lo que aún no se captura (equipos, firma). */
function DashedArea({ children }: { children: ReactNode }) {
  return (
    <Stack
      spacing={1.5}
      sx={(theme) => ({
        alignItems: "center",
        textAlign: "center",
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "2px dashed",
        borderColor: "divider",
        backgroundColor: alpha(theme.palette.text.primary, 0.03),
      })}
    >
      {children}
    </Stack>
  );
}
