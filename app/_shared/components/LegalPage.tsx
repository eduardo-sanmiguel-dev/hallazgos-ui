import type { ReactNode } from "react";

import { Box, Container, Link, Paper, Stack, Typography } from "@mui/material";

import AppLink from "@shared/components/AppLink";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

interface Props {
  title: string;
  updatedAt: string;
  intro: ReactNode;
  sections: LegalSection[];
}

export const LegalList = ({ items }: { items: ReactNode[] }) => (
  <Box component="ul" sx={{ m: 0, pl: 3, "& li": { mb: 1 } }}>
    {items.map((item, index) => (
      <Typography key={index} component="li" variant="body1">
        {item}
      </Typography>
    ))}
  </Box>
);

// Diseño común de las páginas públicas (privacidad y términos): se leen sin
// sesión, fuera de MainLayout, y en celular.
export default function LegalPage({ title, updatedAt, intro, sections }: Props) {
  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper elevation={2} sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Última actualización: {updatedAt}
            </Typography>
          </Box>

          <Typography variant="body1">{intro}</Typography>

          {sections.map((section, index) => (
            <Box key={section.title} component="section">
              <Typography variant="h6" component="h2" gutterBottom>
                {index + 1}. {section.title}
              </Typography>
              {section.body}
            </Box>
          ))}

          <Link component={AppLink} href="/" data-dd-action-name="Página legal: ir al inicio">
            Ir al inicio
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
