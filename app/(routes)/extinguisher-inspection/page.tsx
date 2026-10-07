"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";
import Add from "@mui/icons-material/Add";
import ButtonGroup from "@mui/material/ButtonGroup";
import { useDebouncedCallback } from "use-debounce";
import Typography from "@mui/material/Typography";

import LoadingLinear from "@shared/components/LoadingLinear";
import { ExtinguisherInspectionsService } from "@services";
import { ExtinguisherInspection } from "@interfaces";
import ExtinguisherInspectionsTable from "./_components/ExtinguisherInspectionsTable";
import FiltersExtinguisherInspections, {
  IFiltersExtinguisherInspections,
} from "./_components/FiltersExtinguisherInspections";

const ExtinguisherInspectionPage = () => {
  const [data, setData] = useState<ExtinguisherInspection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersExtinguisherInspections>({
    search: "",
    manufacturingPlantId: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ExtinguisherInspectionsService.findAll(filters)
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
          Inspecciones de extintores
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
              onClick={() => router.push("/extinguisher-inspection/form")}
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
        <FiltersExtinguisherInspections
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
          <ExtinguisherInspectionsTable rows={data} />
        )}
      </Grid>
    </Grid>
  );
};

export default ExtinguisherInspectionPage;
