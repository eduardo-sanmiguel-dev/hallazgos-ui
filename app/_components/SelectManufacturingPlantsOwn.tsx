import { useEffect, useRef } from "react";
import { FormHelperText, Grid } from "@mui/material";
import type { GridProps, SelectChangeEvent } from "@mui/material";

import { EMPTY_CATALOG, useManufacturingPlants } from "@hooks";
import { useUserSessionStore } from "@store";
import { usePlantSelectionStore } from "@store/plantSelection.store";
import { readLastPlant, proposedPlantId } from "@shared/utils/lastPlant";
import SelectDefault from "./SelectDefault";

interface CommonProps {
  isFilter?: boolean;
  error?: string;
  disabled?: boolean;
  size?: GridProps["size"];
  // Para campos que ya tienen su contenedor Grid o se muestran en un encabezado.
  embedded?: boolean;
  label?: string;
  name?: string;
  validationEmpty?: boolean;
  restoreSelection?: boolean;
  defaultToFirst?: boolean;
  // Los formularios de administracion pueden necesitar el catalogo completo.
  source?: "session" | "catalog";
}

type Props = CommonProps &
  (
    | { multiple?: false; value: string; onChange: (event: SelectChangeEvent<string>) => void }
    | { multiple: true; value: string[]; onValuesChange: (values: string[]) => void }
  );

export default function SelectManufacturingPlantsOwn(props: Props) {
  const {
    isFilter = false,
    error,
    disabled,
    size = { xs: 12, sm: 6, md: 3 },
    embedded = false,
    label = props.multiple ? "Plantas" : "Planta",
    name,
    validationEmpty = false,
    restoreSelection = true,
    defaultToFirst = false,
    source = "session",
  } = props;
  const sessionPlants = useUserSessionStore((state) => state.manufacturingPlants);
  const userId = useUserSessionStore((state) => state.id);
  const catalog = useManufacturingPlants({ enabled: source === "catalog" });
  const plants = source === "catalog" ? (catalog.data ?? EMPTY_CATALOG) : sessionPlants;
  const remembered =
    usePlantSelectionStore((state) => state.byUser[userId]) ?? readLastPlant(userId);
  const select = usePlantSelectionStore((state) => state.select);
  const restored = useRef<{ userId: number; remembered: string | null } | null>(null);

  useEffect(() => {
    // Las asignaciones multiples nunca cambian la planta de trabajo ni se autocompletan.
    if (props.multiple || disabled || !restoreSelection || !userId || !plants.length) return;
    const first = restored.current?.userId !== userId;
    const preferenceChanged = !first && restored.current?.remembered !== remembered;
    restored.current = { userId, remembered };
    // Un registro, borrador o enlace explicito tiene prioridad al montar.
    if ((first && props.value) || (!first && (!isFilter || !preferenceChanged))) return;
    const next =
      remembered === ""
        ? ""
        : remembered && plants.some(({ id }) => String(id) === remembered)
          ? remembered
          : proposedPlantId(plants, userId) || (defaultToFirst ? String(plants[0].id) : "");
    if (next !== props.value)
      props.onChange({ target: { value: next, name: name ?? "" } } as SelectChangeEvent<string>);
  }, [
    props,
    disabled,
    restoreSelection,
    defaultToFirst,
    userId,
    plants,
    remembered,
    isFilter,
    name,
  ]);

  const field = (
    <>
      <SelectDefault
        data={
          props.multiple
            ? [
                { id: -1, name: props.value.length === plants.length ? "Ninguno" : "Todos" },
                ...plants
                  .map((plant) => ({ ...plant, id: plant.name }))
                  .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
              ]
            : plants
        }
        label={label}
        multiple={props.multiple}
        value={props.value}
        onChange={(event, options) => {
          if (props.multiple) {
            props.onValuesChange(
              Array.isArray(options)
                ? options.some((plant) => plant.id === -1)
                  ? props.value.length === plants.length
                    ? []
                    : plants.map((plant) => plant.name)
                  : options.map((plant) => plant.name)
                : [],
            );
          } else {
            restored.current = { userId, remembered: event.target.value };
            select(userId, event.target.value);
            props.onChange(event);
          }
        }}
        isFilter={isFilter}
        disabled={disabled}
        name={name}
        validationEmpty={validationEmpty}
        loading={source === "catalog" && catalog.isLoading}
      />
      {error && (
        <FormHelperText data-error-for={name || "manufacturingPlantId"} error>
          {error}
        </FormHelperText>
      )}
    </>
  );
  return embedded ? field : <Grid size={size}>{field}</Grid>;
}
