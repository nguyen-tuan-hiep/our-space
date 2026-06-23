"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { Edit2, Trash2 } from "lucide-react";
import { useSnackbar } from "notistack";
import { deleteNote } from "@/app/actions";
import { formatAppDate } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

function getCountdown(unlockAt: string | null, nowMs: number) {
  if (!unlockAt) return "";
  const diff = new Date(unlockAt).getTime() - nowMs;
  if (diff <= 0) return "";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

interface NoteCardProps {
  note: SharedNote;
  currentUserId: string;
  initialNowMs: number;
  onEdit: (note: SharedNote) => void;
}

export function NoteCard({
  note,
  currentUserId,
  initialNowMs,
  onEdit,
}: NoteCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [now, setNow] = useState(initialNowMs);
  const [pending, startTransition] = useTransition();
  const locked = Boolean(note.unlock_at && now < new Date(note.unlock_at).getTime());
  const countdown = useMemo(
    () => getCountdown(note.unlock_at, now),
    [note.unlock_at, now],
  );
  const canEdit = note.author_id === currentUserId;

  useEffect(() => {
    if (!note.unlock_at) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [note.unlock_at]);

  return (
    <Card className="border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            From {note.author?.display_name ?? "Partner"} -{" "}
            {formatAppDate(note.created_at)}
          </p>
          <h3 className="mt-2 font-serif text-3xl leading-none">{note.title}</h3>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 gap-1">
            <Button
              aria-label="Edit note"
              size="small"
              onClick={() => onEdit(note)}
              className="min-w-0 px-2"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              aria-label="Delete note"
              size="small"
              color="error"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteNote(note.id);
                  enqueueSnackbar(result.message, {
                    variant: result.ok ? "success" : "error",
                  });
                })
              }
              className="min-w-0 px-2"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ) : null}
      </div>

      {locked ? (
        <div className="mt-5 border border-dashed border-neutral-300 bg-neutral-50 p-5">
          <p className="eyebrow">Unlocks in</p>
          <p className="mt-2 font-serif text-4xl">{countdown}</p>
          <Box className="mt-4 select-none blur-md">
            <p className="text-sm leading-7">{note.content}</p>
          </Box>
        </div>
      ) : (
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-neutral-700">
          {note.content}
        </p>
      )}

      {note.attachment_url && !locked ? (
        <a
          href={note.attachment_url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block text-sm font-semibold text-lagoon underline"
        >
          Open attachment
        </a>
      ) : null}
    </Card>
  );
}
