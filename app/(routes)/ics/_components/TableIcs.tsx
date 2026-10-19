import { useState } from "react";
//import { useRouter } from "next/navigation";

//import EditIcon from "@mui/icons-material/Edit";

//import { notify, stringToDateWithTime } from "@shared/utils";
import { notify } from "@shared/utils";
import { ICSData } from "@interfaces";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, RowActions } from "@shared/components/RowActions";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableDefaultServer, {
  type ServerPagination,
} from "@shared/components/TableDefaultServer";
import { IcsService } from "@services";

interface Props {
  rows: ICSData[];
  getData: () => void;
  pagination: ServerPagination;
}

const columns = [
  "ID",
  "Planta",
  "Regla de vida",
  "Estandar de comportamiento",
  "Área al que aplica",
  "Personas totales",
  "Personas cumpliendo el estándar",
  "Personas no cumpliendo el estándar",
  "Índice de comportamiento seguro (%)",
  //"Fecha de creación",
  "Acciones",
];

export default function TableIcs({
  rows,
  getData,
  pagination,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //const router = useRouter();

  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    IcsService.remove(id)
      .then(() => {
        notify("Ics eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: ICSData) => {
    const confirmed = await confirm({
      title: "Eliminar registro de ICS",
      description: `¿Deseas eliminar el registro de ICS #${row.id}?`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });

    if (confirmed) remove(row.id);
  };

  return (
    <>
      <TableDefaultServer
        rows={rows}
        columns={columns}
        {...pagination}
        paintRows={(row: ICSData) => {
          return (
            <StyledTableRow key={row.id}>
              <StyledTableCell component="th" scope="row">
                {row.id}
              </StyledTableCell>
              <StyledTableCell>{row.manufacturingPlant.name}</StyledTableCell>
              <StyledTableCell>{row.ruleOfLife.name}</StyledTableCell>
              <StyledTableCell>
                {row.standardOfBehavior?.name || ""}
              </StyledTableCell>
              <StyledTableCell>{row.areaOfBehavior?.name || ""}</StyledTableCell>
              <StyledTableCell>{row.totalPeople}</StyledTableCell>
              <StyledTableCell>{row.totalCorrectPeople}</StyledTableCell>
              <StyledTableCell>{row.totalIncorrectPeople}</StyledTableCell>
              <StyledTableCell>{row.icsPercentage}%</StyledTableCell>
              {/* <StyledTableCell style={{ minWidth: 180 }}>
                {row.createdAt ? stringToDateWithTime(row.createdAt) : ""}
              </StyledTableCell> */}
              <StyledTableCell>
                <RowActions>
                  {/* <Chip
                    icon={<EditIcon />}
                    label="Editar"
                    color="warning"
                    onClick={() => router.push("/employees/form?id=" + row.id)}
                  /> */}
                  <DeleteAction
                    onClick={() => confirmRemove(row)}
                    disabled={isLoading}
                  />
                </RowActions>
              </StyledTableCell>
            </StyledTableRow>
          );
        }}
      />
      {confirmDialog}
    </>
  );
}
