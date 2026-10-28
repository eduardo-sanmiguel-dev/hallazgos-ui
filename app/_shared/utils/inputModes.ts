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

/** Lo escrito → entero desde 1 (solo dígitos; "0" o vacío → ""). */
export const toPositiveInteger = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  return digits && Number(digits) >= 1 ? String(Number(digits)) : "";
};

/**
 * Lo escrito → número con punto decimal (la coma se cambia por punto) y, a lo
 * más, `decimals` decimales: si se escriben más, se redondea.
 */
export const toDecimal = (value: string, decimals = 2) => {
  const [whole, ...rest] = value
    .replace(",", ".")
    .replace(/[^0-9.]/g, "")
    .split(".");
  const cleaned = rest.length ? `${whole}.${rest.join("")}` : whole;
  const fraction = cleaned.split(".")[1] ?? "";
  const factor = 10 ** decimals;
  return fraction.length > decimals
    ? String(Math.round(Number(cleaned) * factor) / factor)
    : cleaned;
};
