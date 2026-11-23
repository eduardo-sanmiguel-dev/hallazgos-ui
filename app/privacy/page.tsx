import { Stack, Typography } from "@mui/material";

import LegalPage, { LegalList as List, type LegalSection } from "@shared/components/LegalPage";

// Página pública (sessionLoader no la protege): debe poder leerse antes de
// iniciar sesión. Si cambia lo que la app recopila (p. ej. la grabación de
// sesiones de observability.ts), hay que actualizar este texto y la fecha.
const PRIVACY_UPDATED_AT = "22 de noviembre de 2026";

const sections: LegalSection[] = [
  {
    title: "Alcance",
    body: (
      <Typography variant="body1">
        Esta política aplica a la plataforma HADA (ComportArte), que las empresas usan para
        registrar y dar seguimiento a la seguridad industrial en sus plantas de México y Colombia.
        Se rige por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
        (México) y por la Ley 1581 de 2012 y sus decretos reglamentarios (Colombia).
      </Typography>
    ),
  },
  {
    title: "Datos que tratamos",
    body: (
      <List
        items={[
          <>
            <strong>Cuenta de usuario:</strong> nombre, correo electrónico, rol y las plantas, zonas
            y procesos asignados. La contraseña se guarda cifrada con un algoritmo de una sola vía;
            nadie puede leerla.
          </>,
          <>
            <strong>Personal de planta:</strong> número de empleado, nombre, fecha de nacimiento,
            fecha de ingreso, área, puesto, género y planta.
          </>,
          <>
            <strong>Registros de seguridad:</strong> hallazgos con sus fotografías, descripción,
            planta y zona; recorridos Gemba Walk, inspecciones, equipos de emergencia y los demás
            registros que captures en la plataforma, junto con quién y cuándo los creó o modificó.
          </>,
          <>
            <strong>Accidentes e incidentes:</strong> datos del evento y de la persona afectada,
            incluido el tipo de lesión, la parte del cuerpo y el diagnóstico.
          </>,
          <>
            <strong>Uso de la plataforma:</strong> navegador y dispositivo, páginas visitadas,
            acciones realizadas, errores y tiempos de respuesta.
          </>,
        ]}
      />
    ),
  },
  {
    title: "Datos sensibles",
    body: (
      <Typography variant="body1">
        La información de lesiones y diagnósticos de accidentes es un dato de salud y se considera
        sensible. Solo se registra para la investigación de accidentes y el cumplimiento de las
        obligaciones de seguridad y salud en el trabajo, y solo pueden verla los usuarios con
        permiso sobre la planta correspondiente.
      </Typography>
    ),
  },
  {
    title: "Finalidades",
    body: (
      <List
        items={[
          "Identificarte, iniciar tu sesión y mostrarte solo lo que tu rol y tus plantas permiten.",
          "Registrar, asignar y dar seguimiento a hallazgos, accidentes, inspecciones y recorridos.",
          "Enviar avisos por correo sobre registros asignados o actualizados y para recuperar tu contraseña. Los avisos que se mandan a toda la planta traen al pie un enlace para dejar de recibirlos.",
          "Generar indicadores y reportes de seguridad para tu organización.",
          "Detectar y corregir fallas, medir el rendimiento y proteger la plataforma.",
          "Cumplir obligaciones legales en materia de seguridad y salud en el trabajo.",
        ]}
      />
    ),
  },
  {
    title: "Cookies y almacenamiento en tu dispositivo",
    body: (
      <Stack spacing={1}>
        <Typography variant="body1">
          Usamos dos cookies, ninguna con fines publicitarios: la de sesión, necesaria para que
          puedas entrar y que no es accesible desde el navegador, y la de monitoreo, que identifica
          tu sesión de uso para el registro de errores descrito en la siguiente sección. Además, la
          plataforma guarda en tu dispositivo preferencias (tema claro u oscuro, filas por página,
          orden de las tablas, la última planta y el último lugar usados, y si ya viste el aviso de
          cookies) y borradores de formularios largos para que no pierdas lo capturado si se va la
          señal.
        </Typography>
        <Typography variant="body1">
          Puedes borrar estos datos desde la configuración de tu navegador; solo perderás esas
          preferencias y borradores.
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Monitoreo y grabación de sesiones",
    body: (
      <Typography variant="body1">
        Para encontrar y corregir errores, la plataforma registra las sesiones de uso: las
        interacciones, las llamadas al servidor y una grabación de lo que se muestra en pantalla,
        incluido el texto visible. Estos registros se asocian a tu nombre y correo, se guardan en
        servidores administrados por la plataforma y solo los consulta el equipo técnico.
      </Typography>
    ),
  },
  {
    title: "Con quién compartimos los datos",
    body: (
      <Typography variant="body1">
        No vendemos ni rentamos datos personales. Los registros los ven los usuarios autorizados de
        tu organización según su rol y sus plantas. Solo compartimos información con los proveedores
        de infraestructura necesarios para operar el servicio (alojamiento y envío de correos), bajo
        obligaciones de confidencialidad, o cuando lo exija una autoridad competente.
      </Typography>
    ),
  },
  {
    title: "Conservación y seguridad",
    body: (
      <Typography variant="body1">
        La información viaja cifrada (HTTPS), el acceso se controla por rol y planta, y la base de
        datos cuenta con respaldos. Los datos se conservan mientras tu organización use la
        plataforma o lo exijan las obligaciones legales aplicables; después se eliminan o se
        anonimizan.
      </Typography>
    ),
  },
  {
    title: "Tus derechos",
    body: (
      <Typography variant="body1">
        Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su tratamiento (derechos
        ARCO en México), así como conocerlos, actualizarlos, rectificarlos, revocar tu autorización
        y pedir su supresión (Ley 1581 en Colombia). También puedes acudir al INAI en México o a la
        Superintendencia de Industria y Comercio en Colombia.
      </Typography>
    ),
  },
  {
    title: "Contacto",
    body: (
      <Typography variant="body1">
        Para ejercer tus derechos o resolver dudas sobre privacidad, comunícate con el administrador
        de la plataforma en tu organización o con el área de seguridad e higiene de tu planta, a
        través de los canales oficiales de tu empresa.
      </Typography>
    ),
  },
  {
    title: "Cambios a esta política",
    body: (
      <Typography variant="body1">
        Si cambiamos la forma en que tratamos los datos, actualizaremos esta página y su fecha de
        última actualización.
      </Typography>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      updatedAt={PRIVACY_UPDATED_AT}
      intro="En HADA protegemos los datos personales de quienes usan la plataforma y de las personas registradas en ella. Aquí explicamos qué información tratamos, para qué la usamos y qué derechos tienes sobre ella."
      sections={sections}
    />
  );
}
