import { ReactElement, Ref, forwardRef, useState } from "react";

import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import { IconButton } from "@mui/material";
import { Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

import { EvidenceGraphql } from "@hooks";
import DetailsEvidence from "./DetailsEvidence";

export const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  evidenceCurrent: EvidenceGraphql | null;
  handleClose: (refreshData: boolean) => void;
}

export default function EvidencePreview({
  evidenceCurrent,
  handleClose,
}: Props) {
  const [refreshData, setRefreshData] = useState<boolean>(false);

  return (
    <Dialog
      fullScreen
      open={!!evidenceCurrent}
      onClose={() => handleClose(refreshData)}
      slots={{ transition: Transition }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => handleClose(refreshData)}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            #{evidenceCurrent?.id} Detalles del hallazgo
          </Typography>
        </Toolbar>
      </AppBar>
      {evidenceCurrent && (
        <DetailsEvidence
          evidenceCurrent={evidenceCurrent}
          setRefreshData={setRefreshData}
        />
      )}
    </Dialog>
  );
}
