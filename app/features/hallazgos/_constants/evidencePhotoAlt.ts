import type { EvidenceRow } from "@interfaces";

// Largo máximo del texto del usuario dentro del texto alternativo: los
// lectores de pantalla leen todo de corrido; la descripción completa está
// junto a la foto ("Lo que se observó").
const MAX_TEXT = 120;

const shorten = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > MAX_TEXT ? `${clean.slice(0, MAX_TEXT - 1).trimEnd()}…` : clean;
};

export type EvidencePhotoKind = "evidence" | "process" | "solution";

const KIND_LABEL: Record<EvidencePhotoKind, string> = {
  evidence: "Foto del hallazgo",
  process: "Foto del progreso",
  solution: "Foto de la solución",
};

/**
 * Texto alternativo de una foto de un hallazgo: qué etapa es, de qué hallazgo
 * y dónde, y lo que escribió quien la tomó (la descripción en la del
 * hallazgo, la de la solución en la de la solución). Antes solo decía
 * "Foto del hallazgo", igual en todos.
 */
export const evidencePhotoAlt = (
  kind: EvidencePhotoKind,
  evidence: Pick<
    EvidenceRow,
    "id" | "zone" | "mainType" | "secondaryType" | "description" | "descriptionSolution"
  >,
) => {
  const place = [evidence.zone?.area?.name, evidence.zone?.name].filter(Boolean).join(", ");
  const what = [evidence.mainType?.name, evidence.secondaryType?.name].filter(Boolean).join(" · ");
  const text =
    kind === "evidence"
      ? evidence.description
      : kind === "solution"
        ? evidence.descriptionSolution
        : undefined;
  return [`${KIND_LABEL[kind]} #${evidence.id}`, what && `(${what})`, place && `en ${place}`]
    .filter(Boolean)
    .join(" ")
    .concat(text?.trim() ? `: ${shorten(text)}` : "");
};

export const evidencePhotoTitle = (kind: EvidencePhotoKind) => KIND_LABEL[kind];
