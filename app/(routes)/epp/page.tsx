"use client";

import { useEffect, useState } from "react";

import { Button, ButtonGroup, Grid } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

import LoadingLinear from "@shared/components/LoadingLinear";
import DialogCreateEpp from "./_components/DialogCreateEpp";
import SelectDefault from "@components/SelectDefault";
import TableEpps from "./_components/TableEpps";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { Epp } from "@interfaces";

export default function EppPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<Epp[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const getData = (plantId: string) => {
    setIsLoading(true);
    EppService.findAll({ manufacturingPlantId: plantId })
      .then(setData)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!manufacturingPlantId) return setData([]);
    getData(manufacturingPlantId);
  }, [manufacturingPlantId]);

  useEffect(() => {
    if (manufacturingPlants.length) {
      setManufacturingPlantId(manufacturingPlants[0].id.toString());
    }
  }, [manufacturingPlants]);

  return (
    <>
      <DialogCreateEpp
        open={open}
        create={(form) => {
          const confirm = Object.keys(form).length > 0;
          if (!confirm) return setOpen(false);
          EppService.create(form).then(() => {
            setOpen(false);
            if (manufacturingPlantId) getData(manufacturingPlantId);
          });
        }}
      />
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            value={manufacturingPlantId}
            onChange={(e) => setManufacturingPlantId(e.target.value)}
            validationEmpty
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 9,
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-end" },
            mt: { xs: 0.5, sm: 0 },
          }}
        >
          <ButtonGroup variant="contained" aria-label="Basic button group">
            <Button
              variant="contained"
              onClick={() => setOpen(true)}
              startIcon={<AddIcon />}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Crear registro
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                manufacturingPlantId && getData(manufacturingPlantId)
              }
              startIcon={<RefreshIcon />}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Recargar
            </Button>
          </ButtonGroup>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          {isLoading ? (
            <LoadingLinear />
          ) : (
            <TableEpps
              data={data}
              onHistoryDeleted={() =>
                manufacturingPlantId && getData(manufacturingPlantId)
              }
            />
          )}
        </Grid>
      </Grid>
    </>
  );
}
