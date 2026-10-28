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
  // Catálogos que dependen de otro campo (la planta o la zona).
  disabled?: boolean;
  loading?: boolean;
}

/** Select del formulario CIAEL con su mensaje de error debajo. */
export const CiaelSelectField = ({
  name,
  label,
  data,
  value,
  onChange,
  error,
  disabled,
  loading,
}: CiaelSelectFieldProps) => (
  <Grid
    size={{
      xs: 12,
      sm: 6,
      md: 4,
    }}
  >
    <SelectDefault
      data={data}
      label={label}
      value={value}
      onChange={onChange}
      name={name}
      disabled={disabled}
      loading={loading}
    />
    {error && (
      <FormHelperText data-error-for={name} error>
        {error}
      </FormHelperText>
    )}
  </Grid>
);
