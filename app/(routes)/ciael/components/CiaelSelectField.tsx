"use client";

import type { ComponentProps } from "react";

import { Grid } from "@mui/material";
import { FormHelperText } from "@mui/material";

import SelectDefault from "@components/SelectDefault";

type SelectDefaultProps = ComponentProps<typeof SelectDefault>;

interface CiaelSelectFieldProps {
  name: string;
  label: string;
  data: SelectDefaultProps["data"];
  value: SelectDefaultProps["value"];
  onChange: SelectDefaultProps["onChange"];
  error?: string;
}

/** Select del formulario CIAEL con su mensaje de error debajo. */
export const CiaelSelectField = ({
  name,
  label,
  data,
  value,
  onChange,
  error,
}: CiaelSelectFieldProps) => (
  <Grid
    size={{
      xs: 12,
      sm: 4,
      md: 2,
    }}
  >
    <SelectDefault
      data={data}
      label={label}
      value={value}
      onChange={onChange}
      name={name}
    />
    {error && (
      <FormHelperText data-error-for={name} error>
        {error}
      </FormHelperText>
    )}
  </Grid>
);
