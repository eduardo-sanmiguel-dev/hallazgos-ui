export const priorityOptions = [
  { name: "Inmediato", days: 2 },
  { name: "Corto plazo", days: 8 },
  { name: "Mediano plazo", days: 15 },
  { name: "Largo plazo", days: 30 },
];

export const formatDayLabel = (days: number) => {
  const absDays = Math.abs(days);
  return `${days} ${absDays === 1 ? "día" : "días"}`;
};

export const getPriorityLabel = (priorityDays?: number | null) => {
  if (!priorityDays) return "Sin prioridad";
  const option = priorityOptions.find((item) => item.days === priorityDays);
  return option
    ? `${option.name} (${formatDayLabel(option.days)})`
    : formatDayLabel(priorityDays);
};

export const getRemainingDays = (
  createdAt?: Date | string | null,
  priorityDays?: number | null,
) => {
  if (!createdAt || !priorityDays) return "N/A";

  const createdDate = new Date(createdAt);
  const dueDate = new Date(createdDate);
  dueDate.setDate(dueDate.getDate() + priorityDays);

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return `${diffDays}`;
};

// Days it took to close (partial days count as a full day) and whether it
// was closed within the priority deadline (createdAt + priorityDays).
export const getResolutionDays = (
  createdAt?: Date | string | null,
  solutionDate?: Date | string | null,
  priorityDays?: number | null,
) => {
  if (!createdAt || !solutionDate) return null;

  const diffMs =
    new Date(solutionDate).getTime() - new Date(createdAt).getTime();

  if (Number.isNaN(diffMs)) return null;

  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    days,
    isOnTime: priorityDays ? days <= priorityDays : null,
    daysLate: priorityDays ? Math.max(0, days - priorityDays) : 0,
  };
};
