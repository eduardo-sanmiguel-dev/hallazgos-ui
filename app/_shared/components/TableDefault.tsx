import { TableRow } from "@mui/material";
import { TableCell, tableCellClasses } from "@mui/material";
import { styled } from "@mui/material/styles";

import {
  primaryAccentBorder,
  primarySoftBackground,
  primaryTextColor,
} from "../../theme";

// Encabezado en verde tenue con texto oscurecido (el blanco sobre el verde de
// marca no llegaba a contraste AA) y línea de acento en verde de marca.
export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: primarySoftBackground(theme),
    color: primaryTextColor(theme),
    borderBottom: primaryAccentBorder(theme),
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // Sin borde en la última fila del cuerpo. Solo celdas del cuerpo: la fila
  // de encabezados también es "última" (única en el thead) y perdía su
  // línea de acento.
  [`&:last-child .${tableCellClasses.body}`]: {
    border: 0,
  },
}));
