import { Link } from "@mui/material";
import { Typography } from "@mui/material";

export default function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      align="center"
      {...props}
      sx={{
        color: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.common.black
            : theme.palette.common.white,
        mt: 2,
      }}
    >
      {"Copyright © "}
      <Link
        color="inherit"
        href="https://cosmeticostrujillo.com"
        target="_blank"
      >
        Cosmeticos trujillo
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}
