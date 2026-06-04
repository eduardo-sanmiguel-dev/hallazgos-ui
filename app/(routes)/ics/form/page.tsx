"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";
import { Checkbox } from "@mui/material";
import { Autocomplete } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { v4 as uuidv4 } from "uuid";

import { EmployeesService, IcsService } from "@services";
import { CatalogICS, Employee } from "@interfaces";
import SelectDefault from "@components/SelectDefault";
import { Paper, SelectChangeEvent, TextField } from "@mui/material";
import { useUserSessionStore } from "@store";
import ImageORCamera from "@shared/components/ImageORCamera";
import { dataURLtoFile } from "@shared/utils";

const IcsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idCurrent, setIdCurrent] = useState<number>(0);
  const [catalogs, setCatalogs] = useState<CatalogICS[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [image, setImage] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [form, setForm] = useState<{
    totalPeople: string;
    description: string;
    manufacturingPlant: string;
    ruleOfLife: string;
    standardOfBehavior: string;
    areaOfBehavior: string;
    employees: string[];
  }>({
    totalPeople: "",
    description: "",
    manufacturingPlant: "",
    ruleOfLife: "",
    standardOfBehavior: "",
    areaOfBehavior: "",
    employees: [],
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  useEffect(() => {
    IcsService.catalogs().then((data) => setCatalogs(data));
  }, []);

  const save = () => {
    const manufacturingPlantId = form.manufacturingPlant;
    const totalPeopleClean = form.totalPeople.trim();
    const ruleOfLifeId = form.ruleOfLife;
    const standardOfBehaviorId = form.standardOfBehavior;
    const areaOfBehaviorId = form.areaOfBehavior;
    const employeesIds = form.employees.map((id) => Number(id));
    const sizeEmployees = employeesIds.length;

    if (!manufacturingPlantId) {
      toast.error("La planta de manufactura es obligatoria");
      return;
    }

    if (!totalPeopleClean) {
      toast.error("El número de personas observadas es obligatorio");
      return;
    }

    if (!ruleOfLifeId) {
      toast.error("La regla de vida es obligatoria");
      return;
    }

    if (!sizeEmployees) {
      toast.error("Debe seleccionar al menos un colaborador");
      return;
    }

    if (Number(totalPeopleClean) < sizeEmployees) {
      toast.error(
        "El número de personas totales no puede ser menor al número de colaboradores que no cumplen con el estándar",
      );
      return;
    }

    const descriptionClean = form.description.trim();

    setIsLoading(true);

    const formData = new FormData();

    formData.append("manufacturingPlantId", manufacturingPlantId);
    formData.append("totalPeople", totalPeopleClean);
    formData.append("ruleOfLifeId", ruleOfLifeId);
    if (standardOfBehaviorId) {
      formData.append("standardOfBehaviorId", standardOfBehaviorId);
    }
    if (areaOfBehaviorId) {
      formData.append("areaOfBehaviorId", areaOfBehaviorId);
    }
    if (descriptionClean) {
      formData.append("description", descriptionClean);
    }

    employeesIds.forEach((id, idx) =>
      formData.append(`employeesIds[${idx}]`, String(id)),
    );

    const uuid = uuidv4();

    if (image) {
      formData.append("file", dataURLtoFile(image, `${uuid}-evidence.png`));
    } else if (attachedFile) {
      const extension = attachedFile.name.split(".").pop();

      const nameWithUuid = `${uuid}-evidence.${extension}`;

      formData.append("file", attachedFile, nameWithUuid);
    }

    if (!idCurrent) {
      IcsService.create(formData)
        .then(() => {
          toast.success("Ics creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
    /* else {
      IcsService.update(idCurrent, payload)
        .then(() => {
          toast.success("Ics actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } */
  };

  const cancel = () => {
    router.push("/ics");
  };

  const isValidateForm = useMemo(
    () =>
      !form.totalPeople?.trim() ||
      !form.manufacturingPlant ||
      !form.ruleOfLife ||
      !form.employees.length,
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    IcsService.findOne(id).then((data) => {
      console.log({ data });
      /* setForm({
        totalPeople: `${data.totalPeople}`,
      }); */
    });
  }, [searchParams]);

  const onChangeSelect = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      standardOfBehavior: "",
      areaOfBehavior: "",
    }));
  }, [form.ruleOfLife]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      areaOfBehavior: "",
    }));
  }, [form.standardOfBehavior]);

  useEffect(() => {
    if (form.manufacturingPlant) {
      const manufacturingPlantId = form.manufacturingPlant;
      EmployeesService.findAll({
        manufacturingPlantId: Number(manufacturingPlantId),
      }).then(setEmployees);

      setForm((prev) => ({
        ...prev,
        employees: [],
      }));
    }
  }, [form.manufacturingPlant]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta *"
            value={form.manufacturingPlant}
            onChange={onChangeSelect}
            name="manufacturingPlant"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={catalogs || []}
            label="Regla de vida *"
            value={form.ruleOfLife}
            onChange={onChangeSelect}
            name="ruleOfLife"
          />
        </Grid>
        {(
          catalogs.find((cat) => Number(cat.id) === Number(form.ruleOfLife))
            ?.standards || []
        ).length > 0 && (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <SelectDefault
              data={
                catalogs.find(
                  (cat) => Number(cat.id) === Number(form.ruleOfLife),
                )?.standards || []
              }
              label="Estandar de comportamiento *"
              value={form.standardOfBehavior}
              onChange={onChangeSelect}
              name="standardOfBehavior"
            />
          </Grid>
        )}
        {(
          (
            catalogs.find((cat) => Number(cat.id) === Number(form.ruleOfLife))
              ?.standards || []
          ).find((cat) => Number(cat.id) === Number(form.standardOfBehavior))
            ?.areas || []
        ).length > 0 && (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <SelectDefault
              data={
                (
                  catalogs.find(
                    (cat) => Number(cat.id) === Number(form.ruleOfLife),
                  )?.standards || []
                ).find(
                  (cat) => Number(cat.id) === Number(form.standardOfBehavior),
                )?.areas || []
              }
              label="Área *"
              value={form.areaOfBehavior}
              onChange={onChangeSelect}
              name="areaOfBehavior"
            />
          </Grid>
        )}
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Paper>
            <TextField
              fullWidth
              label="Personas totales *"
              variant="outlined"
              value={form.totalPeople}
              autoComplete="off"
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              onKeyDown={(evt) => {
                const forbidden = ["e", "E", "-", "+"];
                if (forbidden.includes(evt.key)) evt.preventDefault();
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (!/^\d+$/.test(text) || Number(text) <= 0)
                  e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                const num = Number(val);
                if (val === "" || (!Number.isNaN(num) && num > 0)) {
                  setForm({
                    ...form,
                    totalPeople: val,
                  });
                }
              }}
            />
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          {!!employees.length ? (
            <Paper>
              <Autocomplete
                multiple
                options={employees}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Personas que no cumplen con el estándar *"
                  />
                )}
                value={employees.filter((emp) =>
                  form.employees.includes(String(emp.id)),
                )}
                onChange={(_, newValue) => {
                  setForm({
                    ...form,
                    employees: newValue.map((emp) => String(emp.id)),
                  });
                }}
              />
            </Paper>
          ) : form.manufacturingPlant && !employees.length ? (
            <p>No hay colaboradores disponibles</p>
          ) : (
            <p>Seleccione una planta, para ver los colaboradores.</p>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 6,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <TextField
              id="description-multiline"
              multiline
              rows={4}
              variant="standard"
              fullWidth
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              label={"Descripción (opcional)"}
            />
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <ImageORCamera
            setImage={setImage}
            image={image}
            setAttachedFile={setAttachedFile}
            attachedFile={attachedFile}
          />
        </Grid>
      </Grid>
      <Grid
        container
        spacing={2}
        sx={{ marginTop: 2, alignContent: "center", justifyContent: "center" }}
      >
        <Grid
          size={{
            xs: 12,
            sm: 3,
            md: 3,
          }}
        >
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<CloseIcon />}
            onClick={cancel}
          >
            Cancelar
          </Button>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 3,
            md: 3,
          }}
        >
          <Button
            loading={isLoading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            variant="contained"
            color="primary"
            fullWidth
            onClick={save}
            disabled={isValidateForm || isLoading}
          >
            Guardar
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default IcsFormPage;

