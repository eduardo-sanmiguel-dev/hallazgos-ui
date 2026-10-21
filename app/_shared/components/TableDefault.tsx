import { TableRow } from "@mui/material";
import { TableCell, tableCellClasses } from "@mui/material";
import { styled } from "@mui/material/styles";

import { primarySoftBackground, primaryTextColor } from "../../theme";

// Encabezado en verde tenue con texto oscurecido: el blanco sobre el verde de
// marca no llegaba a contraste AA.
export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: primarySoftBackground(theme),
    color: primaryTextColor(theme),
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));
