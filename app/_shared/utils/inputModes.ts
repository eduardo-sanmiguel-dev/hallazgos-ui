// Teclados del teléfono por tipo de campo (B1), para `slotProps.htmlInput`.
// En lugar de type="number": no se desplaza con la rueda del mouse, no acepta
// "e" ni signos y abre el teclado adecuado.

/** Enteros: teclado numérico, solo dígitos. */
export const NUMERIC_INPUT = {
  inputMode: "numeric",
  pattern: "[0-9]*",
} as const;

/** Con decimales (precio, capacidad): teclado numérico con punto. */
export const DECIMAL_INPUT = {
  inputMode: "decimal",
  pattern: "[0-9]*[.,]?[0-9]*",
} as const;
