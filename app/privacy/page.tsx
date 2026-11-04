import { Box, Container, Paper, Stack, Typography } from "@mui/material";

export default function PrivacyPage() {
  const updatedAt = "26 de marzo de 2026";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper elevation={2} sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Politica de privacidad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ultima actualizacion: {updatedAt}
            </Typography>
          </Box>

          <Typography variant="body1">
            En HADA respetamos tu privacidad y protegemos tus datos personales. Esta politica
            describe que informacion recopilamos, como la usamos y que derechos tienes sobre tus
            datos.
          </Typography>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              1. Informacion que recopilamos
            </Typography>
            <Typography variant="body1">
              Podemos recopilar informacion de identificacion, datos de contacto, datos de uso de la
              plataforma y cualquier informacion que ingreses voluntariamente al utilizar nuestros
              servicios.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              2. Finalidad del tratamiento
            </Typography>
            <Typography variant="body1">
              Usamos la informacion para operar la plataforma, autenticar usuarios, mejorar la
              experiencia, cumplir obligaciones legales y dar soporte tecnico.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              3. Conservacion y seguridad
            </Typography>
            <Typography variant="body1">
              Implementamos medidas tecnicas y organizativas razonables para proteger los datos
              frente a acceso no autorizado, perdida, alteracion o divulgacion indebida.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              4. Compartir informacion
            </Typography>
            <Typography variant="body1">
              No vendemos datos personales. Solo compartimos informacion cuando es necesario para la
              operacion del servicio, por requerimiento legal o con tu consentimiento expreso.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              5. Derechos del titular
            </Typography>
            <Typography variant="body1">
              Puedes solicitar acceso, rectificacion, actualizacion o eliminacion de tus datos
              personales, asi como limitar su tratamiento conforme a la normativa aplicable.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              6. Contacto
            </Typography>
            <Typography variant="body1">
              Para consultas relacionadas con privacidad y datos personales, contactanos a traves de
              los canales oficiales de tu organizacion.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
