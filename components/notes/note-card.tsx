"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";
import Card from "@mui/material/Card";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Edit2, Trash2, EllipsisVertical } from "lucide-react";
import { useSnackbar } from "notistack";
import { deleteNote } from "@/app/actions";
import { formatAppDateTime } from "@/lib/date-format";
import type { SharedNote } from "@/lib/types";

const ConfirmDialog = dynamic(
  () => import("@/components/confirm-dialog").then((mod) => mod.ConfirmDialog),
  { ssr: false },
);

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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const locked = Boolean(
    note.unlock_at && now < new Date(note.unlock_at).getTime(),
  );
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    onEdit(note);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setConfirmOpen(true);
  };

  return (
    <Card className="flex h-[20rem] flex-col overflow-hidden border border-neutral-200 bg-paper p-5 !shadow-lg">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] uppercase tracking-[0.1em] text-neutral-600">
            <span>From</span>
            <span className="font-semibold">
              {note.author?.display_name ?? "Partner"}{" "}
              {note.author?.avatar_url ?? "🙂"}
            </span>
          </div>
          <div className="text-[12px] text-neutral-400">
            {formatAppDateTime(note.created_at, timeZone)}
          </div>
          <h3 className="my-4 mt-3 font-serif text-2xl leading-none">
            {note.title}
          </h3>
        </div>

        {canEdit && (
          <div className="shrink-0 -mt-1 -mr-2">
            <IconButton
              aria-label="more"
              id="note-menu-button"
              aria-controls={menuOpen ? "note-menu" : undefined}
              aria-expanded={menuOpen ? "true" : undefined}
              aria-haspopup="true"
              onClick={handleMenuOpen}
              size="small"
            >
              <EllipsisVertical size={20} className="text-neutral-500" />
            </IconButton>
            <Menu
              id="note-menu"
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "note-menu-button",
              }}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleEditClick}>
                <ListItemIcon>
                  <Edit2 size={16} />
                </ListItemIcon>
                <ListItemText>Edit</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDeleteClick} className="text-danger">
                <ListItemIcon>
                  <Trash2 size={16} className="text-danger" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </div>
        )}
      </div>

      {confirmOpen ? (
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
      ) : null}

      {locked ? (
        <div className="flex min-h-0 flex-1 flex-col border border-dashed border-neutral-400 bg-paper p-5">
          <p className="eyebrow">Unlocks in</p>
          <p className="mt-2 font-serif text-3xl">{countdown}</p>
          <div className="relative mt-4 min-h-0 flex-1 overflow-hidden select-none blur-md">
            <div className="h-full overflow-y-auto">
              <p className="whitespace-pre-line text-sm leading-7">
                {note.content}
              </p>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent" />
          </div>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 border border-dashed border-neutral-400 overflow-hidden rounded-lg">
          <div className="h-full overflow-y-auto">
            <p className="whitespace-pre-line text-md leading-6 text-neutral-700 m-4 mb-6">
              {note.content}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent" />
        </div>
      )}
    </Card>
  );
}
