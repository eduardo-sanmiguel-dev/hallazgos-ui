import { GEMBA_WALK_EVALUATION_CATEGORIES } from "@interfaces";

// Agrupa por categoría respetando el orden definido (SHE, CALIDAD, ...);
// categorías no listadas van al final.
export const groupByCategory = <T extends { category: string }>(items: T[]) => {
  const order: string[] = [...GEMBA_WALK_EVALUATION_CATEGORIES];
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    groups.set(item.category, [...(groups.get(item.category) || []), item]);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      return (
        (indexA === -1 ? order.length : indexA) -
        (indexB === -1 ? order.length : indexB)
      );
    })
    .map(([category, groupItems]) => ({ category, items: groupItems }));
};
