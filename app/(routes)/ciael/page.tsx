"use client";

import { useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { Grid } from "@mui/material";

import DialogCreateCiael from "./components/DialogCreateCiael";
import TableCiaels from "./components/TableCiaels";
import { Ciael } from "@interfaces";
import { CiaelsService } from "@services";
import { Toolbar, Box, ButtonGroup } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import LoadingLinear from "@shared/components/LoadingLinear";

const CiaelPage = () => {
  const [open, setOpen] = useState(false);
  const [ciaels, setCiaels] = useState<Ciael[]>([]);
  const [isLoadingExcel, setIsLoadingExcel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getData = () => {
    setIsLoading(true);
    CiaelsService.findAll()
      .then(setCiaels)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <DialogCreateCiael open={open} setOpen={setOpen} getData={getData} />
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12
          }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
              <Button
                variant="contained"
                onClick={() => setOpen(true)}
                startIcon={<AddIcon />}
              >
                Crear registro
              </Button>
            </Box>

            <ButtonGroup
              variant="contained"
              aria-label="outlined primary button group"
            >
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => getData()}
              />
              <Button
                variant="contained"
                startIcon={<SimCardDownloadIcon />}
                onClick={() => {
                  setIsLoadingExcel(true);
                  CiaelsService.downloadExcel().finally(() =>
                    setIsLoadingExcel(false)
                  );
                }}
                loading={isLoadingExcel}
              >
                EXCEL
              </Button>
            </ButtonGroup>
          </Toolbar>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12
          }}>
          {isLoading ? <LoadingLinear /> : <TableCiaels data={ciaels} />}
        </Grid>
      </Grid>
    </>
  );
};

export default CiaelPage;

