"use client";

import { useEffect, useState, type ComponentType } from "react";

import { Box, Grid, Stack, Tab, Tabs, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import Chart1 from "./charts/Charts1";
import Chart2 from "./charts/Charts2";
import Chart3 from "./charts/Charts3";
import Chart4 from "./charts/Charts4";
import Chart5 from "./charts/Charts5";
import Chart6 from "./charts/Charts6";
import Chart7 from "./charts/Charts7";
import Chart8 from "./charts/Charts8";
import Chart9 from "./charts/Charts9";
import Chart10 from "./charts/Charts10";
import { DashboardService } from "@services";
import { BusinessIntelligenceEpp } from "@interfaces";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import { useHighchartsTheme } from "@hooks/useHighchartsTheme";
import PageHeader from "@shared/components/PageHeader";

type ChartComponentProps = {
  data: BusinessIntelligenceEpp | null;
};

type ChartComponentType = ComponentType<ChartComponentProps>;
type ChartGroupItem = {
  Component: ChartComponentType;
  fullWidth?: boolean;
};

const chartGroups = [
  {
    title: "Gasto y costo",
    charts: [{ Component: Chart2 }, { Component: Chart1 }] as ChartGroupItem[],
  },
  {
    title: "Entregas y operación",
    charts: [{ Component: Chart4 }, { Component: Chart3 }] as ChartGroupItem[],
  },
  {
    title: "Cobertura de colaboradores",
    charts: [
      { Component: Chart7 },
      { Component: Chart6 },
      { Component: Chart5, fullWidth: true },
    ] as ChartGroupItem[],
  },
  {
    title: "Análisis de costos",
    charts: [
      { Component: Chart10 },
      { Component: Chart9 },
      { Component: Chart8, fullWidth: true },
    ] as ChartGroupItem[],
  },
];

const EPPCharts = () => {
  // Al cambiar de tema se vuelven a crear las gráficas con sus colores.
  const chartsMode = useHighchartsTheme();
  const isMobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState(0);
  const activeGroup = chartGroups[activeTab];
  const [data, setData] = useState<BusinessIntelligenceEpp | null>(null);
  const [manufacturingPlantId, setManufacturingPlantId] = useState("");

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  useEffect(() => {
    DashboardService.findBusinessIntelligenceEpp({
      manufacturingPlantId,
    }).then(setData);
  }, [manufacturingPlantId]);

  useEffect(() => {
    if (manufacturingPlants.length) {
      const defaultPlantId = manufacturingPlants[0].id;
      setManufacturingPlantId(defaultPlantId.toString());
    }
  }, [manufacturingPlants]);

  return (
    <>
      <PageHeader title="Análisis de datos EPP" />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid
          size={{
            xs: 12,
            sm: 3,
            md: 2,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            isFilter={true}
            value={manufacturingPlantId}
            onChange={(e) => {
              setManufacturingPlantId(e.target.value);
            }}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <Stack spacing={{ xs: 3, md: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue: number) => setActiveTab(newValue)}
              aria-label="Grupos de indicadores EPP"
              sx={{
                width: "100%",
                backgroundColor: "primary.main",
                "& .MuiTab-root": {
                  color: (theme) => alpha(theme.palette.common.white, 0.68),
                  opacity: 1,
                  transition: "all 0.2s ease",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: "common.white",
                  fontWeight: 700,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.common.white, 0.14),
                },
              }}
              indicatorColor="secondary"
              textColor="inherit"
              // En pantallas chicas las cuatro pestañas no caben a lo ancho.
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {chartGroups.map((group, index) => (
                <Tab
                  key={group.title}
                  label={group.title}
                  id={`epp-group-tab-${index}`}
                  aria-controls={`epp-group-panel-${index}`}
                />
              ))}
            </Tabs>

            <Stack
              spacing={2}
              role="tabpanel"
              id={`epp-group-panel-${activeTab}`}
              aria-labelledby={`epp-group-tab-${activeTab}`}
            >
              <Grid key={chartsMode} container spacing={{ xs: 2, md: 2.5 }}>
                {activeGroup.charts.map(({ Component, fullWidth }, index) => (
                  <Grid
                    key={`${activeGroup.title}-${index}`}
                    size={{
                      xs: 12,
                      md: fullWidth ? 12 : 6,
                    }}
                  >
                    <Box sx={{ width: "100%" }}>
                      <Component data={data} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
};

export default EPPCharts;
