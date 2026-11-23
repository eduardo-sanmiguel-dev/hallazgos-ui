import { alpha, darken } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

/** Nombre de las flechas ("Mes anterior", "Semana siguiente"); $0 es la vista. */
export const CALENDAR_BUTTON_HINTS = {
  prev: "$0 anterior",
  next: "$0 siguiente",
};

/**
 * Colores de FullCalendar con la paleta del tema, para la agenda y el
 * calendario de Gemba Walk. Corrige lo que FullCalendar trae por omisión y no
 * cumple contraste AA (4.5:1):
 * - Botones y eventos con texto blanco sobre el verde de marca (2.3:1): van
 *   con el texto oscuro que MUI usa sobre ese verde, y al pasar el mouse el
 *   verde se aclara (como los botones del tema).
 * - El botón de la vista elegida ("Mes", "Semana") quedaba en 4.4:1: se
 *   oscurece más y lleva texto blanco, así también se distingue de los demás.
 * - Los días de otro mes con `opacity: .3` (1.9:1): se distinguen con el
 *   color de texto secundario, que se lee también sobre los días pasados.
 */
export const fullCalendarPalette = (theme: Theme) => {
  const { primary, divider, background, action, text, info, common } = theme.palette;
  const selected = darken(primary.main, 0.45);
  return {
    "--fc-border-color": divider,
    "--fc-page-bg-color": background.paper,
    "--fc-neutral-bg-color": action.hover,
    "--fc-list-event-hover-bg-color": action.hover,
    "--fc-today-bg-color": alpha(primary.main, 0.12),
    "--fc-event-bg-color": primary.main,
    "--fc-event-border-color": primary.main,
    "--fc-event-text-color": primary.contrastText,
    "--fc-button-text-color": primary.contrastText,
    "--fc-button-bg-color": primary.main,
    "--fc-button-border-color": primary.main,
    "--fc-button-hover-bg-color": primary.light,
    "--fc-button-hover-border-color": primary.light,
    "--fc-button-active-bg-color": selected,
    "--fc-button-active-border-color": selected,
    "& .fc": { color: text.primary },
    "& .fc .fc-button-primary:not(:disabled).fc-button-active, & .fc .fc-button-primary:not(:disabled):active":
      { color: common.white },
    "& .fc .fc-day-other .fc-daygrid-day-top": { opacity: 1, color: text.secondary },
    "& .fc .fc-day-past": { backgroundColor: action.disabledBackground },
    "& .fc-event.gw-additional": {
      backgroundColor: info.main,
      borderColor: info.main,
    },
    "& .fc-event.gw-additional .fc-event-main, & .fc-event.gw-additional .fc-event-title, & .fc-event.gw-additional .fc-event-time":
      { color: info.contrastText },
  };
};
