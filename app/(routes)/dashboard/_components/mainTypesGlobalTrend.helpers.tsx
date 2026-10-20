import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export type Order = "asc" | "desc";
export type SortableColumn =
  | "responsable_id"
  | "responsable"
  | "total_asignadas"
  | "abiertas"
  | "cerradas"
  | "canceladas"
  | "pct_resolucion"
  | "promedio_dias_resolucion"
  | "criticos_mas_90_dias"
  | "asignadas_mes_anterior"
  | "asignadas_mes_actual"
  | "max_dias_sin_resolver";

export const cardsViewAnimationSx = {
  animation: "cardsViewIn 220ms ease",
  "@keyframes cardsViewIn": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
};

export const detailsViewAnimationSx = {
  animation: "detailsViewIn 220ms ease",
  "@keyframes detailsViewIn": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
};

export const parseNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number") return value;
  const parsed = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .trim(),
  );
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatMetric = (value: string | number) => {
  return new Intl.NumberFormat("es-MX").format(parseNumber(value));
};

export const formatPercentage = (value: string | number) => {
  const text = String(value ?? "").trim();
  if (!text) return "0%";
  if (text.includes("%")) return text;
  return `${text}%`;
};

export const getTrendColor = (
  value: string | number,
): "success" | "error" | "default" => {
  const numeric = parseNumber(value);
  if (numeric > 0) return "success";
  if (numeric < 0) return "error";
  return "default";
};

export const getTrendIcon = (value: string | number) => {
  const numeric = parseNumber(value);
  if (numeric > 0) return <TrendingUpIcon fontSize="small" />;
  if (numeric < 0) return <TrendingDownIcon fontSize="small" />;
  return <TrendingFlatIcon fontSize="small" />;
};

export const getComplianceLevel = (value: string | number) => {
  const numeric = parseNumber(value);
  if (numeric >= 90) return "Alto";
  if (numeric >= 80) return "Medio";
  return "Bajo";
};

export const getComplianceColor = (
  value: string | number,
): "success" | "warning" | "error" => {
  const numeric = parseNumber(value);
  if (numeric >= 90) return "success";
  if (numeric >= 80) return "warning";
  return "error";
};
