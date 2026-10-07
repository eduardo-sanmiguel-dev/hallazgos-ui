"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";
import Add from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/Print";
import ButtonGroup from "@mui/material/ButtonGroup";
import { useDebouncedCallback } from "use-debounce";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import QRCode from "qrcode";

import LoadingLinear from "@shared/components/LoadingLinear";
import { notify } from "@shared/utils";
import { EmergencyTeamsService } from "@services";
import { EmergencyTeam } from "@interfaces";
import EmergencyTeamsTable from "./_components/EmergencyTeamsTable";
import FiltersEmergencyTeams, {
  IFiltersEmergencyTeams,
} from "./_components/FiltersEmergencyTeams";

const EmergencyTeamsPage = () => {
  const [data, setData] = useState<EmergencyTeam[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersEmergencyTeams>({
    search: "",
    manufacturingPlantId: "",
  });

  const theme = useTheme();
  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    EmergencyTeamsService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => data.some((row) => row.id === id)),
    );
  }, [data]);

  const printQrs = async (rowsToPrint: EmergencyTeam[]) => {
    if (!rowsToPrint.length) {
      notify("Seleccione al menos un registro con QR para imprimir");
      return;
    }

    const rowsWithQr = await Promise.all(
      rowsToPrint.map(async (row) => ({
        ...row,
        generatedQrCode: await QRCode.toDataURL(row.id.toString()),
      })),
    );

    const printWindow = window.open(
      "about:blank",
      "_blank",
      "width=900,height=700",
    );

    if (!printWindow) {
      notify("No se pudo abrir la ventana de impresión");
      return;
    }

    const perPage = 9;
    const pages: Array<Array<EmergencyTeam & { generatedQrCode: string }>> = [];
    for (let i = 0; i < rowsWithQr.length; i += perPage) {
      pages.push(rowsWithQr.slice(i, i + perPage));
    }

    const pagesHtml = pages
      .map(
        (pageRows) => `
          <section class="page">
            <div class="grid">
              ${pageRows
                .map(
                  (row) => `
                    <div class="item">
                      <div class="qr-box">
                        <img src="${row.generatedQrCode}" alt="QR equipo ${row.id}" />
                      </div>
                      <div class="qr-meta">
                        <div><strong>Ubicación:</strong> ${row.location || "-"}</div>
                        <div><strong>No. Extintor:</strong> ${row.extinguisherNumber ?? "-"}</div>
                        <div><strong>Tipo:</strong> ${row.typeOfExtinguisher || "-"}</div>
                        <div><strong>Capacidad:</strong> ${row.capacity ?? "-"}</div>
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </section>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Impresión QR equipos de emergencia</title>
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }

            body {
              margin: 0;
              font-family: Arial, sans-serif;
            }

            .page {
              width: 100%;
              display: block;
              box-sizing: border-box;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .page:not(:last-child) {
              page-break-after: always;
            }

            .grid {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(3, 5cm);
              grid-auto-rows: 7.8cm;
              gap: 0.5cm;
              justify-content: center;
              align-content: start;
            }

            .item {
              width: 5cm;
              height: 7.8cm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .qr-box {
              width: 5cm;
              height: 5cm;
              border: 2px solid #000;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
            }

            .item img {
              width: 4.5cm;
              height: 4.5cm;
              object-fit: contain;
            }

            .qr-meta {
              width: 5cm;
              margin-top: 0.3cm;
              font-size: 8.5pt;
              line-height: 1.3;
            }

            .qr-meta > div {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function () {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const printSelectedQrs = () => {
    const selectedRows = data.filter((row) => selectedIds.includes(row.id));
    void printQrs(selectedRows);
  };

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
          Equipos de emergencia
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
              onClick={() => router.push("/emergency-teams/form")}
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
              startIcon={<PrintIcon />}
              onClick={printSelectedQrs}
              disabled={!selectedIds.length}
            >
              Imprimir ({selectedIds.length})
            </Button>
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
        <FiltersEmergencyTeams
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
          <EmergencyTeamsTable
            rows={data}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            getData={getData}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default EmergencyTeamsPage;
