import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import Image from "next/image";

import { Box } from "@mui/material";
import { Collapse } from "@mui/material";
import { IconButton } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { TablePagination } from "@mui/material";
import { TableSortLabel } from "@mui/material";
import { TextField } from "@mui/material";
import { Typography } from "@mui/material";
import { Paper } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import DeleteIcon from "@mui/icons-material/Delete";

import { stringYYYYMMDDToDDMMYYYY } from "@shared/utils";
import { resolveTriStateSort } from "@shared/utils";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { Epp } from "@interfaces";

function Row({
  epp,
  currentUserId,
  onHistoryDeleted,
}: {
  epp: Epp;
  currentUserId: number;
  onHistoryDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);

  const confirmRemoveHistory = (equipmentHistoryId: number) => {
    toast.warning("Confirmar eliminación", {
      description: "¿Desea eliminar este registro del historial?",
      duration: 10000,
      cancel: {
        label: "Cancelar",
        onClick: () => undefined,
      },
      action: {
        label: "Eliminar",
        onClick: async () => {
          await EppService.removeHistory(equipmentHistoryId);
          onHistoryDeleted();
        },
      },
    });
  };

  return (
    <>
      <StyledTableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <StyledTableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        <StyledTableCell component="th" scope="row">
          {epp.name}
        </StyledTableCell>
        <StyledTableCell>{epp.code}</StyledTableCell>
        <StyledTableCell>{epp.position.name}</StyledTableCell>
        <StyledTableCell>{epp.area.name}</StyledTableCell>
        <StyledTableCell align="center">
          <SimCardDownloadIcon
            color="primary"
            fontSize="large"
            style={{ cursor: "pointer" }}
            onClick={() => EppService.downloadFile(epp.id)}
          />
        </StyledTableCell>
      </StyledTableRow>
      <StyledTableRow>
        <StyledTableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Historial de entrega
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Epp</StyledTableCell>
                    <StyledTableCell>Fecha de entrega</StyledTableCell>
                    <StyledTableCell>Fecha devolución</StyledTableCell>
                    <StyledTableCell>Observaciones</StyledTableCell>
                    <StyledTableCell>Firma</StyledTableCell>
                    <StyledTableCell>Entregado por</StyledTableCell>
                    <StyledTableCell align="center">Acciones</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {epp.epps
                    .flatMap((epp) =>
                      epp.equipments.map((item) => ({
                        ...item,
                        signature: epp.signature,
                        createBy: epp.createBy,
                      })),
                    )
                    .map((equipment) => (
                      <StyledTableRow key={equipment.id}>
                        <StyledTableCell component="th" scope="row">
                          {equipment.equipment.name}
                        </StyledTableCell>
                        <StyledTableCell>
                          {stringYYYYMMDDToDDMMYYYY(equipment.deliveryDate)}
                        </StyledTableCell>
                        <StyledTableCell></StyledTableCell>
                        <StyledTableCell>
                          {equipment.observations}
                        </StyledTableCell>
                        <StyledTableCell>
                          <Image
                            src={equipment.signature}
                            alt="Firma digital"
                            style={{ border: "1px solid #ccc" }}
                            width={75}
                            height={50}
                          />
                        </StyledTableCell>
                        <StyledTableCell>
                          {equipment.createBy.name}
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          {equipment.createBy?.id === currentUserId && (
                            <IconButton
                              aria-label="borrar registro"
                              size="small"
                              color="error"
                              onClick={() => confirmRemoveHistory(equipment.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </StyledTableCell>
      </StyledTableRow>
    </>
  );
}

interface Props {
  data: Epp[];
  onHistoryDeleted: () => void;
}

type Order = "asc" | "desc";
type SortableColumn = "name" | "code" | "position" | "area";

export default function TableEpps({ data, onHistoryDeleted }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<SortableColumn | null>(null);
  const currentUserId = useUserSessionStore((state) => state.id);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleRequestSort = (property: SortableColumn) => {
    const { nextOrder, nextOrderBy } = resolveTriStateSort(
      order,
      orderBy,
      property,
    );

    setOrder(nextOrder);
    setOrderBy(nextOrderBy);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return data;

    return data.filter((epp) => {
      const searchableValues = [
        epp.name,
        String(epp.code),
        epp.position?.name,
        epp.area?.name,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    const getSortValue = (epp: Epp, column: SortableColumn) => {
      switch (column) {
        case "code":
          return Number(epp.code);
        case "position":
          return String(epp.position?.name ?? "").toLowerCase();
        case "area":
          return String(epp.area?.name ?? "").toLowerCase();
        case "name":
        default:
          return String(epp.name ?? "").toLowerCase();
      }
    };

    if (!orderBy) return filteredData;

    return [...filteredData]
      .map((epp, index) => ({ epp, index }))
      .sort((a, b) => {
        const valueA = getSortValue(a.epp, orderBy);
        const valueB = getSortValue(b.epp, orderBy);

        if (valueA < valueB) return order === "asc" ? -1 : 1;
        if (valueA > valueB) return order === "asc" ? 1 : -1;

        return a.index - b.index;
      })
      .map(({ epp }) => epp);
  }, [filteredData, order, orderBy]);

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          size="small"
          variant="filled"
          label="Buscar"
          placeholder="Empleado, cédula, cargo o área"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </Box>
      <TableContainer>
        <Table aria-label="collapsible table" size="small">
          <TableHead>
            <StyledTableRow>
              <StyledTableCell />
              <StyledTableCell
                sortDirection={orderBy === "name" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                >
                  Empleado
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell
                sortDirection={orderBy === "code" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "code"}
                  direction={orderBy === "code" ? order : "asc"}
                  onClick={() => handleRequestSort("code")}
                >
                  Cédula
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell
                sortDirection={orderBy === "position" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "position"}
                  direction={orderBy === "position" ? order : "asc"}
                  onClick={() => handleRequestSort("position")}
                >
                  Cargo
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell
                sortDirection={orderBy === "area" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "area"}
                  direction={orderBy === "area" ? order : "asc"}
                  onClick={() => handleRequestSort("area")}
                >
                  Área
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center">
                Descargar archivo
              </StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {!filteredData.length && (
              <StyledTableRow>
                <StyledTableCell
                  colSpan={6}
                  sx={{ py: 2, textAlign: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron resultados con la búsqueda actual.
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}

            {paginatedData.map((epp) => (
              <Row
                key={epp.id}
                epp={epp}
                currentUserId={currentUserId}
                onHistoryDeleted={onHistoryDeleted}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Filas por página"
        showFirstButton
        showLastButton
      />
    </Paper>
  );
}
