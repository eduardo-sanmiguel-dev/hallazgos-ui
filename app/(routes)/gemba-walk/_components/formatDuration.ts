// 75 -> "1 min 15 s", 3720 -> "1 h 2 min", 40 -> "40 s".
export const formatDuration = (totalSeconds?: number | null) => {
  if (totalSeconds === null || totalSeconds === undefined) return "-";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours) return `${hours} h ${minutes} min`;
  if (minutes)
    return seconds ? `${minutes} min ${seconds} s` : `${minutes} min`;
  return `${seconds} s`;
};
