import { Link, Typography } from "@mui/material";

import AppLink from "@shared/components/AppLink";
import LegalPage, { LegalList as List, type LegalSection } from "@shared/components/LegalPage";

// Página pública (sessionLoader no la protege), igual que /privacy. Si cambian
// las reglas de uso, hay que actualizar este texto y la fecha.
const TERMS_UPDATED_AT = "22 de noviembre de 2026";

const sections: LegalSection[] = [
  {
    title: "Objeto",
    body: (
      <Typography variant="body1">
        HADA (ComportArte) es una plataforma para registrar y dar seguimiento a la seguridad
        industrial en plantas de México y Colombia: hallazgos, accidentes e incidentes,
        inspecciones, recorridos Gemba Walk, equipos de protección y de emergencia, e indicadores.
        Al iniciar sesión aceptas estos términos.
      </Typography>
    ),
  },
  {
    title: "Acceso y cuentas",
    body: (
      <List
        items={[
          "Las cuentas las crea tu organización; no hay registro abierto al público.",
          "Tu cuenta es personal e intransferible. No compartas tu contraseña ni dejes la sesión abierta en un dispositivo compartido sin cerrarla al terminar.",
          "Eres responsable de lo que se haga con tu cuenta. Si sospechas que alguien más la usa, cambia tu contraseña y avisa al administrador.",
          "Lo que puedes ver y hacer depende del rol y de las plantas que tu organización te asigne.",
        ]}
      />
    ),
  },
  {
    title: "Uso aceptable",
    body: (
      <>
        <Typography variant="body1" gutterBottom>
          Al usar la plataforma te comprometes a:
        </Typography>
        <List
          items={[
            "Registrar información veraz, completa y a tiempo, sin alterar ni ocultar hechos.",
            "Tomar fotografías solo de lo relacionado con la seguridad del área, evitando captar rostros u otros datos personales cuando no sean necesarios.",
            "Tratar con confidencialidad la información de tu organización y de las personas registradas, en especial los datos de accidentes y de salud.",
            "No intentar acceder a información o funciones que tu rol no permite, ni interferir con el funcionamiento o la seguridad de la plataforma.",
            "No usar la plataforma para fines ajenos a la seguridad y salud en el trabajo de tu organización.",
          ]}
        />
      </>
    ),
  },
  {
    title: "Información registrada",
    body: (
      <Typography variant="body1">
        Los registros, fotografías y documentos que se capturan pertenecen a tu organización, que
        decide quién puede consultarlos. Al subirlos confirmas que tienes autorización para hacerlo.
        El tratamiento de los datos personales se describe en la{" "}
        <Link component={AppLink} href="/privacy">
          política de privacidad
        </Link>
        .
      </Typography>
    ),
  },
  {
    title: "Alcance de la plataforma",
    body: (
      <Typography variant="body1">
        La plataforma es una herramienta de apoyo: no sustituye las obligaciones legales de
        seguridad y salud en el trabajo, la evaluación de riesgos por personal calificado ni los
        procedimientos de emergencia de tu planta. Ante una emergencia, sigue primero el
        procedimiento de tu planta y regístrala después.
      </Typography>
    ),
  },
  {
    title: "Disponibilidad",
    body: (
      <Typography variant="body1">
        Procuramos que la plataforma esté disponible y funcione correctamente, pero puede haber
        interrupciones por mantenimiento, actualizaciones o fallas de conexión. Los formularios
        largos guardan un borrador en tu dispositivo; aun así, confirma que cada registro se haya
        guardado antes de cerrar la aplicación.
      </Typography>
    ),
  },
  {
    title: "Propiedad intelectual",
    body: (
      <Typography variant="body1">
        El software, el diseño y las marcas de la plataforma pertenecen a Hada International o a sus
        licenciantes. No está permitido copiarlos, modificarlos, descompilarlos ni usarlos fuera del
        servicio contratado por tu organización.
      </Typography>
    ),
  },
  {
    title: "Suspensión del acceso",
    body: (
      <Typography variant="body1">
        Tu organización puede desactivar tu cuenta en cualquier momento, por ejemplo al terminar tu
        relación laboral. También podemos suspender un acceso que incumpla estos términos o ponga en
        riesgo la seguridad de la plataforma o de la información.
      </Typography>
    ),
  },
  {
    title: "Cambios a estos términos",
    body: (
      <Typography variant="body1">
        Podemos actualizar estos términos; los cambios aplican desde su publicación en esta página,
        con su fecha de última actualización. Seguir usando la plataforma implica aceptarlos.
      </Typography>
    ),
  },
  {
    title: "Contacto y legislación aplicable",
    body: (
      <Typography variant="body1">
        Para dudas sobre estos términos, comunícate con el administrador de la plataforma en tu
        organización. Estos términos se rigen por las leyes del país donde se ubica la planta en la
        que usas la plataforma (México o Colombia).
      </Typography>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      updatedAt={TERMS_UPDATED_AT}
      intro="Estos términos regulan el uso de la plataforma HADA por parte de los usuarios a quienes su organización les dio acceso."
      sections={sections}
    />
  );
}
