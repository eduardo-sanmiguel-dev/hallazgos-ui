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
import { ManufacturingPlantsService } from "@services";
import { ManufacturingPlant } from "@interfaces";
import TableManufacturingPlants from "./_components/TableManufacturingPlants";
import FiltersManufacturingPlants, {
  IFiltersManufacturingPlants,
} from "./_components/FiltersManufacturingPlants";

const ManufacturingPlantsPage = () => {
  const [data, setData] = useState<ManufacturingPlant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersManufacturingPlants>({
    name: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ManufacturingPlantsService.findAll(filters)
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
          Plantas
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
              onClick={() => router.push("/manufacturing-plants/form")}
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
        <FiltersManufacturingPlants
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
          <TableManufacturingPlants rows={data} getData={getData} />
        )}
      </Grid>
    </Grid>
  );
};

export default ManufacturingPlantsPage;
