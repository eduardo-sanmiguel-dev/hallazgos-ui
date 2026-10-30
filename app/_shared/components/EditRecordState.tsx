"use client";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import { Paper } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import type { EditRecordStatus } from "@hooks/useEditRecord";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import FormContainer from "./FormContainer";
import PageHeader from "./PageHeader";
import { FormSkeleton } from "./Skeletons";

interface EditRecordStateProps {
  status: EditRecordStatus;
  onRetry: () => void;
  // Título de la página ("Editar proceso").
  title: string;
  // "Proceso no encontrado".
  notFoundTitle: string;
  // Lista a la que se regresa ("/processes").
  listHref: string;
}

// Lo que se ve en lugar del formulario de edición mientras el registro no
// está listo (useEditRecord): carga, no existe o no se pudo cargar.
export default function EditRecordState({
  status,
  onRetry,
  title,
  notFoundTitle,
  listHref,
}: EditRecordStateProps) {
  const router = useRouter();

  if (status === "loading") return <FormSkeleton sections={1} />;

  const back = (
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={() => router.push(listHref)}
    >
      Volver a la lista
    </Button>
  );

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs />
      <Paper variant="outlined" sx={{ p: 2 }}>
        {status === "notFound" ? (
          <EmptyState
            icon={<SearchOffIcon />}
            title={notFoundTitle}
            description="Puede que se haya eliminado. Vuelve a la lista para buscarlo."
          >
            {back}
          </EmptyState>
        ) : (
          <ErrorState
            offline={typeof navigator !== "undefined" && !navigator.onLine}
            onRetry={onRetry}
          >
            {back}
          </ErrorState>
        )}
      </Paper>
    </FormContainer>
  );
}
