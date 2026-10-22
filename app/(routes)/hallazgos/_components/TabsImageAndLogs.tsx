import { ReactNode, SyntheticEvent, useEffect, useState } from "react";

import Image from "next/image";

import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import CloseIcon from "@mui/icons-material/Close";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { AppBar } from "@mui/material";
import { Grid } from "@mui/material";
import { Tabs } from "@mui/material";
import { Tab } from "@mui/material";
import { Box } from "@mui/material";
import { Dialog } from "@mui/material";
import { IconButton } from "@mui/material";

import { CommentEvidenceGraphql, EvidenceGraphql } from "@hooks";
import { baseUrlImage, notify } from "@shared/utils";
import { EvidencesService } from "@services";
import ListComments from "./ListComments";

interface TabPanelProps {
  children?: ReactNode;
  dir?: string;
  index: number;
  value: number;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

interface Props {
  evidenceCurrent: EvidenceGraphql;
  setRefreshData: (refreshData: boolean) => void;
  withImages: boolean;
}

export default function TabsImageAndLogs({
  evidenceCurrent,
  setRefreshData,
  withImages,
}: Props) {
  const theme = useTheme();
  const [value, setValue] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<CommentEvidenceGraphql[]>(
    evidenceCurrent.comments,
  );
  const [imageDialog, setImageDialog] = useState<{
    open: boolean;
    src: string;
    title: string;
  }>({
    open: false,
    src: "",
    title: "",
  });

  const imageContainerSx = {
    width: "100%",
    mx: "auto",
    borderRadius: 2,
    overflow: "hidden",
    border: "1px solid",
    borderColor: "divider",
    backgroundColor: "grey.100",
    maxWidth: {
      xs: "100%",
      sm: 560,
      md: 620,
      lg: 720,
    },
  };

  const imageSx = {
    display: "block",
    width: "100%",
    height: "auto",
    maxHeight: "65vh",
    objectFit: "contain" as const,
  };

  const imageCount = [
    evidenceCurrent?.imgEvidence,
    evidenceCurrent?.imgProcess,
    evidenceCurrent?.imgSolution,
  ].filter(Boolean).length;

  const mdSize = imageCount === 1 ? 12 : imageCount === 2 ? 6 : 4;

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const openImageDialog = (src: string, title: string) => {
    setImageDialog({
      open: true,
      src,
      title,
    });
  };

  const closeImageDialog = () => {
    setImageDialog({
      open: false,
      src: "",
      title: "",
    });
  };

  useEffect(() => {
    setRefreshData(false);
  }, [setRefreshData]);

  const addComment = () => {
    EvidencesService.addComment(evidenceCurrent.id, comment).then((data) => {
      setComment("");
      notify("Comentario agregado correctamente", true);
      setComments(data.comments);
      setRefreshData(true);
    });
  };

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          scrollButtons="auto"
          aria-label="full width tabs example"
        >
          {withImages && <Tab label="Imagenes" {...a11yProps(0)} />}
          <Tab
            label={`Comentarios (${comments.length})`}
            {...a11yProps(withImages ? 1 : 0)}
          />
        </Tabs>
      </AppBar>
      {withImages && value === 0 && (
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Grid container spacing={3}>
            {evidenceCurrent?.imgEvidence && (
              <Grid
                size={{
                  xs: 12,
                  sm: imageCount > 1 ? 6 : 12,
                  md: mdSize,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Imagen del hallazgo
                </Typography>
                <Box
                  sx={{ ...imageContainerSx, cursor: "zoom-in" }}
                  onClick={() =>
                    openImageDialog(
                      baseUrlImage(evidenceCurrent.imgEvidence || ""),
                      "Imagen del hallazgo",
                    )
                  }
                >
                  <Image
                    unoptimized
                    src={baseUrlImage(evidenceCurrent.imgEvidence || "")}
                    alt="Hallazgo imagen"
                    width={0}
                    height={0}
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 560px, 720px"
                    style={imageSx}
                  />
                </Box>
              </Grid>
            )}

            {evidenceCurrent.imgProcess && (
              <Grid
                size={{
                  xs: 12,
                  sm: imageCount > 1 ? 6 : 12,
                  md: mdSize,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Imagen del progreso
                </Typography>
                <Box
                  sx={{ ...imageContainerSx, cursor: "zoom-in" }}
                  onClick={() =>
                    openImageDialog(
                      baseUrlImage(evidenceCurrent?.imgProcess || ""),
                      "Imagen del progreso",
                    )
                  }
                >
                  <Image
                    unoptimized
                    src={baseUrlImage(evidenceCurrent?.imgProcess || "")}
                    alt="Imagen en progreso"
                    width={0}
                    height={0}
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 560px, 720px"
                    style={imageSx}
                  />
                </Box>
              </Grid>
            )}

            {evidenceCurrent.imgSolution && (
              <Grid
                size={{
                  xs: 12,
                  sm: imageCount > 1 ? 6 : 12,
                  md: mdSize,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Imagen de la solución
                </Typography>
                <Box
                  sx={{ ...imageContainerSx, cursor: "zoom-in" }}
                  onClick={() =>
                    openImageDialog(
                      baseUrlImage(evidenceCurrent?.imgSolution || ""),
                      "Imagen de la solución",
                    )
                  }
                >
                  <Image
                    unoptimized
                    src={baseUrlImage(evidenceCurrent?.imgSolution || "")}
                    alt="Imagen Solución"
                    width={0}
                    height={0}
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 560px, 720px"
                    style={imageSx}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      )}

      {((withImages && value === 1) || (!withImages && value === 0)) && (
        <TabPanel
          value={value}
          index={withImages ? 1 : 0}
          dir={theme.direction}
        >
          {/* ...contenido de comentarios... */}
          <ListComments comments={comments} />
          <Box sx={{ display: "flex", mt: 2 }}>
            <TextField
              fullWidth
              label="Agregar comentario"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
            />
            <Button
              sx={{ ml: 2 }}
              variant="contained"
              onClick={addComment}
              disabled={!comment.trim()}
              startIcon={<QuestionAnswerIcon />}
            >
              Comentar
            </Button>
          </Box>
        </TabPanel>
      )}

      <Dialog
        fullScreen
        open={imageDialog.open}
        onClose={closeImageDialog}
        // Visor de borde a borde: negro también detrás de los botones del
        // sistema (sin la zona segura que agregan los demás a pantalla completa).
        slotProps={{ paper: { sx: { pb: 0 } } }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            backgroundColor: "black",
          }}
        >
          <IconButton
            onClick={closeImageDialog}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
              color: "common.white",
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.65)",
              },
            }}
            aria-label="Cerrar imagen"
          >
            <CloseIcon />
          </IconButton>

          {!!imageDialog.title && (
            <Typography
              variant="subtitle1"
              sx={{
                position: "absolute",
                top: 18,
                left: 18,
                zIndex: 2,
                color: "common.white",
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {imageDialog.title}
            </Typography>
          )}

          {!!imageDialog.src && (
            <Image
              unoptimized
              src={imageDialog.src}
              alt={imageDialog.title || "Imagen"}
              fill
              sizes="100vw"
              style={{ objectFit: "contain" }}
              priority
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
