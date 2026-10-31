"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { CssBaseline } from "@mui/material";
import { Box } from "@mui/material";
import { Container } from "@mui/material";

import FormLogin from "@components/login/FormLogin";
import Copyright from "@shared/components/Copyright";
import FormForgotPassword from "@components/login/FormForgotPassword";
import FormRestorePassword from "@components/login/FormRestorePassword";

export default function SignIn() {
  const [forgotPassword, setForgotPassword] = useState(false);
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  return (
    <Container
      component="main"
      maxWidth="xs"
      // Zona segura de los botones del sistema (viewport-fit=cover).
      sx={{ pb: "env(safe-area-inset-bottom, 0px)" }}
    >
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Proporción real del archivo (1536×1024 = 3:2): con 450×350 se
          veía estirado. En pantallas angostas se reduce sin deformarse y
          se carga de inmediato porque es lo primero que se ve. */}
        <Image
          src="/images/logo-new.png"
          alt=""
          width={450}
          height={300}
          loading="eager"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        {token ? (
          <FormRestorePassword />
        ) : !forgotPassword ? (
          <FormLogin setForgotPassword={setForgotPassword} />
        ) : (
          <FormForgotPassword setForgotPassword={setForgotPassword} />
        )}
      </Box>
      {/* <Image src="/images/logo-inferior.png" alt="" width={400} height={100} /> */}
      <Copyright sx={{ mb: 4, mt: 10 }} />
    </Container>
  );
}
