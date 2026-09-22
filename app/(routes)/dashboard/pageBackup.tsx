/* "use client";



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
}*/

"use client";

import { useEffect, useState, SyntheticEvent } from "react";

import { Grid } from "@mui/material";

import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import { UsersService } from "@services";
import { User } from "@interfaces";
import {
  ROLE_ADMINISTRADOR,
  ROLE_GENERAL,
  ROLE_SUPERVISOR,
} from "@shared/constants";
import {
  DashboardAdmin,
  DashboardSupervisor,
  DashboardGeneral,
} from "./_components";

import { useTheme } from "@mui/material/styles";
import { AppBar } from "@mui/material";
import { Paper } from "@mui/material";
import { Tabs } from "@mui/material";
import { Tab } from "@mui/material";
import { Box } from "@mui/material";

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

const DashboardPage = () => {
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [userSelected, setUserSelected] = useState<User | null>(null);
  const [currentCountry, setCurrentCountry] = useState<string>("");
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const email = useUserSessionStore((state) => state.email);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const currentUser = useUserSessionStore();

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  useEffect(() => {
    if (manufacturingPlants.length) {
      setManufacturingPlantId(manufacturingPlants[0].id.toString());
      setCurrentCountry(manufacturingPlants[0].country.name);
    }
  }, [manufacturingPlants]);

  useEffect(() => {
    if (!currentRole && currentUser?.role) {
      setCurrentRole(currentUser.role);
    }
  }, [currentRole, currentUser]);

  useEffect(() => {
    UsersService.findAll({
      manufacturingPlantId,
      orderBy: "name|ASC",
    }).then((data) =>
      setUsers(
        data
          .filter((user) => user.role !== ROLE_ADMINISTRADOR)
          .map((user) => ({
            ...user,
            name: `# ${user.id} - ${user.name} (${user.role})`,
          })),
      ),
    );
  }, [manufacturingPlantId]);

  useEffect(() => {
    if (userId && users.length) {
      const user = users.find((user) => Number(user.id) === Number(userId));
      setUserSelected(user!);
    } else if (!userId) {
      setUserSelected(null);
    }
  }, [userId, users]);

  useEffect(() => {
    if (
      !currentUser?.id ||
      !currentRole ||
      currentRole === ROLE_ADMINISTRADOR ||
      userSelected
    )
      return;
    setUserId(currentUser.id.toString());
  }, [currentUser, currentRole, userSelected]);

  if (email === "cosmeticostrujillo0023@gmail.com") {
    return window.location.replace("/hds");
  }

  if (!currentCountry) return null;

  if (currentCountry === "México" && currentUser?.id !== 1) {
    //if (currentCountry === "México") {
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
                  <EvidencePerMonthChart year={new Date().getFullYear() - 1} />
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

  return (
    <Grid container spacing={2}>
      {manufacturingPlants.length > 1 && (
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 6,
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
      )}
      {currentRole === ROLE_ADMINISTRADOR && (
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 6,
          }}
        >
          <SelectDefault
            data={users}
            label="Colaborador"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </Grid>
      )}
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        {currentRole === ROLE_ADMINISTRADOR &&
          !userSelected &&
          manufacturingPlantId && (
            <DashboardAdmin manufacturingPlantId={manufacturingPlantId} />
          )}

        {userSelected?.role === ROLE_SUPERVISOR && (
          <DashboardSupervisor
            manufacturingPlantId={manufacturingPlantId}
            user={userSelected}
          />
        )}

        {userSelected?.role === ROLE_GENERAL && (
          <DashboardGeneral
            manufacturingPlantId={manufacturingPlantId}
            user={userSelected}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
