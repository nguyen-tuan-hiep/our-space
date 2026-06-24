"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { Edit2, Trash2 } from "lucide-react";
import { useSnackbar } from "notistack";
import { deleteNote } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AvatarIcon } from "@/components/avatar-icon";
import { formatAppDateTime } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

const actionButtonClassName =
  "grid size-9 place-items-center rounded-full border border-neutral-200 bg-[#fffaf0] text-ink transition hover:border-neutral-300 hover:bg-[#f5f3ee] hover:shadow-sm";

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
  timeZone: string;
  onEdit: (note: SharedNote) => void;
}

export function NoteCard({
  note,
  currentUserId,
  initialNowMs,
  timeZone,
  onEdit,
}: NoteCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [now, setNow] = useState(initialNowMs);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    <Card className="border border-neutral-200 bg-[#fffaf0] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            <span>From</span>
            <span className="font-semibold">
              {note.author?.display_name ?? "Partner"}
            </span>
            <AvatarIcon
              value={note.author?.avatar_url ?? null}
              label={note.author?.display_name ?? "Partner"}
              className="grid size-4 shrink-0 place-items-center rounded-full text-[10px] leading-none"
            />
            <span>- {formatAppDateTime(note.created_at, timeZone)}</span>
          </div>
          <h3 className="mt-2 font-serif text-3xl leading-none">{note.title}</h3>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 gap-2">
            <Button
              aria-label="Edit note"
              variant="outlined"
              onClick={() => onEdit(note)}
              className={actionButtonClassName}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              aria-label="Delete note"
              variant="outlined"
              disabled={pending}
              onClick={() => setConfirmOpen(true)}
              className={`${actionButtonClassName} text-[#c24d5e] hover:border-[#e7bcc4] hover:bg-[#fdecef]`}
            >
              <Trash2 size={16} className="text-[#c24d5e]" />
            </Button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete note?"
        description="This note will be permanently removed for both of you."
        confirmLabel="Delete note"
        pending={pending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteNote(note.id);
            enqueueSnackbar(result.message, {
              variant: result.ok ? "success" : "error",
            });
            if (result.ok) setConfirmOpen(false);
          })
        }
      />

      {locked ? (
        <div className="mt-5 border border-dashed border-neutral-300 bg-[#fffaf0] p-5">
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

    </Card>
  );
}
