import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@mui/material";
import { Stack } from "@mui/material";
import { TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import type { EvidenceRowComment } from "@interfaces";
import { EvidencesService } from "@services";
import { notify } from "@shared/utils";
import ListComments from "./ListComments";

interface Props {
  evidenceId: number;
  comments: EvidenceRowComment[];
  onCommentsChange: (comments: EvidenceRowComment[]) => void;
}

// Comentarios del hallazgo a la vista (antes, en una pestaña aparte) y el
// campo para agregar uno. Ctrl/Cmd + Enter también envía.
export default function EvidenceComments({
  evidenceId,
  comments,
  onCommentsChange,
}: Props) {
  const [comment, setComment] = useState("");
  // Si falla, el aviso lo muestra el interceptor; el texto se conserva
  // para reintentar.
  const commentMutation = useMutation({
    mutationFn: (text: string) => EvidencesService.addComment(evidenceId, text),
    onSuccess: (data) => {
      setComment("");
      notify("Comentario agregado correctamente", true);
      onCommentsChange(data.comments);
    },
  });
  const isSending = commentMutation.isPending;
  const canSend = !!comment.trim() && !isSending;

  const send = () => {
    if (!canSend) return;
    commentMutation.mutate(comment);
  };

  return (
    <Stack spacing={2}>
      <ListComments comments={comments} />
      <Stack spacing={1}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Agregar comentario"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              send();
            }
          }}
          helperText="Ctrl + Enter para enviar"
          disabled={isSending}
        />
        <Button
          variant="contained"
          onClick={send}
          disabled={!canSend}
          loading={isSending}
          loadingPosition="start"
          startIcon={<SendIcon />}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
        >
          Comentar
        </Button>
      </Stack>
    </Stack>
  );
}
