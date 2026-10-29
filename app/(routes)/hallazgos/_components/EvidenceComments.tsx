import { useState } from "react";

import { Button } from "@mui/material";
import { Stack } from "@mui/material";
import { TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import { CommentEvidenceGraphql } from "@hooks";
import { EvidencesService } from "@services";
import { notify } from "@shared/utils";
import ListComments from "./ListComments";

interface Props {
  evidenceId: number;
  comments: CommentEvidenceGraphql[];
  onCommentsChange: (comments: CommentEvidenceGraphql[]) => void;
}

// Comentarios del hallazgo a la vista (antes, en una pestaña aparte) y el
// campo para agregar uno. Ctrl/Cmd + Enter también envía.
export default function EvidenceComments({
  evidenceId,
  comments,
  onCommentsChange,
}: Props) {
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const canSend = !!comment.trim() && !isSending;

  const send = () => {
    if (!canSend) return;
    setIsSending(true);
    EvidencesService.addComment(evidenceId, comment)
      .then((data) => {
        setComment("");
        notify("Comentario agregado correctamente", true);
        onCommentsChange(data.comments);
      })
      // El aviso lo muestra el interceptor; el texto se conserva para
      // reintentar.
      .catch(() => undefined)
      .finally(() => setIsSending(false));
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
