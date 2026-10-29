import { Avatar } from "@mui/material";
import { Box } from "@mui/material";
import { Stack } from "@mui/material";
import { Typography } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

import { stringToDateWithTime } from "@shared/utils";
import { CommentEvidenceGraphql } from "@hooks";

interface Props {
  comments: CommentEvidenceGraphql[];
}

/** Iniciales para el avatar: "Ana María López" → "AL". */
const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

// Conversación del hallazgo: de la más antigua a la más reciente, con las
// iniciales de quien escribió (antes, la misma foto de internet para todos).
export default function ListComments({ comments }: Props) {
  if (!comments.length) {
    return (
      <Stack
        spacing={1}
        sx={{ alignItems: "center", py: 3, color: "text.secondary" }}
      >
        <ChatBubbleOutlineIcon aria-hidden />
        <Typography variant="body2">
          Todavía no hay comentarios. Usa este espacio para dar seguimiento.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      component="ol"
      aria-label="Comentarios"
      spacing={2}
      sx={{ listStyle: "none", m: 0, p: 0 }}
    >
      {comments.map((comment) => (
        <Stack
          key={comment.id}
          component="li"
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "flex-start" }}
        >
          <Avatar
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              fontSize: "0.8125rem",
              fontWeight: 600,
              bgcolor: "action.selected",
              color: "text.primary",
            }}
          >
            {initialsOf(comment.user.name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "baseline", flexWrap: "wrap" }}
            >
              <Typography variant="subtitle2" component="span">
                {comment.user.name}
              </Typography>
              <Typography
                variant="caption"
                component="span"
                sx={{ color: "text.secondary" }}
              >
                {stringToDateWithTime(comment.createdAt)}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {comment.comment}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
