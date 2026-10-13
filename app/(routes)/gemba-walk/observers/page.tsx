"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Add from "@mui/icons-material/Add";
import { ButtonGroup } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import { Typography } from "@mui/material";

import LoadingLinear from "@shared/components/LoadingLinear";
import { GembaWalkObserversService } from "@services";
import { GembaWalkObserver } from "@interfaces";
import TableGembaWalkObservers from "./_components/TableGembaWalkObservers";
import FiltersGembaWalkObservers, {
  IFiltersGembaWalkObservers,
} from "./_components/FiltersGembaWalkObservers";

const GembaWalkObserversPage = () => {
  const [data, setData] = useState<GembaWalkObserver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersGembaWalkObservers>({
    manufacturingPlantId: "",
    gembaWalkZoneId: "",
    userName: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    GembaWalkObserversService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <Grid container>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.common.black
                : theme.palette.common.white,
          }}
        >
          Gemba Walk - Observadores
        </Typography>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push("/gemba-walk/observers/form")}
            >
              Crear
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
            ></Button>
          </ButtonGroup>
        </Toolbar>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <FiltersGembaWalkObservers
          filters={filters}
          setFilters={setFilters}
          count={data.length}
        />
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
          <TableGembaWalkObservers rows={data} getData={getData} />
        )}
      </Grid>
    </Grid>
  );
};

export default GembaWalkObserversPage;
