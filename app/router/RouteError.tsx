import { useEffect } from "react";
import { Button, Stack } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import StatusPage from "@shared/components/StatusPage";

export default function RouteError() {
  const error = useRouteError();
  useEffect(() => {
    console.error("Error al abrir la página", error);
  }, [error]);
  const description = isRouteErrorResponse(error)
    ? error.statusText
    : "Comprueba tu conexión y vuelve a intentar. Si continúa, contacta al administrador.";
  return (
    <main>
      <StatusPage
        title="No se pudo mostrar esta página"
        description={description}
        icon={<ErrorOutlineIcon />}
      >
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
          <Button href="/">Ir al inicio</Button>
        </Stack>
      </StatusPage>
    </main>
  );
}
