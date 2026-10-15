import { Button } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import StatusPage from "@shared/components/StatusPage";

export default function NotFound() {
  return (
    <main>
      <StatusPage
        code="Error 404"
        icon={<SearchOffIcon />}
        title="Página no encontrada"
        description="La dirección no existe o ya no está disponible. Revise el enlace o vuelva al inicio."
      >
        <Button variant="contained" href="/dashboard">
          Ir al inicio
        </Button>
      </StatusPage>
    </main>
  );
}
