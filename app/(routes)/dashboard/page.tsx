"use client";

import { SyntheticEvent, useState } from "react";

import { useTheme } from "@mui/material/styles";
import { AppBar } from "@mui/material";
import { Paper } from "@mui/material";
import { Tabs } from "@mui/material";
import { Grid } from "@mui/material";
import { Tab } from "@mui/material";
import { Box } from "@mui/material";

import { useUserSessionStore } from "@store";
import {
  a11yProps,
  TabPanel,
} from "@routes/hallazgos/_components/TabsImageAndLogs";
import {
  //AccidentRateIndicator,
  EvidencePerMonthChart,
  //HeatMapChart,
  MainTypesChart,
  ProductivityChart,
  StatusChart,
  TopUsersByPlantChart,
  ZonesChart,
} from "./_components";

export default function DashboardPage() {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const email = useUserSessionStore((state) => state.email);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (email === "cosmeticostrujillo0023@gmail.com") {
    return window.location.replace("/hds");
  }

  return (
    <Box sx={{ bgcolor: "background.paper", width: "100%" }}>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          scrollButtons="auto"
          aria-label="scrollable tabs example"
        >
          <Tab label="Estatus / Criterios / Zonas" {...a11yProps(0)} />
          <Tab label="Meses" {...a11yProps(1)} />
          <Tab label="Epp" {...a11yProps(2)} />
          <Tab label="Usuarios" {...a11yProps(3)} />
        </Tabs>
      </AppBar>

      {value === 0 && (
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 3,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <StatusChart />
              </Paper>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 6,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <MainTypesChart />
              </Paper>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 3,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ZonesChart />
              </Paper>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 12,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ProductivityChart />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      )}
      {value === 1 && (
        <TabPanel value={value} index={1} dir={theme.direction}>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 4,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <EvidencePerMonthChart projections={true} />
              </Paper>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 4,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <EvidencePerMonthChart />
              </Paper>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 6,
                lg: 4,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <EvidencePerMonthChart year={2024} />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      )}
      {value === 2 && (
        <TabPanel value={value} index={2} dir={theme.direction}>
          ...
        </TabPanel>
      )}
      {value === 3 && (
        <TabPanel value={value} index={3} dir={theme.direction}>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                md: 12,
                lg: 12,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <TopUsersByPlantChart />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      )}
    </Box>
  );
}
