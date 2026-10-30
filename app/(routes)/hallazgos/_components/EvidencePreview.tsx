import { ReactElement, Ref, forwardRef, useId, useState } from "react";

import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import { IconButton } from "@mui/material";
import { Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

import type { EvidenceRow } from "@interfaces";
import DetailsEvidence from "./DetailsEvidence";
import {
  primaryAccentBorder,
  primarySoftBackground,
  primaryTextColor,
} from "../../../theme";

export const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  evidenceCurrent: EvidenceRow | null;
  handleClose: (refreshData: boolean) => void;
}

export default function EvidencePreview({
  evidenceCurrent,
  handleClose,
}: Props) {
  const [refreshData, setRefreshData] = useState<boolean>(false);
  const titleId = useId();

  return (
    <Dialog
      fullScreen
      open={!!evidenceCurrent}
      onClose={() => handleClose(refreshData)}
      slots={{ transition: Transition }}
      aria-labelledby={titleId}
    >
      {/* Barra fija con el verde tenue y la línea de acento de los
          encabezados de tabla, con su texto verde oscuro (AA en los tres
          temas). Opaca: el tono va sobre el fondo del papel para que el
          contenido no se vea al pasar debajo. */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={(theme) => ({
          borderBottom: primaryAccentBorder(theme),
          color: primaryTextColor(theme),
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(${primarySoftBackground(theme)}, ${primarySoftBackground(theme)})`,
        })}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => handleClose(refreshData)}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id={titleId}
            sx={{ ml: 1, flex: 1, fontWeight: 700 }}
            variant="h6"
            component="h1"
          >
            Hallazgo #{evidenceCurrent?.id}
          </Typography>
        </Toolbar>
      </AppBar>
      {evidenceCurrent && (
        <DetailsEvidence
          // Otro hallazgo: estado nuevo (comentarios, foto abierta).
          key={evidenceCurrent.id}
          evidenceCurrent={evidenceCurrent}
          setRefreshData={setRefreshData}
        />
      )}
    </Dialog>
  );
}
