import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { Stack } from "@mui/material";
import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { Paper } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import { IconButton } from "@mui/material";
import { Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { TextField } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DeleteIcon from "@mui/icons-material/Delete";

import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import { Employee, Equipment, PayloadCreateEpp } from "@interfaces";
import { EmployeesService } from "_services/employees.service";
import SelectDefault from "@components/SelectDefault";
import { EppService, EquipmentsService } from "@services";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import DialogSignatureEpp from "./DialogSignatureEpp";
import { useUserSessionStore } from "@store";
import { notify } from "@shared/utils";

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
  const [employees, setEmployees] = useState<Employee[]>([]);
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

    EquipmentsService.findAll({ manufacturingPlantId }).then(setEquipments);

    EmployeesService.findAll({
      manufacturingPlantId: Number(manufacturingPlantId),
    }).then((data) => {
      setEmployees(
        data.map((employee) => ({
          ...employee,
          name: `${employee.code} - ${employee.name}`,
        })),
      );
    });
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
      >
        <AppBar sx={{ position: "relative" }}>
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
            <Button
              autoFocus
              color="inherit"
              onClick={() => handleClose(true)}
              disabled={!isDisabledSave}
              loading={isSaving}
            >
              Guardar
            </Button>
          </Toolbar>
        </AppBar>
        <Grid container spacing={2} sx={{ p: 5 }}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <SelectDefault
              data={manufacturingPlants}
              label="Planta"
              value={manufacturingPlantId}
              onChange={(e) => setManufacturingPlantId(e.target.value)}
              validationEmpty
            />
          </Grid>
          {manufacturingPlantId && (
            <>
              <Grid
                size={{
                  xs: 12,
                  md: 6,
                  lg: 4,
                }}
              >
                <SelectDefault
                  data={employees}
                  label="Colaborador"
                  value={form.employee}
                  onChange={(e) =>
                    setForm({ ...form, employee: e.target.value })
                  }
                  validationEmpty
                />
              </Grid>
              {form.employee && (
                <>
                  <Grid
                    size={{
                      xs: 12,
                      md: 6,
                      lg: 4,
                    }}
                  >
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
                      validationEmpty
                    />
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      md: 6,
                      lg: 4,
                    }}
                  >
                    <Paper sx={{ p: 2 }}>
                      <TextField
                        multiline
                        rows={4}
                        variant="standard"
                        fullWidth
                        value={form.observations}
                        onChange={(e) =>
                          setForm({ ...form, observations: e.target.value })
                        }
                        label="Observaciones"
                      />
                    </Paper>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      md: 6,
                      lg: 4,
                    }}
                  >
                    <Stack spacing={2} direction="column">
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        fullWidth
                        onClick={() => handleAddEquipment()}
                        loading={isAdding}
                        loadingPosition="start"
                        disabled={isAdding}
                      >
                        Agregar
                      </Button>
                      <Button
                        color="secondary"
                        variant="contained"
                        startIcon={<VerifiedUserIcon />}
                        onClick={() => setOpenSignature(true)}
                      >
                        Firmar
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      md: 6,
                      lg: 3,
                    }}
                  >
                    {signature ? (
                      <Image
                        src={signature}
                        alt="Firma del colaborador"
                        width={350}
                        height={150}
                      />
                    ) : (
                      <center>
                        <Typography variant="body2" color="text.secondary">
                          No hay firma
                        </Typography>
                      </center>
                    )}
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      md: 12,
                      lg: 12,
                    }}
                  >
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                          <StyledTableRow>
                            <StyledTableCell>Equipo</StyledTableCell>
                            <StyledTableCell>Observaciones</StyledTableCell>
                            <StyledTableCell>
                              ¿Se debería entregar?
                            </StyledTableCell>
                            <StyledTableCell>Eliminar</StyledTableCell>
                          </StyledTableRow>
                        </TableHead>
                        <TableBody>
                          {equipmentsNew.map((equipment) => (
                            <StyledTableRow
                              key={equipment.id}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                              }}
                            >
                              <StyledTableCell component="th" scope="row">
                                {equipment.name}
                              </StyledTableCell>
                              <StyledTableCell>
                                {equipment.observations}
                              </StyledTableCell>
                              <StyledTableCell>
                                {!equipment.notCanDeliver ? "Sí" : "No"}
                              </StyledTableCell>
                              <StyledTableCell>
                                <Button
                                  color="error"
                                  variant="contained"
                                  aria-label={`Quitar ${equipment.name}`}
                                  onClick={() =>
                                    setEquipmentsNew(
                                      equipmentsNew.filter(
                                        (eq) => eq.id !== equipment.id,
                                      ),
                                    )
                                  }
                                >
                                  <DeleteIcon />
                                </Button>
                              </StyledTableCell>
                            </StyledTableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </>
              )}
            </>
          )}
        </Grid>
      </Dialog>
    </>
  );
}
