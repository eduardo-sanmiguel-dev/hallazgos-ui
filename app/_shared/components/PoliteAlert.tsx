import Alert, { type AlertProps } from "@mui/material/Alert";

export default function PoliteAlert(props: AlertProps) {
  return (
    <output style={{ display: "block" }}>
      <Alert {...props} role="presentation" />
    </output>
  );
}
