import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Link } from "@mui/material";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";

import { MailPreferencesService } from "@services";
import type { MailPreferences } from "@interfaces";
import AppLink from "@shared/components/AppLink";
import LoadingLinear from "@shared/components/LoadingLinear";
import StatusPage from "@shared/components/StatusPage";
import { useSearchParams } from "@shared/navigation";

// Enlace de baja de los correos. Con token (correos anteriores) es pública
// y el token identifica al usuario; sin token (correos actuales: un mismo
// correo va a varios destinatarios) sessionLoader pide iniciar sesión y se
// usa la del usuario. Nunca da de baja al abrirse: los filtros de correo y
// antivirus abren los enlaces solos, así que se pide confirmar con un botón.
const KEEPS =
  "Seguirás recibiendo los avisos de los hallazgos que te asignen o que reportes, y los de tu cuenta.";

const HomeLink = () => (
  <Link component={AppLink} href="/">
    Ir al inicio
  </Link>
);

export default function UnsubscribePage() {
  const token = useSearchParams().get("token") ?? "";
  const queryClient = useQueryClient();
  const queryKey = ["mail-preferences", token || "me"];

  const preferences = useQuery({
    queryKey,
    queryFn: () =>
      token ? MailPreferencesService.lookup(token) : MailPreferencesService.findMine(),
    // Un enlace inválido no se arregla reintentando.
    retry: false,
  });

  const change = useMutation({
    mutationFn: (plantNotifications: boolean) =>
      token
        ? MailPreferencesService.update(token, plantNotifications)
        : MailPreferencesService.updateMine(plantNotifications),
    onSuccess: (data) => queryClient.setQueryData<MailPreferences>(queryKey, data),
  });

  if (!token && preferences.isError) {
    return (
      <main>
        <StatusPage
          icon={<LinkOffIcon />}
          title="No se pudieron cargar tus avisos"
          description="Revisa tu conexión e intenta de nuevo."
        >
          <Button variant="contained" onClick={() => preferences.refetch()}>
            Reintentar
          </Button>
          <HomeLink />
        </StatusPage>
      </main>
    );
  }

  if (preferences.isError) {
    return (
      <main>
        <StatusPage
          icon={<LinkOffIcon />}
          title="El enlace no es válido"
          description="Puede estar incompleto o la cuenta ya no está activa. Si sigues recibiendo avisos de la planta, pide al administrador que los desactive en tu usuario."
        >
          <Button variant="contained" onClick={() => preferences.refetch()}>
            Reintentar
          </Button>
          <HomeLink />
        </StatusPage>
      </main>
    );
  }

  if (!preferences.data) return <LoadingLinear />;

  const { email, plantNotifications } = preferences.data;

  return (
    <main>
      {plantNotifications ? (
        <StatusPage
          icon={<NotificationsActiveIcon />}
          title="¿Dejar de recibir los avisos de la planta?"
          description={`Son los correos que se mandan a todos los usuarios de tu planta (por ejemplo, hallazgos creados o cancelados) y llegan a ${email}. ${KEEPS}`}
        >
          <Button
            variant="contained"
            loading={change.isPending}
            onClick={() => change.mutate(false)}
            data-dd-action-name="Baja de correos: dejar de recibir"
          >
            Dejar de recibir avisos
          </Button>
          <HomeLink />
        </StatusPage>
      ) : (
        <StatusPage
          icon={<NotificationsOffIcon />}
          title="Ya no recibes los avisos de la planta"
          description={`${email} no recibirá los correos que se mandan a todos los usuarios de tu planta. ${KEEPS}`}
        >
          <Button
            variant="outlined"
            loading={change.isPending}
            onClick={() => change.mutate(true)}
            data-dd-action-name="Baja de correos: volver a recibir"
          >
            Volver a recibir avisos
          </Button>
          <HomeLink />
        </StatusPage>
      )}
    </main>
  );
}
