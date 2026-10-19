import { Dispatch, SetStateAction } from "react";

import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";

import { stringToDateWithTime } from "@shared/utils";
import { ExtinguisherInspectionsService } from "@services";
import { ExtinguisherInspection } from "@interfaces";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableDefaultServer from "@shared/components/TableDefaultServer";

interface Props {
  rows: ExtinguisherInspection[];
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  count: number;
}

const columns = [
  "ID",
  "Planta",
  "Responsable",
  "Fecha inspección",
  "Evaluaciones",
  "Creación",
  "Creado por",
  "Acciones",
];

export default function ExtinguisherInspectionsTable({
  rows,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  count,
}: Props) {
  const router = useRouter();

  return (
    <TableDefaultServer
      rows={rows}
      columns={columns}
      page={page}
      setPage={setPage}
      rowsPerPage={rowsPerPage}
      setRowsPerPage={setRowsPerPage}
      count={count}
      paintRows={(row: ExtinguisherInspection) => (
        <StyledTableRow key={row.id} hover>
          <StyledTableCell>{row.id}</StyledTableCell>
          <StyledTableCell>
            {row.manufacturingPlant?.name || "-"}
          </StyledTableCell>
          <StyledTableCell>{row.responsible?.name || "-"}</StyledTableCell>
          <StyledTableCell>
            {dayjs(row.inspectionDate).isValid()
              ? dayjs(row.inspectionDate).locale("es").format("DD MMMM YYYY")
              : "-"}
          </StyledTableCell>
          <StyledTableCell>{row.evaluations?.length || 0}</StyledTableCell>
          <StyledTableCell>
            {stringToDateWithTime(row.createdAt)}
          </StyledTableCell>
          <StyledTableCell>{row.createdBy?.name || "-"}</StyledTableCell>
          <StyledTableCell>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Descargar Excel">
                <IconButton
                  color="primary"
                  onClick={() =>
                    ExtinguisherInspectionsService.downloadFile(row.id)
                  }
                >
                  <SimCardDownloadIcon />
                </IconButton>
              </Tooltip>

              {dayjs(row.inspectionDate).isSame(dayjs(), "day") && (
                <Tooltip title="Agregar más evaluaciones">
                  <IconButton
                    color="secondary"
                    onClick={() =>
                      router.push(`/extinguisher-inspection/form?id=${row.id}`)
                    }
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </StyledTableCell>
        </StyledTableRow>
      )}
    />
  );
}
