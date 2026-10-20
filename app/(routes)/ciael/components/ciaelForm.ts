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

export const trueFalseOptions = [
  {
    id: "1",
    name: "Si",
  },
  { id: "0", name: "No" },
];
