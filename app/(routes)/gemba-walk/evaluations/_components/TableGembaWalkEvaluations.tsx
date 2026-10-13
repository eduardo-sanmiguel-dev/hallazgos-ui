import { useState } from "react";

import { useRouter } from "next/navigation";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "sonner";

import { notify, stringToDateWithTime } from "@shared/utils";
import TableDefault, {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { GembaWalkEvaluation } from "@interfaces";
import { GembaWalkEvaluationsService } from "@services";

interface Props {
  rows: GembaWalkEvaluation[];
  getData: () => void;
}

const columns = [
  "ID",
  "Planta",
  "Categoría",
  "Área",
  "Descripción",
  "Creado por",
  "Actualizado por",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableGembaWalkEvaluations({ rows, getData }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const remove = (id: number) => {
    setIsLoading(true);
    GembaWalkEvaluationsService.remove(id)
      .then(() => {
        notify("Concepto eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = (row: GembaWalkEvaluation) => {
    toast.warning("Confirmar eliminación", {
      description: `¿Desea eliminar el concepto #${row.id} (${row.category} - ${row.area})?`,
      duration: 10000,
      cancel: {
        label: "Cancelar",
        onClick: () => undefined,
      },
      action: {
        label: "Eliminar",
        onClick: () => remove(row.id),
      },
    });
  };

  return (
    <TableDefault
      rows={rows}
      columns={columns}
      paintRows={(row: GembaWalkEvaluation) => (
        <StyledTableRow key={row.id}>
          <StyledTableCell component="th" scope="row">
            {row.id}
          </StyledTableCell>
          <StyledTableCell>
            {row.manufacturingPlant?.name || "-"}
          </StyledTableCell>
          <StyledTableCell>{row.category}</StyledTableCell>
          <StyledTableCell>{row.area}</StyledTableCell>
          <StyledTableCell sx={{ minWidth: 320, whiteSpace: "pre-line" }}>
            {row.description}
          </StyledTableCell>
          <StyledTableCell>{row.createdBy?.name || "-"}</StyledTableCell>
          <StyledTableCell>{row.updatedBy?.name || "-"}</StyledTableCell>
          <StyledTableCell>
            {stringToDateWithTime(row.createdAt)}
          </StyledTableCell>
          <StyledTableCell>
            {stringToDateWithTime(row.updatedAt)}
          </StyledTableCell>
          <StyledTableCell>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<EditIcon />}
                label="Editar"
                color="warning"
                onClick={() =>
                  router.push("/gemba-walk/evaluations/form?id=" + row.id)
                }
              />
              <Chip
                icon={<DeleteIcon />}
                label="Eliminar"
                color="error"
                onClick={() => confirmRemove(row)}
                disabled={isLoading}
              />
            </Stack>
          </StyledTableCell>
        </StyledTableRow>
      )}
    />
  );
}
