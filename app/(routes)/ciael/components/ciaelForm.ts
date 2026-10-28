import { Dayjs } from "dayjs";

export interface FormProps {
  manufacturingPlant: string;
  typeOfEvent: string;
  cieDiagnosis: string;
  employee: string;
  eventDate: Dayjs | null;
  description: string;
  daysOfDisability: string;
  zone: string;
  accidentPosition: string;
  bodyPart: string;
  atAgent: string;
  typeOfInjury: string;
  atMechanism: string;
  workingDay: string;
  timeWorked: string;
  usualWork: string;
  typeOfLink: string;
  isDeath: string;
  machine: string;
  isInside: string;
  associatedTask: string;
  areaLeader: string;
  riskFactor: string;
  natureOfEvent: string;
  manager: string;
}

export const initialForm: FormProps = {
  manufacturingPlant: "",
  typeOfEvent: "",
  cieDiagnosis: "",
  employee: "",
  eventDate: null,
  description: "",
  daysOfDisability: "",
  zone: "",
  accidentPosition: "",
  bodyPart: "",
  atAgent: "",
  typeOfInjury: "",
  atMechanism: "",
  workingDay: "",
  timeWorked: "",
  usualWork: "",
  typeOfLink: "",
  isDeath: "",
  machine: "",
  isInside: "",
  associatedTask: "",
  areaLeader: "",
  riskFactor: "",
  natureOfEvent: "",
  manager: "",
};

type RequiredField = Exclude<keyof FormProps, "daysOfDisability" | "manager">;

/**
 * Obligatorios en el orden de la pantalla (secciones Evento, Colaborador,
 * Lesión, Causas y Responsables), con el mensaje que va junto al campo.
 */
export const REQUIRED_FIELDS: Array<[RequiredField, string]> = [
  ["manufacturingPlant", "Selecciona la planta."],
  ["eventDate", "Elige la fecha del evento."],
  ["typeOfEvent", "Selecciona el tipo de evento."],
  ["natureOfEvent", "Selecciona la naturaleza del evento."],
  ["zone", "Selecciona la zona."],
  ["isInside", "Indica si fue dentro de la empresa."],
  ["description", "Describe el evento."],
  ["employee", "Selecciona el colaborador."],
  ["accidentPosition", "Selecciona el nombre del cargo."],
  ["typeOfLink", "Selecciona el tipo de vinculación."],
  ["workingDay", "Selecciona la jornada."],
  ["timeWorked", "Escribe las horas laboradas antes del AT."],
  ["usualWork", "Indica si era su labor habitual."],
  ["cieDiagnosis", "Selecciona el diagnóstico CIE."],
  ["bodyPart", "Selecciona la parte del cuerpo afectada."],
  ["typeOfInjury", "Selecciona el tipo de lesión."],
  ["isDeath", "Indica si causó la muerte."],
  ["atAgent", "Selecciona el agente AT."],
  ["atMechanism", "Selecciona el mecanismo o forma del AT."],
  ["riskFactor", "Selecciona el factor de riesgo asociado."],
  ["machine", "Selecciona la máquina o equipo."],
  ["associatedTask", "Selecciona la tarea asociada."],
  ["areaLeader", "Selecciona el líder de área."],
];

const isEmpty = (value: FormProps[keyof FormProps]) =>
  value === null || (typeof value === "string" && !value.trim());

/** Obligatorios vacíos → mensaje, en el orden de la pantalla. */
export const missingCiaelFields = (form: FormProps) =>
  Object.fromEntries(
    REQUIRED_FIELDS.filter(([field]) => isEmpty(form[field])),
  ) as Partial<Record<RequiredField, string>>;

/** ¿Hay algo capturado? (para confirmar antes de descartarlo). */
export const isFormDirty = (form: FormProps) =>
  (Object.keys(initialForm) as Array<keyof FormProps>).some(
    (field) => form[field] !== initialForm[field],
  );

// Campos que dependen de otro: al cambiarlo dejan de ser válidos (los
// catálogos se piden por planta; los líderes, por zona).
const DEPENDENTS: Partial<
  Record<keyof FormProps, Array<[keyof FormProps, string]>>
> = {
  manufacturingPlant: [
    ["zone", "zona"],
    ["employee", "colaborador"],
    ["accidentPosition", "cargo"],
    ["machine", "máquina"],
    ["associatedTask", "tarea"],
    ["areaLeader", "líder de área"],
  ],
  zone: [["areaLeader", "líder de área"]],
};

const joinLabels = (labels: string[]) =>
  labels.length === 1
    ? labels[0]
    : `${labels.slice(0, -1).join(", ")} y ${labels.at(-1)}`;

/**
 * Cambia un select y limpia lo que depende de él. Si se borró algo que el
 * usuario ya había elegido, `notice` lo dice (para el aviso).
 */
export const changeCiaelField = (
  form: FormProps,
  name: keyof FormProps,
  value: string,
) => {
  const next = { ...form, [name]: value };
  if (form[name] === value) return { form: next, notice: null };

  const cleared: string[] = [];
  for (const [field, label] of DEPENDENTS[name] ?? []) {
    if (next[field]) cleared.push(label);
    next[field] = initialForm[field] as never;
  }

  const notice = cleared.length
    ? `Vuelve a elegir ${joinLabels(cleared)}: ${cleared.length === 1 ? "depende" : "dependen"} de la ${name === "zone" ? "zona" : "planta"}.`
    : null;

  return { form: next, notice };
};

export const trueFalseOptions = [
  {
    id: "1",
    name: "Si",
  },
  { id: "0", name: "No" },
];
