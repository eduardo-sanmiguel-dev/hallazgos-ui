import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import SelectDefault from "@components/SelectDefault";
import { EvidenceGraphql } from "@hooks";
import { User } from "@interfaces";
import { EvidencesService, UsersService } from "@services";
import { notify } from "@shared/utils";

interface SimpleUser {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  evidenceCurrent: EvidenceGraphql | null;
  handleClose: (refresh?: boolean) => void;
}

const toUniqueUsers = (users: Array<{ id: number; name: string }>) => {
  const uniqueUsers = new Map<number, SimpleUser>();

  users.forEach((user) => {
    if (!uniqueUsers.has(Number(user.id))) {
      uniqueUsers.set(Number(user.id), {
        id: Number(user.id),
        name: user.name,
      });
    }
  });

  return Array.from(uniqueUsers.values());
};

export default function ReassignResponsiblesEvidence({
  isOpen,
  evidenceCurrent,
  handleClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [responsibleToAddId, setResponsibleToAddId] = useState("");
  const [availableResponsibles, setAvailableResponsibles] = useState<User[]>(
    [],
  );
  const [selectedResponsibles, setSelectedResponsibles] = useState<
    SimpleUser[]
  >([]);

  const currentPlantId = evidenceCurrent?.manufacturingPlant?.id;

  const sortedAvailableResponsibles = useMemo(() => {
    return [...availableResponsibles].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
  }, [availableResponsibles]);

  const hasAtLeastOneResponsible = selectedResponsibles.length > 0;

  useEffect(() => {
    if (!isOpen || !evidenceCurrent) {
      setResponsibleToAddId("");
      setAvailableResponsibles([]);
      setSelectedResponsibles([]);
      return;
    }

    const initialResponsibles =
      evidenceCurrent.responsibles.length > 0
        ? evidenceCurrent.responsibles
        : evidenceCurrent.supervisors;

    setSelectedResponsibles(toUniqueUsers(initialResponsibles));
    setResponsibleToAddId("");

    if (!currentPlantId) {
      setAvailableResponsibles([]);
      return;
    }

    UsersService.findAll({
      manufacturingPlantId: String(currentPlantId),
    })
      .then(setAvailableResponsibles)
      .catch(() => setAvailableResponsibles([]));
  }, [currentPlantId, evidenceCurrent, isOpen]);

  const handleAddResponsible = (responsibleId: string) => {
    setResponsibleToAddId(responsibleId);

    if (!responsibleId) {
      return;
    }

    const responsibleFound = sortedAvailableResponsibles.find(
      (responsible) => String(responsible.id) === responsibleId,
    );

    if (!responsibleFound) {
      setResponsibleToAddId("");
      return;
    }

    const alreadyAdded = selectedResponsibles.some(
      (responsible) => Number(responsible.id) === Number(responsibleFound.id),
    );

    if (!alreadyAdded) {
      setSelectedResponsibles((prev) => [
        ...prev,
        {
          id: Number(responsibleFound.id),
          name: responsibleFound.name,
        },
      ]);
    }

    setResponsibleToAddId("");
  };

  const handleRemoveResponsible = (responsibleId: number) => {
    setSelectedResponsibles((prev) =>
      prev.filter((responsible) => Number(responsible.id) !== responsibleId),
    );
  };

  const handleSave = () => {
    if (!evidenceCurrent) {
      return;
    }

    if (!hasAtLeastOneResponsible) {
      notify("Debe agregar al menos un responsable", false);
      return;
    }

    setIsLoading(true);

    EvidencesService.reassignResponsibles(
      evidenceCurrent.id,
      selectedResponsibles.map((responsible) => Number(responsible.id)),
    )
      .then(() => {
        notify("Responsables reasignados correctamente", true);
        handleClose(true);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog open={isOpen} onClose={() => handleClose()} fullWidth maxWidth="sm">
      <DialogTitle>Reasignar responsables</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1.5, pb: 2 }}>
          <SelectDefault
            data={sortedAvailableResponsibles}
            label="Responsable"
            value={responsibleToAddId}
            onChange={(event) => handleAddResponsible(event.target.value)}
            isFilter={true}
            helperText={
              !currentPlantId ? "No se encontro planta para este hallazgo" : ""
            }
          />
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Typography
          variant="subtitle2"
          sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}
        >
          <SwapHorizIcon fontSize="small" color="primary" />
          Responsables asignados
        </Typography>

        {selectedResponsibles.length === 0 ? (
          <Typography variant="body2" color="error.main">
            Debe agregar al menos un responsable.
          </Typography>
        ) : (
          <List dense disablePadding>
            {selectedResponsibles.map((responsible) => (
              <ListItem key={responsible.id} divider>
                <ListItemText primary={responsible.name} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() =>
                      handleRemoveResponsible(Number(responsible.id))
                    }
                  >
                    <PersonRemoveIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => handleClose()}
          color="inherit"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          loading={isLoading}
          disabled={!hasAtLeastOneResponsible || isLoading}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
