import { useEffect, useState } from "react";

import { Dialog } from "@mui/material";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { Button } from "@mui/material";
import { Grid } from "@mui/material";
import { Typography } from "@mui/material";
import { Switch } from "@mui/material";
import { FormControlLabel } from "@mui/material";

import dayjs from "@shared/libs/dayjs";

import SelectDefault from "@components/SelectDefault";
import DateFieldDMY from "./DateFieldDMY";
import TimeFieldHM from "./TimeFieldHM";

export interface CalendarOption {
  id: number;
  name: string;
}

// Agregar: varios días x varias zonas a una misma hora.
export interface DialogCreateState {
  mode: "create";
  dates: string[]; // YYYY-MM-DD
  time: string; // HH:mm
}

// Editar: un evento (nuevo sin guardar o ya guardado).
export interface DialogEditState {
  mode: "edit";
  eventKey: string;
  isNew: boolean;
  gembaWalkZoneId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  isAdditional: boolean;
}

export type DialogState = DialogCreateState | DialogEditState;

interface Props {
  state: DialogState | null;
  zones: CalendarOption[];
  onClose: () => void;
  onCreate: (
    zoneIds: string[],
    dates: string[],
    time: string,
    isAdditional: boolean,
  ) => void;
  onEdit: (
    eventKey: string,
    gembaWalkZoneId: string,
    date: string,
    time: string,
    isAdditional: boolean,
  ) => void;
  onRemoveNew: (eventKey: string) => void;
}

const formatDates = (dates: string[]) =>
  dates.length === 1
    ? dayjs(dates[0], "YYYY-MM-DD").format("DD/MM/YYYY")
    : `${dates.length} días: ${dayjs(dates[0], "YYYY-MM-DD").format("DD/MM/YYYY")} al ${dayjs(dates[dates.length - 1], "YYYY-MM-DD").format("DD/MM/YYYY")}`;

export default function DialogCalendarEvent({
  state,
  zones,
  onClose,
  onCreate,
  onEdit,
  onRemoveNew,
}: Props) {
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [isAdditional, setIsAdditional] = useState<boolean>(false);

  useEffect(() => {
    if (!state) return;

    setTime(state.time);

    if (state.mode === "create") {
      setZoneIds([]);
      setIsAdditional(false);
    } else {
      setZoneId(state.gembaWalkZoneId);
      setDate(state.date);
      setIsAdditional(state.isAdditional);
    }
  }, [state]);

  const isCreate = state?.mode === "create";
  const isInvalid = isCreate
    ? !zoneIds.length || !time
    : !zoneId || !date || !time;

  const confirm = () => {
    if (!state || isInvalid) return;

    if (state.mode === "create") {
      onCreate(zoneIds, state.dates, time, isAdditional);
    } else {
      onEdit(state.eventKey, zoneId, date, time, isAdditional);
    }
  };

  return (
    <Dialog open={!!state} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isCreate ? "Agregar eventos" : "Editar evento"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {state?.mode === "create" && (
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body2"
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                {formatDates(state.dates)}
              </Typography>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            {isCreate ? (
              <SelectDefault
                multiple
                data={zones}
                label="Zonas"
                value={zoneIds}
                onChange={(e) => setZoneIds(e.target.value)}
                validationEmpty
              />
            ) : (
              <SelectDefault
                data={zones}
                label="Zona"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                validationEmpty
              />
            )}
          </Grid>
          {!isCreate && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <DateFieldDMY
                label="Fecha"
                value={date}
                onChange={setDate}
                minDate={dayjs().startOf("day")}
                error={!date}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: isCreate ? 12 : 6 }}>
            <TimeFieldHM
              label="Hora"
              value={time}
              onChange={setTime}
              error={!time}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAdditional}
                  onChange={(e) => setIsAdditional(e.target.checked)}
                />
              }
              label="¿Es adicional?"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {state?.mode === "edit" && state.isNew && (
          <Button
            color="error"
            onClick={() => onRemoveNew(state.eventKey)}
            sx={{ mr: "auto" }}
          >
            Quitar
          </Button>
        )}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={confirm} disabled={isInvalid}>
          {isCreate ? "Agregar" : "Aplicar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
